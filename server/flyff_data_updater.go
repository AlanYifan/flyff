/**
 * @file flyff_data_updater.go
 * @description FlyFF 数据增量更新服务
 * @description 提供版本比对、ID列表差异比对、增量详情拉取、JS数据文件写入功能
 * @description 前端一键更新流程：版本比对 → 物品增量 → 怪物增量 → 技能增量
 * @description 使用全局进度状态 + 前端轮询实现实时进度展示
 * @description 支持中止后断点续传：跳过版本比对和已完成类别，直接从中断处继续
 */
package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
	"sync"
	"time"
)

/** FlyFF 官方 API 基础地址 */
const flyffAPIBaseURL = "https://api.flyff.com"

/** 全局数据库实例（由 main.go 注入） */
var globalDB *sql.DB

/** 每分钟最大请求数（官方限制 300，留 10 余量） */
const maxRequestsPerMinute = 290

/** 每次请求间隔（毫秒） */
const baseDelayMs = 210

/** 更新类别顺序（数据拉取） */
var updateCategories = []string{"item", "monster", "skill", "equipset", "achievement"}

/** 图片下载类别顺序（数据拉取完成后按此顺序下载图片） */
var imageCategories = []string{"item", "monster", "skill"}

/** 逐条CNS比对类别（仅在版本变化时执行，对已有条目逐条请求API比对 name.cns / description.cns） */
var cnsCompareCategories = []string{"item", "monster", "skill", "achievement"}

// ==================== 全局进度状态（前端轮询读取） ====================

/**
 * @typedef UpdateProgress
 * @description 全局更新进度状态，前端通过 GET /api/data/progress 轮询读取
 */
type UpdateProgress struct {
	Running             bool                   `json:"running"`
	Step                string                 `json:"step,omitempty"`
	Message             string                 `json:"message"`
	Current             int                    `json:"current"`
	Total               int                    `json:"total"`
	Percent             int                    `json:"percent"`
	TotalSteps          int                    `json:"totalSteps,omitempty"`
	Aborted             bool                   `json:"aborted,omitempty"`
	Completed           bool                   `json:"completed,omitempty"`
	CanResume           bool                   `json:"canResume,omitempty"`
	EstimatedSec        int                    `json:"estimatedSec,omitempty"`
	Result              *BatchUpdateResult     `json:"result,omitempty"`
	Logs                []ProgressLogEntry     `json:"logs,omitempty"`
	CompletedCategories []string               `json:"completedCategories,omitempty"`
	VersionResult       *VersionCompareResult  `json:"versionResult,omitempty"`
	SkippedCount        int                    `json:"skippedCount,omitempty"`
	TotalMissing        int                    `json:"totalMissing,omitempty"`
	/** 实时CNS比对结果（前端轮询读取，运行中即可展示进度） */
	FieldResults []FieldUpdateResult `json:"fieldResults,omitempty"`
	/** 实时图片下载结果（前端轮询读取，运行中即可展示进度） */
	ImageResults []ImageDownloadResult `json:"imageResults,omitempty"`
	/** 实时数据更新结果（前端轮询读取，运行中即可展示进度） */
	CategoryResults []DataUpdateResult `json:"categoryResults,omitempty"`
	mu                  sync.RWMutex
	stepStartTime       time.Time
	stepStartCurrent    int
}

type ProgressLogEntry struct {
	Type      string `json:"type"`
	Message   string `json:"message"`
	Timestamp int64  `json:"timestamp"`
	/* 自增序号：日志缓冲区会截断前部，前端必须靠序号（而非数组下标）判断哪些是新日志 */
	Seq int64 `json:"seq"`
}

/* 日志自增序号，跨更新任务持续递增，保证前端游标不会因截断而错位 */
var progressLogSeq int64

var globalProgress = &UpdateProgress{}

func resetProgress() {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	globalProgress.Running = true
	globalProgress.Step = ""
	globalProgress.Message = ""
	globalProgress.Current = 0
	globalProgress.Total = 0
	globalProgress.Percent = 0
	globalProgress.TotalSteps = 0
	globalProgress.Aborted = false
	globalProgress.Completed = false
	globalProgress.CanResume = false
	globalProgress.EstimatedSec = 0
	globalProgress.Result = nil
	globalProgress.Logs = nil
	globalProgress.CompletedCategories = nil
	globalProgress.VersionResult = nil
	globalProgress.stepStartTime = time.Time{}
	globalProgress.stepStartCurrent = 0
	globalProgress.SkippedCount = 0
	globalProgress.TotalMissing = 0
	globalProgress.FieldResults = nil
	globalProgress.ImageResults = nil
	globalProgress.CategoryResults = nil
}

/** 设置全局总步骤数（前端用于计算全局进度百分比） */
func setTotalSteps(steps int) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	globalProgress.TotalSteps = steps
}

func updateProgressState(step, message string, current, total, percent int) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()

	if step != globalProgress.Step {
		globalProgress.stepStartTime = time.Now()
		globalProgress.stepStartCurrent = current
	}

	globalProgress.Step = step
	globalProgress.Message = message
	globalProgress.Current = current
	globalProgress.Total = total
	globalProgress.Percent = percent

	if current > globalProgress.stepStartCurrent && !globalProgress.stepStartTime.IsZero() {
		elapsed := time.Since(globalProgress.stepStartTime).Seconds()
		done := current - globalProgress.stepStartCurrent
		remaining := total - current
		if done > 0 && remaining > 0 {
			globalProgress.EstimatedSec = int(elapsed / float64(done) * float64(remaining))
		}
	}
}

func addProgressLog(logType, message string) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	progressLogSeq++
	entry := ProgressLogEntry{
		Type:      logType,
		Message:   message,
		Timestamp: time.Now().UnixMilli(),
		Seq:       progressLogSeq,
	}
	if len(globalProgress.Logs) > 200 {
		globalProgress.Logs = globalProgress.Logs[len(globalProgress.Logs)-199:]
	}
	globalProgress.Logs = append(globalProgress.Logs, entry)
}

/**
 * @function updateProgressFieldResult
 * @description 实时更新全局进度中的CNS比对结果（追加或更新对应类别的结果）
 * @param {FieldUpdateResult} fr - CNS比对结果
 */
func updateProgressFieldResult(fr FieldUpdateResult) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	/* 查找是否已有该类别的结果，有则替换，无则追加 */
	for i, existing := range globalProgress.FieldResults {
		if existing.Category == fr.Category {
			globalProgress.FieldResults[i] = fr
			return
		}
	}
	globalProgress.FieldResults = append(globalProgress.FieldResults, fr)
}

/**
 * @function updateProgressImageResult
 * @description 实时更新全局进度中的图片下载结果（追加或更新对应类别的结果）
 * @param {ImageDownloadResult} ir - 图片下载结果
 */
func updateProgressImageResult(ir ImageDownloadResult) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	for i, existing := range globalProgress.ImageResults {
		if existing.Category == ir.Category {
			globalProgress.ImageResults[i] = ir
			return
		}
	}
	globalProgress.ImageResults = append(globalProgress.ImageResults, ir)
}

/**
 * @function updateProgressCategoryResult
 * @description 实时更新全局进度中的数据更新结果（追加或更新对应类别的结果）
 * @param {DataUpdateResult} dr - 数据更新结果
 */
func updateProgressCategoryResult(dr DataUpdateResult) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	for i, existing := range globalProgress.CategoryResults {
		if existing.Category == dr.Category {
			globalProgress.CategoryResults[i] = dr
			return
		}
	}
	globalProgress.CategoryResults = append(globalProgress.CategoryResults, dr)
}

/** 记录已完成的类别 */
func addCompletedCategory(category string) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	for _, c := range globalProgress.CompletedCategories {
		if c == category {
			return
		}
	}
	globalProgress.CompletedCategories = append(globalProgress.CompletedCategories, category)
}

/** 记录版本比对结果（续传时使用） */
func setVersionResult(vr *VersionCompareResult) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	globalProgress.VersionResult = vr
}

func completeProgress(result *BatchUpdateResult) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	globalProgress.Running = false
	globalProgress.Completed = true
	globalProgress.Percent = 100
	globalProgress.EstimatedSec = 0
	globalProgress.Result = result
	globalProgress.CanResume = false
}

func abortProgress(message string) {
	globalProgress.mu.Lock()
	defer globalProgress.mu.Unlock()
	globalProgress.Running = false
	globalProgress.Aborted = true
	globalProgress.CanResume = true
	globalProgress.Message = message
}

func readProgress() UpdateProgress {
	globalProgress.mu.RLock()
	defer globalProgress.mu.RUnlock()
	cp := *globalProgress
	cp.mu = sync.RWMutex{}
	return cp
}

// ==================== 全局中止控制 ====================

type UpdateAbortController struct {
	aborted bool
	mu      sync.Mutex
}

var globalAbortController = &UpdateAbortController{}

func isAborted() bool {
	globalAbortController.mu.Lock()
	defer globalAbortController.mu.Unlock()
	return globalAbortController.aborted
}

func setAborted(val bool) {
	globalAbortController.mu.Lock()
	defer globalAbortController.mu.Unlock()
	globalAbortController.aborted = val
}

// ==================== 更新任务互斥锁（防止并发重复任务） ====================

/**
 * @description 更新任务运行权守卫，保证同一时刻只有一个更新/续传/重试任务在运行。
 * @description 启动、续传、重试入口统一通过 tryAcquireUpdateRun 原子抢占，运行结束后 releaseUpdateRun 释放。
 * @description 缺少此锁时，并发请求会同时通过 Running 检查，导致多个 goroutine 共享进度状态并同时写同一JS文件。
 */
var updateRunGuard struct {
	mu      sync.Mutex
	running bool
}

/** 尝试获取更新任务运行权，已有任务运行时返回 false */
func tryAcquireUpdateRun() bool {
	updateRunGuard.mu.Lock()
	defer updateRunGuard.mu.Unlock()
	if updateRunGuard.running {
		return false
	}
	updateRunGuard.running = true
	return true
}

/** 释放更新任务运行权 */
func releaseUpdateRun() {
	updateRunGuard.mu.Lock()
	updateRunGuard.running = false
	updateRunGuard.mu.Unlock()
}

// ==================== 数据类型定义 ====================

type DataUpdateResult struct {
	Category       string `json:"category"`
	TotalRemote    int    `json:"totalRemote"`
	TotalLocal     int    `json:"totalLocal"`
	NewCount       int    `json:"newCount"`
	FailedCount    int    `json:"failedCount"`
	FailedIds      []int  `json:"failedIds,omitempty"`
	RedundantCount int    `json:"redundantCount"`
	RedundantIds   []int  `json:"redundantIds,omitempty"`
	Error          string `json:"error,omitempty"`
	FileUpdated    bool   `json:"fileUpdated"`
	IDListSaved    bool   `json:"idListSaved"`
}

/**
 * @typedef ImageDownloadResult
 * @description 单个类别的图片下载结果
 */
type ImageDownloadResult struct {
	Category       string `json:"category"`
	TotalIcons     int    `json:"totalIcons"`
	Downloaded     int    `json:"downloaded"`
	Skipped        int    `json:"skipped"`
	Failed         int    `json:"failed"`
	FailedIconIds  []string `json:"failedIconIds,omitempty"`
	Error          string `json:"error,omitempty"`}

type VersionCompareResult struct {
	RemoteVersion string `json:"remoteVersion"`
	LocalVersion  string `json:"localVersion"`
	NeedsUpdate   bool   `json:"needsUpdate"`
}

/**
 * @typedef FieldUpdateResult
 * @description 单个类别的字段比对更新结果（CNS名称和description）
 */
type FieldUpdateResult struct {
	Category          string `json:"category"`
	TotalCompared     int    `json:"totalCompared"`
	NameCnsUpdated    int    `json:"nameCnsUpdated"`
	DescCnsUpdated    int    `json:"descCnsUpdated"`
	Skipped           int    `json:"skipped"`
	Failed            int    `json:"failed"`
	FailedIds         []int  `json:"failedIds,omitempty"`
	Error             string `json:"error,omitempty"`
}

type BatchUpdateResult struct {
	Version           VersionCompareResult   `json:"version"`
	Results           []DataUpdateResult     `json:"results"`
	ImageResults      []ImageDownloadResult  `json:"imageResults,omitempty"`
	FieldResults      []FieldUpdateResult    `json:"fieldResults,omitempty"`
	Message           string                 `json:"message"`
	FailedIdsMap      map[string][]int       `json:"failedIdsMap,omitempty"`
}

/**
 * @typedef RetryIdsRequest
 * @description 失败ID重试请求体，按类别传入需要重试的ID（类别名与后端类别一致）
 */
type RetryIdsRequest struct {
	Item        []int `json:"item"`
	Monster     []int `json:"monster"`
	Skill       []int `json:"skill"`
	Achievement []int `json:"achievement"`
}

/**
 * @typedef RetryCategoryResult
 * @description 单个类别的失败ID重试结果
 */
type RetryCategoryResult struct {
	Category  string `json:"category"`
	Retried   int    `json:"retried"`
	Succeeded int    `json:"succeeded"`
	Failed    int    `json:"failed"`
	FailedIds []int  `json:"failedIds,omitempty"`
}

// ==================== 速率限制器 ====================

type RateLimiter struct {
	count       int
	windowStart int64
	mu          sync.Mutex
}

func NewRateLimiter() *RateLimiter {
	return &RateLimiter{
		count:       0,
		windowStart: time.Now().UnixMilli(),
	}
}

func (rl *RateLimiter) Wait() bool {
	if isAborted() {
		return true
	}

	rl.mu.Lock()
	now := time.Now().UnixMilli()
	/* 先按时间窗口无条件重置：原实现把重置写在「已超限」分支里，
	 * 而 210ms 的节奏下计数达到上限时窗口必然已超过 60s，导致重置分支永远进不去、
	 * 计数只增不减，每分钟上限实际失效。 */
	if now-rl.windowStart >= 60000 {
		rl.windowStart = now
		rl.count = 0
	}
	rl.count++
	elapsed := now - rl.windowStart
	overLimit := rl.count > maxRequestsPerMinute
	rl.mu.Unlock()

	if overLimit {
		/* 超出窗口上限：等待本窗口结束 */
		remaining := 60000 - elapsed
		for remaining > 0 {
			if isAborted() {
				return true
			}
			sleepMs := int64(100)
			if remaining < sleepMs {
				sleepMs = remaining
			}
			time.Sleep(time.Duration(sleepMs) * time.Millisecond)
			remaining -= sleepMs
		}
		rl.mu.Lock()
		rl.count = 1
		rl.windowStart = time.Now().UnixMilli()
		rl.mu.Unlock()
		return isAborted()
	}

	time.Sleep(time.Duration(baseDelayMs) * time.Millisecond)
	return isAborted()
}

// ==================== 项目路径工具 ====================

/**
 * @function isDistMode
 * @description 检测当前是否为 dist 部署模式（exe 在 dist/ 目录下）
 * @description 通过检查 exe 同级目录是否存在 index.html 来判断
 * @description dist 模式下资源应从 dist 目录自身加载，不依赖项目源码目录
 * @returns {bool} true 表示 dist 部署模式，false 表示开发模式（exe 在 server/ 下）
 */
func isDistMode() bool {
	execPath, _ := os.Executable()
	execDir := filepath.Dir(execPath)
	indexPath := filepath.Join(execDir, "index.html")
	_, err := os.Stat(indexPath)
	return err == nil
}

/**
 * @function getExeDir
 * @description 获取可执行文件所在目录
 * @returns {string} 可执行文件所在目录的绝对路径
 */
func getExeDir() string {
	execPath, _ := os.Executable()
	return filepath.Dir(execPath)
}

/**
 * @function getProjectRoot
 * @description 获取项目根目录路径
 * @description 优先从环境变量 FLYFF_PROJECT_ROOT 读取，未设置时根据可执行文件位置推断
 * @description 开发模式（exe 在 server/ 目录下）：根目录为上级目录（项目根）
 * @description dist 部署模式（exe 在 dist/ 目录下）：根目录为 exe 所在目录（dist 自身）
 * @description 这样确保 dist 目录完全自包含，不依赖外部项目源码
 * @returns {string} 项目根目录绝对路径
 */
func getProjectRoot() string {
	// 优先使用环境变量，支持自定义项目根目录
	if root := os.Getenv("FLYFF_PROJECT_ROOT"); root != "" {
		return root
	}
	// dist 部署模式：exe 所在目录即为根目录（自包含）
	if isDistMode() {
		return getExeDir()
	}
	// 开发模式：exe 在 server/ 下，根目录为上级（项目根）
	return filepath.Dir(getExeDir())
}

/**
 * @function getSrcDataDir
 * @description 获取源码数据目录路径（src/data）
 * @description 此目录存放原始 JS 数据文件，仅供数据更新器写入
 * @description 开发模式：项目根目录下的 src/data
 * @description dist 部署模式：exe 同级的 src/data（自动创建）
 * @returns {string} src/data 目录绝对路径
 */
func getSrcDataDir() string {
	return filepath.Join(getProjectRoot(), "src", "data")
}

/**
 * @function getPublicDataDir
 * @description 获取公共数据目录路径
 * @description 此目录存放 JSON 格式的 ID 列表和版本信息
 * @description 开发模式：项目根目录下的 public/data
 * @description dist 部署模式：exe 同级的 data（Vite 构建时将 public/data 复制到 dist/data）
 * @returns {string} 公共数据目录绝对路径
 */
func getPublicDataDir() string {
	if isDistMode() {
		// dist 模式：public/data 被构建为 dist/data
		return filepath.Join(getExeDir(), "data")
	}
	// 开发模式：public/data
	return filepath.Join(getProjectRoot(), "public", "data")
}

func getVersionFilePath() string {
	return filepath.Join(getPublicDataDir(), "version.json")
}

/**
 * @function getIDListFilePath
 * @description 获取类别对应的ID列表缓存文件路径
 * @param {string} category - 类别（item/monster/skill/equipset）
 * @returns {string} ID列表文件路径
 * @description equipset类别保存为 SET_ID.json，其余为 {category}_id.json
 */
func getIDListFilePath(category string) string {
	switch category {
	case "equipset":
		return filepath.Join(getPublicDataDir(), "SET_ID.json")
	default:
		return filepath.Join(getPublicDataDir(), fmt.Sprintf("%s_id.json", category))
	}
}

func getTargetJsFilePath(category string) string {
	switch category {
	case "item":
		return filepath.Join(getSrcDataDir(), "ITEM_INFO.js")
	case "monster":
		return filepath.Join(getSrcDataDir(), "MONSTER_INFO.js")
	case "skill":
		return filepath.Join(getSrcDataDir(), "SKILL_INFO.js")
	case "equipset":
		return filepath.Join(getSrcDataDir(), "SQ_SET.js")
	case "achievement":
		return filepath.Join(getSrcDataDir(), "ACHIEVEMENT_INFO.js")
	default:
		return ""
	}
}

func getExportName(category string) string {
	switch category {
	case "item":
		return "ITEM_INFO"
	case "monster":
		return "MONSTER_INFO"
	case "skill":
		return "SKILL_INFO"
	case "equipset":
		return "SQ_SET"
	case "achievement":
		return "ACHIEVEMENT_INFO"
	default:
		return ""
	}
}

func getAPIEndpoint(category string) string {
	switch category {
	case "item":
		return "item"
	case "monster":
		return "monster"
	case "skill":
		return "skill"
	case "equipset":
		return "equipset"
	case "achievement":
		return "achievement"
	default:
		return ""
	}
}

func getCategoryName(category string) string {
	switch category {
	case "item":
		return "物品"
	case "monster":
		return "怪物"
	case "skill":
		return "技能"
	case "equipset":
		return "套装"
	case "achievement":
		return "成就"
	default:
		return category
	}
}

/**
 * @function intsToString
 * @description 将整数切片转为逗号分隔的字符串，限制最大显示数量
 * @param {[]int} ids - 整数切片
 * @param {int} maxCount - 最大显示数量
 * @returns {string} 格式化字符串
 */
func intsToString(ids []int, maxCount int) string {
	if len(ids) == 0 {
		return ""
	}
	limit := len(ids)
	if limit > maxCount {
		limit = maxCount
	}
	parts := make([]string, limit)
	for i := 0; i < limit; i++ {
		parts[i] = fmt.Sprintf("%d", ids[i])
	}
	result := strings.Join(parts, ", ")
	if len(ids) > maxCount {
		result += fmt.Sprintf(" ... 共%d个", len(ids))
	}
	return result
}

/**
 * @function getIconDirName
 * @description 获取类别对应的图标目录名
 * @param {string} category - 类别（item/monster/skill）
 * @returns {string} 图标目录名
 */
func getIconDirName(category string) string {
	switch category {
	case "item":
		return "item_icon"
	case "monster":
		return "monster_icon"
	case "skill":
		return "skill_icon"
	case "achievement":
		return "achievement_icon"
	default:
		return category + "_icon"
	}
}

/**
 * @function getImageAPIPath
 * @description 获取类别对应的 FlyFF API 图片下载路径模板
 * @param {string} category - 类别（item/monster/skill）
 * @param {string} iconField - 详情数据中的 icon 字段值
 * @returns {string} API 图片路径
 */
func getImageAPIPath(category string, iconField string) string {
	switch category {
	case "item":
		return fmt.Sprintf("/image/item/%s", iconField)
	case "monster":
		return fmt.Sprintf("/image/monster/%s", iconField)
	case "skill":
		return fmt.Sprintf("/image/skill/colored/%s", iconField)
	default:
		return fmt.Sprintf("/image/%s/%s", category, iconField)
	}
}

/**
 * @function sanitizeIconFileName
 * @description 清洗来自远程 API 的图标文件名，防止路径穿越
 * @description 远程 API 的 icon 字段直接用作本地文件名，若含 "../"、"/" 或 "\" 会写到图标目录之外
 * @param {string} name - API 返回的 icon 字段值
 * @returns {string} 安全的纯文件名，非法时返回空字符串
 */
func sanitizeIconFileName(name string) string {
	name = strings.TrimSpace(name)
	if name == "" {
		return ""
	}
	/* 取最后一段，剥离任何路径分隔符与回溯 */
	base := filepath.Base(filepath.FromSlash(name))
	if base == "" || base == "." || base == ".." {
		return ""
	}
	/* 清洗后仍残留分隔符（如 Windows 下的 "\"）视为非法 */
	if strings.ContainsAny(base, `/\`) {
		return ""
	}
	return base
}

/**
 * @function getLocalIconFileName
 * @description 根据类别和详情数据生成本地图标文件名
 * 物品: {id}.png  怪物: {id}.png  技能: {icon字段值}
 * @param {string} category - 类别（item/monster/skill）
 * @param {map[string]interface{}} itemMap - 详情数据
 * @returns {string} 本地文件名，无效返回空字符串
 */
func getLocalIconFileName(category string, itemMap map[string]interface{}) string {
	switch category {
	case "item", "monster":
		/* 物品和怪物用 ID 命名: {id}.png */
		id, ok := itemMap["id"]
		if !ok {
			return ""
		}
		var idInt int
		switch v := id.(type) {
		case float64:
			idInt = int(v)
		case int:
			idInt = v
		default:
			return ""
		}
		return fmt.Sprintf("%d.png", idInt)
	case "skill":
		/* 技能用 icon 字段值命名: {icon字段值}（远程字段名不可信，必须清洗） */
		icon, ok := itemMap["icon"].(string)
		if !ok {
			return ""
		}
		return sanitizeIconFileName(icon)
	default:
		return ""
	}
}

// ==================== FlyFF API 请求工具 ====================

/** 单次 API 请求最大重试次数 */
const maxAPIRetryCount = 3

/**
 * @function flyffAPIGetWithRetry
 * @description 带重试的 FlyFF API GET 请求，失败后自动重试最多 maxAPIRetryCount 次
 * @param {string} path - API 路径（如 /item/123）
 * @returns {interface{}, error} 响应数据或错误
 */
func flyffAPIGet(path string) (interface{}, error) {
	url := flyffAPIBaseURL + path

	var lastErr error
	for attempt := 1; attempt <= maxAPIRetryCount; attempt++ {
		/* 检查是否已被中止 */
		if isAborted() {
			return nil, fmt.Errorf("任务已被用户中止")
		}

		startTime := time.Now()
		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Get(url)
		if err != nil {
			lastErr = fmt.Errorf("请求失败: %v", err)
			if attempt < maxAPIRetryCount {
				log.Printf("[FlyFF API] GET %s 第%d次失败: %v，%ds后重试", path, attempt, err, attempt)
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			break
		}

		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			lastErr = fmt.Errorf("HTTP %d", resp.StatusCode)
			if attempt < maxAPIRetryCount {
				log.Printf("[FlyFF API] GET %s 第%d次失败: HTTP %d，%ds后重试", path, attempt, resp.StatusCode, attempt)
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			break
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			lastErr = fmt.Errorf("读取响应失败: %v", err)
			if attempt < maxAPIRetryCount {
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			break
		}

		var result interface{}
		if err := json.Unmarshal(body, &result); err != nil {
			lastErr = fmt.Errorf("JSON解析失败: %v", err)
			if attempt < maxAPIRetryCount {
				time.Sleep(time.Duration(attempt) * time.Second)
				continue
			}
			break
		}

		retryInfo := ""
		if attempt > 1 {
			retryInfo = fmt.Sprintf("（第%d次尝试成功）", attempt)
		}
		log.Printf("[FlyFF API] GET %s 成功%s (%.1fs)", path, retryInfo, time.Since(startTime).Seconds())
		return result, nil
	}

	log.Printf("[FlyFF API] GET %s 失败: %d次尝试均失败: %v", path, maxAPIRetryCount, lastErr)
	return nil, lastErr
}

// ==================== 版本管理 ====================

func fetchRemoteVersion() (string, error) {
	data, err := flyffAPIGet("/version/api")
	if err != nil {
		return "", fmt.Errorf("获取远程版本失败: %v", err)
	}
	if versionStr, ok := data.(string); ok {
		return versionStr, nil
	}
	return fmt.Sprintf("%v", data), nil
}

func readLocalVersion() string {
	versionFile := getVersionFilePath()
	data, err := os.ReadFile(versionFile)
	if err != nil {
		return ""
	}
	var versionObj map[string]interface{}
	if err := json.Unmarshal(data, &versionObj); err != nil {
		return ""
	}
	if v, ok := versionObj["version"].(string); ok {
		return v
	}
	return ""
}

func saveLocalVersion(version string) error {
	versionFile := getVersionFilePath()
	if err := os.MkdirAll(filepath.Dir(versionFile), 0755); err != nil {
		return err
	}
	versionObj := map[string]interface{}{
		"version":   version,
		"updatedAt": time.Now().Format("2006-01-02T15:04:05Z07:00"),
	}
	data, err := json.MarshalIndent(versionObj, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(versionFile, data, 0644)
}

func compareVersions(local, remote string) bool {
	if local == "" {
		return true
	}
	if remote == "" {
		return false
	}
	localParts := strings.Split(local, ".")
	remoteParts := strings.Split(remote, ".")
	maxLen := len(localParts)
	if len(remoteParts) > maxLen {
		maxLen = len(remoteParts)
	}
	for i := 0; i < maxLen; i++ {
		localVal := 0
		remoteVal := 0
		if i < len(localParts) {
			fmt.Sscanf(localParts[i], "%d", &localVal)
		}
		if i < len(remoteParts) {
			fmt.Sscanf(remoteParts[i], "%d", &remoteVal)
		}
		if remoteVal > localVal {
			return true
		}
		if remoteVal < localVal {
			return false
		}
	}
	return false
}

// ==================== ID 列表管理 ====================

func fetchRemoteIDList(category string) ([]int, error) {
	endpoint := getAPIEndpoint(category)
	if endpoint == "" {
		return nil, fmt.Errorf("未知类别: %s", category)
	}
	data, err := flyffAPIGet("/" + endpoint)
	if err != nil {
		return nil, fmt.Errorf("获取 %s ID列表失败: %v", category, err)
	}
	var ids []int
	switch v := data.(type) {
	case []interface{}:
		for _, item := range v {
			switch id := item.(type) {
			case float64:
				ids = append(ids, int(id))
			case int:
				ids = append(ids, id)
			}
		}
	default:
		return nil, fmt.Errorf("意外的 ID 列表格式: %T", data)
	}
	return ids, nil
}

/**
 * @function loadCachedIDList
 * @description 从本地 ID 列表缓存文件加载 ID 列表（续传时使用，避免重复请求 API）
 * @param {string} category - 类别（item/monster/skill）
 * @returns {[]int} ID 列表，文件不存在或解析失败返回 nil
 */
func loadCachedIDList(category string) []int {
	filePath := getIDListFilePath(category)
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil
	}
	var ids []int
	if err := json.Unmarshal(data, &ids); err != nil {
		return nil
	}
	return ids
}

func saveIDList(category string, ids []int) error {
	filePath := getIDListFilePath(category)
	if err := os.MkdirAll(filepath.Dir(filePath), 0755); err != nil {
		return err
	}
	data, err := json.MarshalIndent(ids, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filePath, data, 0644)
}

// ==================== JS 文件语法验证与修复 ====================

/**
 * @typedef jsValidateResult
 * @description JS 文件语法验证结果
 */
type jsValidateResult struct {
	Valid       bool     /* 是否通过验证 */
	Fixed       bool     /* 是否执行了修复 */
	FixCount    int      /* 修复的问题数量 */
	FixMessages []string /* 修复详情 */
}

/**
 * @function validateAndFixJsDataFile
 * @description 验证JS数据文件语法，发现常见错误自动修复并重新写入
 * @description 检测项：1.对象属性间缺失逗号 2.多余逗号 3.闭合大括号缺失/重复
 * @description 修复后重新写入文件，再次验证确保修复成功；修复失败则记录错误日志
 * @param {string} jsFilePath - JS文件路径
 * @param {string} category - 类别名（用于日志输出）
 * @returns {jsValidateResult} 验证结果
 */
func validateAndFixJsDataFile(jsFilePath, category string) jsValidateResult {
	result := jsValidateResult{Valid: true}

	data, err := os.ReadFile(jsFilePath)
	if err != nil {
		result.Valid = false
		result.FixMessages = append(result.FixMessages, fmt.Sprintf("读取文件失败: %v", err))
		return result
	}

	content := string(data)
	lines := strings.Split(content, "\n")
	fixed := false
	fixCount := 0

	/* 1. 检测并修复：对象属性间缺失逗号 */
	/* 模式：行以 } 或 ] 结尾（去除空白后），下一行以 '数字': 开始，但该行没有逗号 */
	for i := 0; i < len(lines)-1; i++ {
		trimmed := strings.TrimRight(lines[i], " \t\r")
		if len(trimmed) == 0 {
			continue
		}
		/* 当前行以 } 或 ] 结尾（无逗号） */
		lastChar := trimmed[len(trimmed)-1]
		if lastChar != '}' && lastChar != ']' {
			continue
		}
		/* 下一行以 '数字': 或 "数字": 开始 → 这是对象的新属性键 */
		nextTrimmed := strings.TrimLeft(lines[i+1], " \t\r")
		if !strings.HasPrefix(nextTrimmed, "'") && !strings.HasPrefix(nextTrimmed, "\"") {
			continue
		}
		/* 检查下一个非空白字符后是否是数字键格式 */
		idKeyRe := regexp.MustCompile(`^['"]\d+['"]\s*:`)
		if idKeyRe.MatchString(nextTrimmed) {
			/* 缺失逗号，修复 */
			lines[i] = trimmed + ","
			fixCount++
			fixed = true
			result.FixMessages = append(result.FixMessages, fmt.Sprintf("行%d: 属性间缺失逗号 → 添加逗号", i+1))
		}
	}

	/* 2. 检测并修复：文件末尾缺少闭合大括号 */
	/* 合并后检查最后一行是否是 } */
	joinedContent := strings.Join(lines, "\n")
	trimmedEnd := strings.TrimRight(joinedContent, " \t\r\n")
	if !strings.HasSuffix(trimmedEnd, "}") {
		/* 缺少闭合大括号 */
		lines = append(lines, "}")
		fixCount++
		fixed = true
		result.FixMessages = append(result.FixMessages, "文件末尾缺少闭合大括号 → 添加 }")
	}

	/* 3. 检测并修复：多余的闭合大括号（连续两个 } 行只有空白） */
	/* 重新用 lines 检测 */
	braceCount := 0
	for _, line := range lines {
		trimmed := strings.TrimRight(line, " \t\r")
		for _, ch := range trimmed {
			if ch == '{' {
				braceCount++
			} else if ch == '}' {
				braceCount--
			}
		}
	}
	if braceCount < 0 {
		/* 多余的闭合大括号，删除最后的空行和大括号 */
		for len(lines) > 0 {
			lastIdx := len(lines) - 1
			trimmed := strings.TrimRight(lines[lastIdx], " \t\r")
			if trimmed == "}" && braceCount < 0 {
				lines = lines[:lastIdx]
				braceCount++
				fixCount++
				fixed = true
				result.FixMessages = append(result.FixMessages, "删除多余的闭合大括号 }")
			} else if trimmed == "" {
				lines = lines[:lastIdx]
			} else {
				break
			}
		}
	}

	/* 4. 如果有修复，重新写入并二次验证 */
	if fixed {
		fixedContent := strings.Join(lines, "\n")
		if err := os.WriteFile(jsFilePath, []byte(fixedContent), 0644); err != nil {
			result.Valid = false
			result.FixMessages = append(result.FixMessages, fmt.Sprintf("写入修复后文件失败: %v", err))
			return result
		}

		/* 二次验证：确保修复后的文件没有问题 */
		secondResult := validateJsSyntax(jsFilePath)
		if !secondResult {
			result.Valid = false
			result.FixMessages = append(result.FixMessages, "二次验证仍失败，文件可能需要手动修复")
		}

		result.Fixed = true
		result.FixCount = fixCount

		/* 记录修复日志 */
		catName := getCategoryName(category)
		log.Printf("[DataUpdater] ⚠️ %s数据文件自动修复%d处问题: %v", catName, fixCount, result.FixMessages)
		if fixCount <= 3 {
			for _, msg := range result.FixMessages {
				addProgressLog("warning", fmt.Sprintf("⚠️ %s数据文件自动修复: %s", catName, msg))
			}
		} else {
			addProgressLog("warning", fmt.Sprintf("⚠️ %s数据文件自动修复%d处问题", catName, fixCount))
		}
	}

	return result
}

/**
 * @function validateJsSyntax
 * @description 对JS数据文件进行基本语法验证（不修复，仅检测）
 * @description 检测项：大括号匹配、属性间逗号完整性、export语句存在性
 * @param {string} jsFilePath - JS文件路径
 * @returns {bool} 是否通过验证
 */
func validateJsSyntax(jsFilePath string) bool {
	data, err := os.ReadFile(jsFilePath)
	if err != nil {
		return false
	}
	content := string(data)

	/* 检测1：大括号匹配 */
	braceCount := 0
	for _, ch := range content {
		if ch == '{' {
			braceCount++
		} else if ch == '}' {
			braceCount--
			if braceCount < 0 {
				return false
			}
		}
	}
	if braceCount != 0 {
		return false
	}

	/* 检测2：属性间缺失逗号 */
	lines := strings.Split(content, "\n")
	for i := 0; i < len(lines)-1; i++ {
		trimmed := strings.TrimRight(lines[i], " \t\r")
		if len(trimmed) == 0 {
			continue
		}
		lastChar := trimmed[len(trimmed)-1]
		if lastChar != '}' && lastChar != ']' {
			continue
		}
		nextTrimmed := strings.TrimLeft(lines[i+1], " \t\r")
		idKeyRe := regexp.MustCompile(`^['"]\d+['"]\s*:`)
		if idKeyRe.MatchString(nextTrimmed) {
			return false
		}
	}

	/* 检测3：export语句存在性 */
	if !strings.Contains(content, "export const") {
		return false
	}

	return true
}

/**
 * @function writeAndValidateJsDataFile
 * @description 写入JS数据文件后立即验证语法，如有错误自动修复
 * @description 封装 os.WriteFile + validateAndFixJsDataFile 的组合操作
 * @param {string} jsFilePath - JS文件路径
 * @param {[]byte} data - 要写入的数据
 * @param {string} category - 类别名（用于日志输出）
 * @returns {error} 写入或验证失败时的错误
 */
func writeAndValidateJsDataFile(jsFilePath string, data []byte, category string) error {
	/* 先写入文件 */
	if err := os.WriteFile(jsFilePath, data, 0644); err != nil {
		return err
	}

	/* 写入后立即验证并修复 */
	result := validateAndFixJsDataFile(jsFilePath, category)
	if !result.Valid {
		return fmt.Errorf("写入%s数据文件后验证失败，修复未成功", getCategoryName(category))
	}

	return nil
}

func parseExistingJsIds(jsFilePath string) map[int]bool {
	ids := make(map[int]bool)
	data, err := os.ReadFile(jsFilePath)
	if err != nil {
		return ids
	}
	content := string(data)
	/* 只匹配顶层条目键：行首（允许前导空白）+ '数字': {
	 * 避免匹配嵌套结构中的数字键（如 'consumedFP': 200 等不会误匹配）
	 * 之前的正则 ['"](\d+)['"]\s*: 会误匹配嵌套的纯数字键
	 * 键的引号同时兼容 ' 与 "（历史数据由不同写入器产生两种格式） */
	re := regexp.MustCompile(`(?m)^[ \t]*['\"](\d+)['\"]:[ \t]*\{`)
	matches := re.FindAllStringSubmatch(content, -1)
	for _, match := range matches {
		if len(match) >= 2 {
			var id int
			if _, err := fmt.Sscanf(match[1], "%d", &id); err == nil {
				ids[id] = true
			}
		}
	}
	return ids
}

/**
 * @function parseExistingJsIconEntries
 * @description 解析 JS 数据文件，提取所有条目的 id 和 icon 字段
 * @description 用于图片补全模式：扫描 JS 文件中所有条目，找出本地图片目录中缺失的图标
 * @param {string} category - 类别（item/monster/skill）
 * @returns {[]iconEntry} 图标条目列表
 */
func parseExistingJsIconEntries(category string) []iconEntry {
	jsFilePath := getTargetJsFilePath(category)
	jsData, err := os.ReadFile(jsFilePath)
	if err != nil {
		return nil
	}

	content := string(jsData)
	var entries []iconEntry

	/* 匹配模式: 行首两空格 + '数字': { ... 'icon': '值' ... }
	 * 限定两空格缩进是顶层条目键的固定格式，可避免误匹配条目内部嵌套的数字键
	 * 引号同时兼容 ' 与 "：
	 *   - 单引号条目来自原始数据集写入器
	 *   - 双引号条目来自 Go 端 writeJsDataFile（json.MarshalIndent）
	 * 只认单引号会导致双引号条目永远扫不到，其图标也永远补不回来 */
	idRe := regexp.MustCompile(`(?m)^  ['\"](\d+)['\"]:[ \t]*\{`)
	iconRe := regexp.MustCompile(`['\"]icon['\"]:[ \t]*['\"]([^'\"]*)['\"]`)

	/* 逐个条目块解析 */
	entryBlocks := idRe.Split(content, -1)
	idMatches := idRe.FindAllStringSubmatch(content, -1)

	for i, idMatch := range idMatches {
		if i+1 >= len(entryBlocks) {
			break
		}
		var idInt int
		if _, err := fmt.Sscanf(idMatch[1], "%d", &idInt); err != nil {
			continue
		}

		/* 在当前条目的代码块中搜索 icon 字段 */
		block := entryBlocks[i+1]
		iconMatch := iconRe.FindStringSubmatch(block)
		if len(iconMatch) < 2 || iconMatch[1] == "" {
			continue
		}
		iconValue := iconMatch[1]

		/* 构建本地文件名 */
		itemMap := map[string]interface{}{
			"id":   float64(idInt),
			"icon": iconValue,
		}
		fileName := getLocalIconFileName(category, itemMap)
		if fileName == "" {
			continue
		}

		entries = append(entries, iconEntry{id: idInt, icon: iconValue, fileName: fileName})
	}

	return entries
}

// ==================== CNS名称与description比对更新功能 ====================

/**
 * @function compareAndUpdateFields
 * @description 比对已有条目的 name.cns 和 description.cns 与服务器最新数据，以服务器为主更新
 * @description 遍历JS文件中所有已有ID，逐个请求API获取最新详情，比对CNS字段，不同则更新JS文件
 * @param {string} category - 类别（item/monster/skill）
 * @param {*RateLimiter} limiter - 速率限制器
 * @param {int} stepIndex - 步骤索引（用于进度显示）
 * @param {int} totalSteps - 总步骤数
 * @returns {FieldUpdateResult} 字段比对更新结果
 */
func compareAndUpdateFields(category string, limiter *RateLimiter, stepIndex, totalSteps int) FieldUpdateResult {
	catName := getCategoryName(category)
	stepPrefix := fmt.Sprintf("[%d/%d]", stepIndex, totalSteps)
	result := FieldUpdateResult{
		Category: category,
	}

	if isAborted() {
		return result
	}

	/* 1. 读取JS文件，获取所有已有ID */
	jsFilePath := getTargetJsFilePath(category)
	existingIds := parseExistingJsIds(jsFilePath)
	if len(existingIds) == 0 {
		addProgressLog("warning", fmt.Sprintf("⚠️ %s %s数据文件中无已有条目", stepPrefix, catName))
		return result
	}

	/* 将 map 转为有序的 ID 列表 */
	var allIds []int
	for id := range existingIds {
		allIds = append(allIds, id)
	}
	sort.Ints(allIds)

	result.TotalCompared = len(allIds)
	addProgressLog("info", fmt.Sprintf("🔄 %s 开始比对%s的CNS名称和description（共%d条）", stepPrefix, catName, len(allIds)))

	/* 2. 读取当前JS文件内容 */
	jsContent, err := os.ReadFile(jsFilePath)
	if err != nil {
		result.Error = fmt.Sprintf("读取%s数据文件失败: %v", catName, err)
		addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
		return result
	}
	currentContent := string(jsContent)
	contentUpdated := false

	/* 3. 逐个ID请求API详情，比对CNS字段 */
	endpoint := getAPIEndpoint(category)
	for i, id := range allIds {
		if isAborted() {
			break
		}

		if aborted := limiter.Wait(); aborted {
			break
		}

		doneCount := i + 1
		percent := doneCount * 100 / len(allIds)

		/* 请求API获取最新详情 */
		detailPath := fmt.Sprintf("/%s/%d", endpoint, id)
		data, err := flyffAPIGet(detailPath)

		if err != nil || data == nil {
			result.Failed++
			if result.Failed <= 10 {
				addProgressLog("error", fmt.Sprintf("❌ %s [%d/%d] 获取%s ID:%d 详情失败", stepPrefix, doneCount, len(allIds), catName, id))
			}
			updateProgressState(fmt.Sprintf("%s_cns", category), fmt.Sprintf("%s [%d/%d] 比对%s CNS", stepPrefix, doneCount, len(allIds), catName), doneCount, len(allIds), percent)
			/* 实时更新CNS比对结果（失败也更新进度） */
			resultCopy := result
			resultCopy.TotalCompared = doneCount
			updateProgressFieldResult(resultCopy)
			continue
		}

		itemMap, ok := data.(map[string]interface{})
		if !ok {
			result.Failed++
			continue
		}

		/* 提取服务器返回的 name.cns */
		var serverNameCns string
		if nameObj, ok := itemMap["name"].(map[string]interface{}); ok {
			serverNameCns, _ = nameObj["cns"].(string)
		}

		/* 提取服务器返回的 description.cns */
		var serverDescCns string
		hasDescCns := false
		if descObj, ok := itemMap["description"].(map[string]interface{}); ok {
			serverDescCns, hasDescCns = descObj["cns"].(string)
		}

		/* 从当前JS文件内容中提取该ID条目的 name.cns 和 description.cns */
		updated := false

		/* 比对并更新 name.cns */
		if serverNameCns != "" {
			localNameCns := extractFieldFromJsEntry(currentContent, id, "name", "cns")
			if localNameCns != "" && localNameCns != serverNameCns {
				/* 替换该ID条目中的 name.cns 值 */
				newContent := replaceFieldInJsEntry(currentContent, id, "name", "cns", localNameCns, serverNameCns)
				if newContent != currentContent {
					currentContent = newContent
					result.NameCnsUpdated++
					updated = true
				}
			}
		}

		/* 比对并更新 description.cns */
		if hasDescCns && serverDescCns != "" {
			localDescCns := extractFieldFromJsEntry(currentContent, id, "description", "cns")
			if localDescCns != "" && localDescCns != serverDescCns {
				/* 替换该ID条目中的 description.cns 值 */
				newContent := replaceFieldInJsEntry(currentContent, id, "description", "cns", localDescCns, serverDescCns)
				if newContent != currentContent {
					currentContent = newContent
					result.DescCnsUpdated++
					updated = true
				}
			}
		}

		if updated {
			contentUpdated = true
		}

		updateProgressState(fmt.Sprintf("%s_cns", category), fmt.Sprintf("%s [%d/%d] 比对%s CNS（名称更新%d，描述更新%d）", stepPrefix, doneCount, len(allIds), catName, result.NameCnsUpdated, result.DescCnsUpdated), doneCount, len(allIds), percent)

		/* 实时更新CNS比对结果到全局进度（前端轮询可读取） */
		resultCopy := result
		resultCopy.TotalCompared = doneCount
		updateProgressFieldResult(resultCopy)

		/* 每500条或最后一条输出日志 */
		if doneCount%500 == 0 || doneCount == len(allIds) {
			addProgressLog("info", fmt.Sprintf("📋 %s [%d/%d] 比对%s CNS: 名称更新%d，描述更新%d", stepPrefix, doneCount, len(allIds), catName, result.NameCnsUpdated, result.DescCnsUpdated))
		}
	}

	/* 4. 如果有更新，写入文件（写入后自动验证修复） */
	if contentUpdated {
		if err := writeAndValidateJsDataFile(jsFilePath, []byte(currentContent), category); err != nil {
			result.Error = fmt.Sprintf("写入%s数据文件失败: %v", catName, err)
			addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
			return result
		}
		addProgressLog("success", fmt.Sprintf("💾 %s 已更新%s数据文件（CNS名称更新%d，描述更新%d）", stepPrefix, catName, result.NameCnsUpdated, result.DescCnsUpdated))
	}

	result.Skipped = result.TotalCompared - result.NameCnsUpdated - result.DescCnsUpdated - result.Failed

	doneMsg := fmt.Sprintf("%s %s CNS比对完成：共%d条，名称更新%d，描述更新%d，无变化%d，失败%d", stepPrefix, catName, result.TotalCompared, result.NameCnsUpdated, result.DescCnsUpdated, result.Skipped, result.Failed)
	addProgressLog("success", fmt.Sprintf("✅ %s", doneMsg))
	addCompletedCategory(category + "_cns")

	return result
}

/**
 * @function extractFieldFromJsEntry
 * @description 从JS文件内容中提取指定ID条目的嵌套字段值（如 name.cns）
 * @param {string} content - JS文件完整内容
 * @param {int} id - 条目ID
 * @param {string} parentField - 父字段名（如 name、description）
 * @param {string} childField - 子字段名（如 cns）
 * @returns {string} 字段值（空字符串表示未找到）
 */
/**
 * @function matchBraceBlock
 * @description 从 '{' 所在下标开始做括号配对，返回该对象块的起止下标
 * @param {string} content - 文本
 * @param {int} bracePos - '{' 所在下标
 * @returns {int, int} 对象块起止下标，配对失败返回 -1, -1
 */
func matchBraceBlock(content string, bracePos int) (int, int) {
	if bracePos < 0 || bracePos >= len(content) || content[bracePos] != '{' {
		return -1, -1
	}
	depth := 0
	for i := bracePos; i < len(content); i++ {
		switch content[i] {
		case '{':
			depth++
		case '}':
			depth--
			if depth == 0 {
				return bracePos, i + 1
			}
		}
	}
	return -1, -1
}

/**
 * @function findEntryBlock
 * @description 定位JS文件中指定ID的顶层条目块（行首缩进 + 'id': { 起始）
 * @description 限定行首缩进可避免匹配到嵌套结构中的数字键
 * @param {string} content - JS文件完整内容
 * @param {int} id - 条目ID
 * @returns {int, int} 条目块起止下标，未找到返回 -1, -1
 */
func findEntryBlock(content string, id int) (int, int) {
	/* 键的引号兼容 ' 与 "（两种历史写入格式） */
	idPattern := regexp.MustCompile(fmt.Sprintf(`(?m)^[ \t]*['\"]%d['\"]:[ \t]*\{`, id))
	loc := idPattern.FindStringIndex(content)
	if loc == nil {
		return -1, -1
	}
	return matchBraceBlock(content, loc[1]-1)
}

func extractFieldFromJsEntry(content string, id int, parentField, childField string) string {
	/* 匹配模式: 'id': { ... 'parentField': { ... 'childField': '值' ... } ... } */
	startIdx, endIdx := findEntryBlock(content, id)
	if startIdx < 0 {
		return ""
	}
	block := content[startIdx:endIdx]

	/* 先定位父字段对象（如 'name': {），再按括号配对取出该对象本体 */
	parentPattern := regexp.MustCompile(fmt.Sprintf(`['\"]%s['\"]:[ \t]*\{`, regexp.QuoteMeta(parentField)))
	parentLoc := parentPattern.FindStringIndex(block)
	if parentLoc == nil {
		return ""
	}
	subStart, subEnd := matchBraceBlock(block, parentLoc[1]-1)
	if subStart < 0 {
		return ""
	}
	sub := block[subStart:subEnd]

	/* 只在父字段对象内部查找子字段，避免跨字段误匹配（如把 name.cns 当成 description.cns）
	 * 值同时兼容单引号与双引号字符串 */
	fieldPattern := regexp.MustCompile(fmt.Sprintf(`['\"]%s['\"]:[ \t]*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\")`, regexp.QuoteMeta(childField)))
	match := fieldPattern.FindStringSubmatch(sub)
	if len(match) >= 3 {
		if match[1] != "" {
			return match[1]
		}
		return match[2]
	}

	return ""
}

/**
 * @function replaceFieldInJsEntry
 * @description 替换JS文件内容中指定ID条目的嵌套字段值（如 name.cns）
 * @param {string} content - JS文件完整内容
 * @param {int} id - 条目ID
 * @param {string} parentField - 父字段名（如 name、description）
 * @param {string} childField - 子字段名（如 cns）
 * @param {string} oldValue - 旧值
 * @param {string} newValue - 新值
 * @returns {string} 替换后的内容
 */
func replaceFieldInJsEntry(content string, id int, parentField, childField, oldValue, newValue string) string {
	startIdx, endIdx := findEntryBlock(content, id)
	if startIdx < 0 {
		return content
	}
	block := content[startIdx:endIdx]

	/* 先定位父字段对象，再按括号配对取出该对象本体 */
	parentPattern := regexp.MustCompile(fmt.Sprintf(`['\"]%s['\"]:[ \t]*\{`, regexp.QuoteMeta(parentField)))
	parentLoc := parentPattern.FindStringIndex(block)
	if parentLoc == nil {
		return content
	}
	subStart, subEnd := matchBraceBlock(block, parentLoc[1]-1)
	if subStart < 0 {
		return content
	}
	sub := block[subStart:subEnd]

	/* 只在父字段对象内部替换值，且仅当旧值与 oldValue 完全一致时才改
	 * （用「匹配任意值再比对」而不是把 oldValue 写进正则，可保留原有的单/双引号风格）；
	 * RE2 不支持反向引用，因此闭合引号单独捕获后原样回填 */
	fieldPattern := regexp.MustCompile(fmt.Sprintf(`(['\"]%s['\"]:[ \t]*)(['\"])((?:[^'\"\\]|\\.)*)(['\"])`, regexp.QuoteMeta(childField)))
	matched := false
	newSub := fieldPattern.ReplaceAllStringFunc(sub, func(m string) string {
		g := fieldPattern.FindStringSubmatch(m)
		if len(g) < 5 || g[3] != oldValue {
			return m
		}
		matched = true
		return g[1] + g[2] + newValue + g[4]
	})

	if !matched || newSub == sub {
		return content
	}

	/* 组装：条目块前段 + 替换后的父字段对象 + 条目块后段 */
	newBlock := block[:subStart] + newSub + block[subEnd:]
	return content[:startIdx] + newBlock + content[endIdx:]
}

// ==================== 套装CNS比对功能 ====================

/**
 * @function formatEquipsetEntry
 * @description 将API返回的套装数据格式化为JS文件中的条目字符串
 * @description 格式: '  {id}: {json},'
 * @param {int} id - 套装ID
 * @param {map[string]interface{}} itemMap - API返回的套装数据
 * @returns {string} 格式化后的JS条目字符串，失败返回空字符串
 */
func formatEquipsetEntry(id int, itemMap map[string]interface{}) string {
	itemJSON, err := json.MarshalIndent(itemMap, "  ", "  ")
	if err != nil {
		return ""
	}
	return fmt.Sprintf("  '%d': %s,", id, string(itemJSON))
}

/**
 * @function compareAndUpdateEquipsetCns
 * @description 比对套装的 name.cns / description.cns 与服务器最新数据，以服务器为主更新
 * @description 获取远程套装ID列表后分流处理：已有ID逐条请求API比对并回写CNS；新增ID拉取详情后追加到JS文件
 * @param {*RateLimiter} limiter - 速率限制器
 * @param {int} stepIndex - 步骤索引（用于进度显示）
 * @param {int} totalSteps - 总步骤数
 * @returns {FieldUpdateResult} 字段比对更新结果
 */
func compareAndUpdateEquipsetCns(limiter *RateLimiter, stepIndex, totalSteps int) FieldUpdateResult {
	stepPrefix := fmt.Sprintf("[%d/%d]", stepIndex, totalSteps)
	result := FieldUpdateResult{
		Category: "equipset",
	}

	if isAborted() {
		return result
	}

	/* 1. 获取远程套装ID列表 */
	updateProgressState("equipset_cns_ids", fmt.Sprintf("%s 正在获取套装远程ID列表...", stepPrefix), 0, 1, 0)
	addProgressLog("info", fmt.Sprintf("🔄 %s 正在获取套装远程ID列表...", stepPrefix))

	if aborted := limiter.Wait(); aborted {
		return result
	}

	remoteIds, err := fetchRemoteIDList("equipset")
	if err != nil {
		/* 远程ID列表获取失败时，尝试使用本地缓存 */
		cachedIds := loadCachedIDList("equipset")
		if cachedIds != nil {
			remoteIds = cachedIds
			addProgressLog("warning", fmt.Sprintf("⚠️ %s 远程API获取套装ID列表失败，使用本地缓存（%d个）", stepPrefix, len(remoteIds)))
		} else {
			result.Error = fmt.Sprintf("获取套装远程ID列表失败: %v", err)
			addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
			return result
		}
	} else {
		/* 保存ID列表到缓存 */
		if saveErr := saveIDList("equipset", remoteIds); saveErr != nil {
			log.Printf("[DataUpdater] 保存套装ID列表失败: %v", saveErr)
		}
	}

	addProgressLog("success", fmt.Sprintf("📊 %s 套装远程ID列表: %d个", stepPrefix, len(remoteIds)))
	updateProgressState("equipset_cns_ids", fmt.Sprintf("%s 套装远程ID列表: %d个", stepPrefix, len(remoteIds)), 1, 1, 100)

	/* 2. 读取本地已有ID */
	jsFilePath := getTargetJsFilePath("equipset")
	existingIds := parseExistingJsIds(jsFilePath)

	/* 3. 分流：已有ID（逐条比对CNS）/ 新增ID（拉取详情后追加）/ 冗余ID（只报告） */
	var newIds, compareIds, redundantIds []int
	remoteIdSet := make(map[int]bool)
	for _, id := range remoteIds {
		remoteIdSet[id] = true
		if existingIds[id] {
			compareIds = append(compareIds, id)
		} else {
			newIds = append(newIds, id)
		}
	}
	for id := range existingIds {
		if !remoteIdSet[id] {
			redundantIds = append(redundantIds, id)
		}
	}
	sort.Ints(newIds)
	sort.Ints(compareIds)
	sort.Ints(redundantIds)

	result.TotalCompared = len(remoteIds)

	if len(redundantIds) > 0 {
		redundantStr := intsToString(redundantIds, 20)
		addProgressLog("warning", fmt.Sprintf("⚠️ %s 本地套装存在冗余数据%d个（远程%d，本地%d）：[%s]", stepPrefix, len(redundantIds), len(remoteIds), len(existingIds), redundantStr))
	}

	if len(remoteIds) == 0 {
		result.Skipped = len(existingIds)
		addProgressLog("warning", fmt.Sprintf("⚠️ %s 远程套装ID列表为空，跳过套装比对", stepPrefix))
		addCompletedCategory("equipset_cns")
		return result
	}

	addProgressLog("info", fmt.Sprintf("🔄 %s 套装比对：远程%d，已有%d（逐条比对CNS），新增%d，开始处理", stepPrefix, len(remoteIds), len(compareIds), len(newIds)))

	/* 4. 读取JS文件内容（CNS 替换在完整内容上进行，新增条目最后统一追加） */
	jsContent, err := os.ReadFile(jsFilePath)
	if err != nil {
		result.Error = fmt.Sprintf("读取套装数据文件失败: %v", err)
		addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
		return result
	}
	currentContent := string(jsContent)
	contentUpdated := false

	/* 收集所有新增条目 */
	var newEntries []string

	/* 5. 逐个请求API：已有条目比对CNS并回写，新增条目收集为待追加内容 */
	totalIds := len(compareIds) + len(newIds)
	doneCount := 0
	compareFailed := 0

	processDetail := func(id int, itemMap map[string]interface{}) {
		serverNameCns := ""
		if nameObj, ok := itemMap["name"].(map[string]interface{}); ok {
			serverNameCns, _ = nameObj["cns"].(string)
		}
		serverDescCns, hasDescCns := "", false
		if descObj, ok := itemMap["description"].(map[string]interface{}); ok {
			serverDescCns, hasDescCns = descObj["cns"].(string)
		}

		if existingIds[id] {
			/* 已有条目：与官方逐条比对，以服务器为主回写 */
			if serverNameCns != "" {
				localNameCns := extractFieldFromJsEntry(currentContent, id, "name", "cns")
				if localNameCns != "" && localNameCns != serverNameCns {
					newContent := replaceFieldInJsEntry(currentContent, id, "name", "cns", localNameCns, serverNameCns)
					if newContent != currentContent {
						currentContent = newContent
						result.NameCnsUpdated++
						contentUpdated = true
						addProgressLog("info", fmt.Sprintf("📝 %s 套装 ID:%d name.cns: %s → %s", stepPrefix, id, localNameCns, serverNameCns))
					}
				}
			}
			if hasDescCns && serverDescCns != "" {
				localDescCns := extractFieldFromJsEntry(currentContent, id, "description", "cns")
				if localDescCns != "" && localDescCns != serverDescCns {
					newContent := replaceFieldInJsEntry(currentContent, id, "description", "cns", localDescCns, serverDescCns)
					if newContent != currentContent {
						currentContent = newContent
						result.DescCnsUpdated++
						contentUpdated = true
						addProgressLog("info", fmt.Sprintf("📝 %s 套装 ID:%d description.cns: %s → %s", stepPrefix, id, localDescCns, serverDescCns))
					}
				}
			}
			return
		}

		/* 新增条目：收集后统一追加（NameCnsUpdated 兼容旧语义，同时代表「套装新增」数） */
		appendContent := formatEquipsetEntry(id, itemMap)
		if appendContent != "" {
			newEntries = append(newEntries, appendContent)
			result.NameCnsUpdated++
			if serverNameCns != "" {
				addProgressLog("info", fmt.Sprintf("📝 %s 新增套装 ID:%d name.cns: %s", stepPrefix, id, serverNameCns))
			} else {
				addProgressLog("info", fmt.Sprintf("📝 %s 新增套装 ID:%d", stepPrefix, id))
			}
		}
	}

	for _, id := range append(append([]int{}, compareIds...), newIds...) {
		if isAborted() {
			break
		}
		if aborted := limiter.Wait(); aborted {
			break
		}

		doneCount++
		percent := doneCount * 100 / totalIds

		data, apiErr := flyffAPIGet(fmt.Sprintf("/equipset/%d", id))
		if apiErr != nil || data == nil {
			result.Failed++
			if existingIds[id] {
				compareFailed++
			}
			if result.Failed <= 10 {
				addProgressLog("error", fmt.Sprintf("❌ %s [%d/%d] 获取套装 ID:%d 详情失败", stepPrefix, doneCount, totalIds, id))
			}
			updateProgressState("equipset_cns", fmt.Sprintf("%s [%d/%d] 比对套装", stepPrefix, doneCount, totalIds), doneCount, totalIds, percent)
			resultCopy := result
			resultCopy.TotalCompared = doneCount
			updateProgressFieldResult(resultCopy)
			continue
		}

		itemMap, ok := data.(map[string]interface{})
		if !ok {
			result.Failed++
			if existingIds[id] {
				compareFailed++
			}
			continue
		}

		processDetail(id, itemMap)

		updateProgressState("equipset_cns", fmt.Sprintf("%s [%d/%d] 比对套装（名称更新%d，描述更新%d，新增%d）", stepPrefix, doneCount, totalIds, result.NameCnsUpdated, result.DescCnsUpdated, len(newEntries)), doneCount, totalIds, percent)

		resultCopy := result
		resultCopy.TotalCompared = doneCount
		updateProgressFieldResult(resultCopy)

		if doneCount%100 == 0 || doneCount == totalIds {
			addProgressLog("info", fmt.Sprintf("📋 %s [%d/%d] 套装比对: 名称更新%d，描述更新%d，新增%d", stepPrefix, doneCount, totalIds, result.NameCnsUpdated, result.DescCnsUpdated, len(newEntries)))
		}
	}

	/* 6. 写回：把新条目追加到 CNS 替换后的内容末尾 */
	if len(newEntries) > 0 {
		lastBraceIdx := strings.LastIndex(currentContent, "\n}")
		if lastBraceIdx <= 0 {
			result.Error = fmt.Sprintf("套装数据文件末尾未找到闭合大括号（\\n}），为避免覆盖已有数据已中止写入")
			addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
			return result
		}
		prefix := strings.TrimRight(currentContent[:lastBraceIdx], " \t\r\n")
		if len(prefix) > 0 && prefix[len(prefix)-1] != ',' {
			prefix += ","
		}
		newBlock := strings.TrimRight(strings.Join(newEntries, "\n"), " \t\r\n")
		if strings.HasSuffix(newBlock, ",") {
			newBlock = newBlock[:len(newBlock)-1]
		}
		currentContent = prefix + "\n" + newBlock + "\n}"
		contentUpdated = true
	}

	if contentUpdated {
		if err := writeAndValidateJsDataFile(jsFilePath, []byte(currentContent), "equipset"); err != nil {
			result.Error = fmt.Sprintf("写入套装数据文件失败: %v", err)
			addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
			return result
		}
		addProgressLog("success", fmt.Sprintf("💾 %s 已更新套装数据文件（名称更新%d，描述更新%d，新增%d条）", stepPrefix, result.NameCnsUpdated, result.DescCnsUpdated, len(newEntries)))
	}

	result.Skipped = len(compareIds) - result.NameCnsUpdated - result.DescCnsUpdated - compareFailed
	if result.Skipped < 0 {
		result.Skipped = 0
	}

	doneMsg := fmt.Sprintf("%s 套装比对完成：远程%d，已有%d（无变化%d），新增%d，失败%d", stepPrefix, len(remoteIds), len(compareIds), result.Skipped, len(newEntries), result.Failed)
	addProgressLog("success", fmt.Sprintf("✅ %s", doneMsg))
	addCompletedCategory("equipset_cns")

	return result
}

// ==================== 图片下载功能 ====================

/** 图标条目：记录 JS 文件中每个条目的 id、icon 值和对应的本地文件名 */
type iconEntry struct {
	id       int
	icon     string
	fileName string
}

/**
 * @function downloadMissingIcons
 * @description 补全缺失的图标文件
 * @description 始终扫描 JS 数据文件中所有条目并比对本地图片目录，找出缺失的图标：
 * @description 既补齐本轮新增条目，也补回历史被删除/下载失败而缺失的图标
 * @description 物品图片: /pt/item_icon/{id}.png，从 API /image/item/{icon} 下载
 * @description 怪物图片: /pt/monster_icon/{id}.png，从 API /image/monster/{icon} 下载
 * @description 技能图片: /pt/skill_icon/{icon字段值}，从 API /image/skill/colored/{icon} 下载
 * @param {string} category - 类别（item/monster/skill）
 * @param {*RateLimiter} limiter - 速率限制器
 * @param {int} stepIndex - 步骤索引（用于进度显示）
 * @param {int} totalSteps - 总步骤数
 * @returns {ImageDownloadResult} 图片下载结果
 */
func downloadMissingIcons(category string, limiter *RateLimiter, stepIndex, totalSteps int) ImageDownloadResult {
	catName := getCategoryName(category)
	stepPrefix := fmt.Sprintf("[%d/%d]", stepIndex, totalSteps)
	result := ImageDownloadResult{
		Category: category,
	}

	if isAborted() {
		return result
	}

	/* 1. 提取图标条目：始终全量扫描 JS 数据文件
	 * 本轮新增条目在数据阶段已写入文件，因此全量扫描既覆盖新增图标，
	 * 也能补回历史上被删除或下载失败而缺失的图标（不再只在「无新增数据」时才扫描） */
	entries := parseExistingJsIconEntries(category)

	log.Printf("[DataUpdater] downloadMissingIcons: category=%s, 扫描JS条目=%d条", category, len(entries))

	result.TotalIcons = len(entries)
	if len(entries) == 0 {
		addProgressLog("warning", fmt.Sprintf("⚠️ %s %s数据中无有效图标条目", stepPrefix, catName))
		return result
	}

	/* 2. 去重 + 检查本地已存在的图标，过滤出需要下载的 */
	/* 使用 publicPtDir（由 initPublicPtDir 初始化），自动适配 dev/dist 两种模式 */
	iconDir := filepath.Join(publicPtDir, getIconDirName(category))

	/* 图标去重（技能可能多技能共享同一icon） */
	seenIcons := make(map[string]bool)
	var toDownload []iconEntry

	for _, entry := range entries {
		if seenIcons[entry.fileName] {
			continue
		}
		seenIcons[entry.fileName] = true

		/* 检查文件是否已存在 */
		localPath := filepath.Join(iconDir, entry.fileName)
		if _, err := os.Stat(localPath); err == nil {
			result.Skipped++
			continue
		}

		toDownload = append(toDownload, entry)
	}

	if len(toDownload) == 0 {
		addProgressLog("success", fmt.Sprintf("✅ %s %s图片已全部存在，无需补全（共%d条，已存在%d张）", stepPrefix, catName, result.TotalIcons, result.Skipped))
		addCompletedCategory(category + "_icon")
		return result
	}

	/* 3. 确保图标目录存在 */
	if err := os.MkdirAll(iconDir, 0755); err != nil {
		result.Error = fmt.Sprintf("创建%s图标目录失败: %v", catName, err)
		addProgressLog("error", fmt.Sprintf("❌ %s %s", stepPrefix, result.Error))
		return result
	}

	addProgressLog("info", fmt.Sprintf("🔄 %s 开始补全%s图片（JS数据%d条，缺失%d张，已存在%d张）", stepPrefix, catName, result.TotalIcons, len(toDownload), result.Skipped))

	/* 4. 逐个下载缺失的图标 */
	for i, entry := range toDownload {
		if isAborted() {
			break
		}

		if aborted := limiter.Wait(); aborted {
			break
		}

		doneCount := i + 1
		percent := doneCount * 100 / len(toDownload)

		/* 从 FlyFF API 下载图片（自动重试3次） */
		apiPath := getImageAPIPath(category, entry.icon)
		downloadURL := flyffAPIBaseURL + apiPath

		var resp *http.Response
		var lastErr error
		var lastStatusCode int
		downloadSuccess := false

		for attempt := 1; attempt <= maxAPIRetryCount; attempt++ {
			if isAborted() {
				break
			}

			client := &http.Client{Timeout: 15 * time.Second}
			var httpErr error
			resp, httpErr = client.Get(downloadURL)

			if httpErr != nil {
				lastErr = httpErr
				lastStatusCode = 0
				if attempt < maxAPIRetryCount {
					time.Sleep(time.Duration(attempt) * time.Second)
				}
				continue
			}

			if resp.StatusCode == http.StatusOK {
				downloadSuccess = true
				break
			}

			lastStatusCode = resp.StatusCode
			resp.Body.Close()
			lastErr = fmt.Errorf("HTTP %d", lastStatusCode)

			/* 404 不需要重试，服务器确实不存在该文件 */
			if lastStatusCode == http.StatusNotFound {
				break
			}

			if attempt < maxAPIRetryCount {
				time.Sleep(time.Duration(attempt) * time.Second)
			}
		}

		if !downloadSuccess {
			result.Failed++
			result.FailedIconIds = append(result.FailedIconIds, entry.fileName)
			if result.Failed <= 10 {
				if lastStatusCode == http.StatusNotFound {
					/* 404：服务器不存在该文件 */
					addProgressLog("error", fmt.Sprintf("❌ %s [%d/%d] %s图片 %s - 服务器数据返回不存在该文件", stepPrefix, doneCount, len(toDownload), catName, entry.fileName))
				} else if lastErr != nil {
					addProgressLog("error", fmt.Sprintf("❌ %s [%d/%d] 下载%s图片失败: %s - %v（重试%d次）", stepPrefix, doneCount, len(toDownload), catName, entry.fileName, lastErr, maxAPIRetryCount))
				} else {
					addProgressLog("error", fmt.Sprintf("❌ %s [%d/%d] 下载%s图片失败: %s（重试%d次）", stepPrefix, doneCount, len(toDownload), catName, entry.fileName, maxAPIRetryCount))
				}
			}
			updateProgressState(fmt.Sprintf("%s_icon", category), fmt.Sprintf("%s [%d/%d] 下载%s图片", stepPrefix, doneCount, len(toDownload), catName), doneCount, len(toDownload), percent)
			/* 实时更新图片下载结果到全局进度 */
			updateProgressImageResult(result)
			continue
		}

		/* 读取图片数据 */
		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()
		if err != nil {
			result.Failed++
			result.FailedIconIds = append(result.FailedIconIds, entry.fileName)
			updateProgressImageResult(result)
			continue
		}

		/* 写入本地文件 */
		localPath := filepath.Join(iconDir, entry.fileName)
		if err := os.WriteFile(localPath, body, 0644); err != nil {
			result.Failed++
			result.FailedIconIds = append(result.FailedIconIds, entry.fileName)
			updateProgressImageResult(result)
			continue
		}

		result.Downloaded++
		updateProgressState(fmt.Sprintf("%s_icon", category), fmt.Sprintf("%s [%d/%d] 下载%s图片: %s", stepPrefix, doneCount, len(toDownload), catName, entry.fileName), doneCount, len(toDownload), percent)
		/* 实时更新图片下载结果到全局进度 */
		updateProgressImageResult(result)

		/* 每100张或最后一张输出日志 */
		if doneCount%100 == 0 || doneCount == len(toDownload) {
			addProgressLog("success", fmt.Sprintf("🖼️ %s [%d/%d] 已下载%d张%s图片", stepPrefix, doneCount, len(toDownload), result.Downloaded, catName))
		}
	}

	failInfo := ""
	if result.Failed > 0 {
		failInfo = fmt.Sprintf("，失败%d张", result.Failed)
	}
	doneMsg := fmt.Sprintf("%s %s图片补全完成：JS数据%d条，下载图片%d张，已存在%d张%s", stepPrefix, catName, result.TotalIcons, result.Downloaded, result.Skipped, failInfo)
	addProgressLog("success", fmt.Sprintf("✅ %s", doneMsg))
	addCompletedCategory(category + "_icon")

	return result
}

// ==================== JS 数据文件写入 ====================

func writeJsDataFile(jsFilePath, exportName, category string, newDetails []interface{}) (bool, error) {
	if len(newDetails) == 0 {
		return false, nil
	}
	existingIds := parseExistingJsIds(jsFilePath)
	existingContent := ""
	if data, err := os.ReadFile(jsFilePath); err == nil {
		existingContent = string(data)
	}
	var newEntries []string
	for _, item := range newDetails {
		if item == nil {
			continue
		}
		itemMap, ok := item.(map[string]interface{})
		if !ok {
			continue
		}
		id, ok := itemMap["id"]
		if !ok {
			continue
		}
		var idInt int
		switch v := id.(type) {
		case float64:
			idInt = int(v)
		case int:
			idInt = v
		default:
			continue
		}
		if existingIds[idInt] {
			continue
		}
		itemJSON, err := json.MarshalIndent(itemMap, "  ", "  ")
		if err != nil {
			continue
		}
		entry := fmt.Sprintf("  '%d': %s,", idInt, string(itemJSON))
		newEntries = append(newEntries, entry)
	}
	if len(newEntries) == 0 {
		return false, nil
	}
	newBlock := strings.Join(newEntries, "\n")
	var finalContent string
	if existingContent != "" {
		lastBraceIdx := strings.LastIndex(existingContent, "\n}")
		if lastBraceIdx <= 0 {
			/* 文件存在但找不到 "\n}"：说明末尾格式异常（缺闭合大括号/无换行等）。
			 * 此时若走「重建整个文件」的兜底分支，会把现有全部条目覆盖掉，造成本地数据丢失，
			 * 因此这里直接拒绝写入，由人工确认文件格式后再更新。 */
			return false, fmt.Errorf("数据文件 %s 末尾未找到闭合大括号（\\n}），为避免覆盖已有数据已中止写入，请检查文件格式", jsFilePath)
		}
		/* 截取到闭合大括号之前的内容 */
		prefix := existingContent[:lastBraceIdx]
		/* 规范化 prefix 末尾：无论末尾条目是否已带逗号，都确保新条目块前有换行。
		 * 若在此处漏掉换行，新条目会与末尾条目粘连成同一行（如 "},  'N': {"），
		 * 该条目不在行首 → parseExistingJsIds 漏检 → 每次更新重复追加。 */
		trimmed := strings.TrimRight(prefix, " \t\r\n")
		if len(trimmed) == 0 || trimmed[len(trimmed)-1] == '{' || trimmed[len(trimmed)-1] == ',' {
			/* 空对象 / 末尾条目已带逗号：仅补换行 */
			prefix = trimmed + "\n"
		} else {
			/* 末尾条目无逗号：补逗号 + 换行 */
			prefix = trimmed + ",\n"
		}
		finalContent = prefix + newBlock + "\n}"
	} else {
		/* 文件不存在或为空：首次创建 */
		finalContent = fmt.Sprintf("export const %s = {\n%s\n}\n", exportName, newBlock)
	}
	/* 写入文件并自动验证修复 */
	if err := writeAndValidateJsDataFile(jsFilePath, []byte(finalContent), category); err != nil {
		return false, err
	}
	return true, nil
}

// ==================== 带进度更新的增量更新核心逻辑 ====================

/**
 * @function updateCategoryDataWithProgress
 * @description 执行单个类别的增量更新，中止时已获取数据写入文件支持续传
 */
func updateCategoryDataWithProgress(category string, limiter *RateLimiter, stepIndex, totalSteps int) (DataUpdateResult, []interface{}, bool) {
	catName := getCategoryName(category)
	stepPrefix := fmt.Sprintf("[%d/%d]", stepIndex, totalSteps)
	result := DataUpdateResult{
		Category: category,
	}

	if isAborted() {
		return result, nil, true
	}

	// 1. 获取远程 ID 列表（始终请求最新数据，确保不漏掉远程新增的物品）
	updateProgressState(fmt.Sprintf("%s_fetch_ids", category),
		fmt.Sprintf("%s 正在获取%s远程ID列表...", stepPrefix, catName), 0, 1, 0)
	addProgressLog("info", fmt.Sprintf("🔄 %s 正在获取%s远程ID列表...", stepPrefix, catName))

	if aborted := limiter.Wait(); aborted {
		return result, nil, true
	}

	remoteIds, err := fetchRemoteIDList(category)
	if err != nil {
		// API 请求失败时，尝试使用本地缓存作为降级方案
		cachedIds := loadCachedIDList(category)
		if cachedIds != nil {
			remoteIds = cachedIds
			addProgressLog("warning", fmt.Sprintf("⚠️ %s 远程API获取失败，使用本地缓存的%sID列表（%d个）", stepPrefix, catName, len(remoteIds)))
			updateProgressState(fmt.Sprintf("%s_fetch_ids", category),
				fmt.Sprintf("%s 使用本地缓存的%sID列表（%d个）", stepPrefix, catName, len(remoteIds)), 1, 1, 100)
		} else {
			result.Error = fmt.Sprintf("获取远程ID列表失败: %v", err)
			addProgressLog("error", fmt.Sprintf("❌ %s 获取%s远程ID列表失败: %v", stepPrefix, catName, err))
			return result, nil, false
		}
	} else {
		// 保存 ID 列表
		if err := saveIDList(category, remoteIds); err != nil {
			log.Printf("[DataUpdater] 保存 %s ID列表失败: %v", category, err)
		} else {
			result.IDListSaved = true
		}
	}

	result.TotalRemote = len(remoteIds)
	addProgressLog("success", fmt.Sprintf("📊 %s %sID列表: %d 个", stepPrefix, catName, len(remoteIds)))

	// 3. 解析本地已有 ID
	jsFilePath := getTargetJsFilePath(category)
	exportName := getExportName(category)
	existingIds := parseExistingJsIds(jsFilePath)
	result.TotalLocal = len(existingIds)

	// 4. 计算缺失 ID（远程有而本地没有）
	var missingIds []int
	remoteIdSet := make(map[int]bool, len(remoteIds))
	for _, id := range remoteIds {
		remoteIdSet[id] = true
		if !existingIds[id] {
			missingIds = append(missingIds, id)
		}
	}
	sort.Ints(missingIds)

	// 5. 检测冗余 ID（本地有而远程没有）
	var redundantIds []int
	for id := range existingIds {
		if !remoteIdSet[id] {
			redundantIds = append(redundantIds, id)
		}
	}
	sort.Ints(redundantIds)
	result.RedundantCount = len(redundantIds)
	/* 冗余ID必须回填，前端「冗余ID: ...」依赖该字段（缺失时只会显示数量） */
	result.RedundantIds = redundantIds

	if len(redundantIds) > 0 {
		/* 冗余数据日志：显示数量和前20个ID */
		redundantStr := intsToString(redundantIds, 20)
		addProgressLog("warning", fmt.Sprintf("⚠️ %s 本地%s存在冗余数据（远程%d，本地%d，冗余%d个）：[%s]", stepPrefix, catName, len(remoteIds), len(existingIds), len(redundantIds), redundantStr))
	}

	if len(missingIds) == 0 {
		if len(redundantIds) > 0 {
			msg := fmt.Sprintf("%s %s数据无缺失，但存在冗余（远程%d，本地%d，冗余%d）", stepPrefix, catName, len(remoteIds), len(existingIds), len(redundantIds))
			addProgressLog("warning", fmt.Sprintf("⚠️ %s", msg))
			updateProgressState(fmt.Sprintf("%s_detail", category), msg, 1, 1, 100)
		} else {
			msg := fmt.Sprintf("%s %s数据已是最新（远程%d，本地%d），无需更新", stepPrefix, catName, len(remoteIds), len(existingIds))
			addProgressLog("success", fmt.Sprintf("✅ %s", msg))
			updateProgressState(fmt.Sprintf("%s_detail", category), msg, 0, 0, 100)
		}
		addCompletedCategory(category)
		return result, nil, false
	}

	// 计算断点续传的跳过数和总缺失数
	// TotalMissing = 远程总数 - 远程获取前的本地数（即最初需要拉取的总数）
	// SkippedCount = 本次跳过的数量（续传时已保存到文件的数据）
	globalProgress.mu.Lock()
	skipped := globalProgress.TotalMissing - len(missingIds)
	if globalProgress.TotalMissing == 0 {
		// 首次启动：设置 TotalMissing
		globalProgress.TotalMissing = len(missingIds)
		skipped = 0
	}
	globalProgress.SkippedCount = skipped
	totalMissing := globalProgress.TotalMissing
	globalProgress.mu.Unlock()

	resumeInfo := ""
	if skipped > 0 {
		resumeInfo = fmt.Sprintf("（续传：已跳过%d条）", skipped)
	}
	msg := fmt.Sprintf("%s 开始增量拉取%s详情（总计%d，已有%d，需新增%d%s）", stepPrefix, catName, len(remoteIds), len(existingIds), len(missingIds), resumeInfo)
	addProgressLog("info", fmt.Sprintf("🔄 %s", msg))

	// 5. 逐个获取详情
	var allNewDetails []interface{}
	var failedIds []int
	endpoint := getAPIEndpoint(category)

	for i, id := range missingIds {
		if isAborted() {
			if len(allNewDetails) > 0 {
				writeJsDataFile(jsFilePath, exportName, category, allNewDetails)
				result.NewCount = len(allNewDetails)
				result.FileUpdated = true
				addProgressLog("info", fmt.Sprintf("💾 %s 已保存 %d 条%s数据（支持续传）", stepPrefix, len(allNewDetails), catName))
			}
			result.FailedCount = len(failedIds)
			result.FailedIds = failedIds
			abortMsg := fmt.Sprintf("%s 已获取%s %d/%d，中止后可继续", stepPrefix, catName, skipped+len(allNewDetails), totalMissing)
			addProgressLog("warning", fmt.Sprintf("⏹ %s", abortMsg))
			return result, allNewDetails, true
		}

		if aborted := limiter.Wait(); aborted {
			if len(allNewDetails) > 0 {
				writeJsDataFile(jsFilePath, exportName, category, allNewDetails)
				result.NewCount = len(allNewDetails)
				result.FileUpdated = true
				addProgressLog("info", fmt.Sprintf("💾 %s 已保存 %d 条%s数据（支持续传）", stepPrefix, len(allNewDetails), catName))
			}
			result.FailedCount = len(failedIds)
			result.FailedIds = failedIds
			abortMsg := fmt.Sprintf("%s 已获取%s %d/%d，中止后可继续", stepPrefix, catName, skipped+len(allNewDetails), totalMissing)
			addProgressLog("warning", fmt.Sprintf("⏹ %s", abortMsg))
			return result, allNewDetails, true
		}

		// 使用总缺失数计算百分比（续传时进度不会回退）
		doneCount := skipped + i + 1
		percent := doneCount * 100 / totalMissing

		detailPath := fmt.Sprintf("/%s/%d", endpoint, id)
		data, err := flyffAPIGet(detailPath)

		name := ""
		if data != nil {
			if itemMap, ok := data.(map[string]interface{}); ok {
				if nameObj, ok := itemMap["name"].(map[string]interface{}); ok {
					if cns, ok := nameObj["cns"].(string); ok && cns != "" {
						name = cns
					} else if en, ok := nameObj["en"].(string); ok && en != "" {
						name = en
					}
				}
			}
		}

		if err != nil {
			failedIds = append(failedIds, id)
			progressMsg := fmt.Sprintf("%s [%d/%d] 获取%s ID:%d 失败", stepPrefix, doneCount, totalMissing, catName, id)
			updateProgressState(fmt.Sprintf("%s_detail", category), progressMsg, doneCount, totalMissing, percent)
			if len(failedIds)%10 == 1 {
				addProgressLog("error", fmt.Sprintf("❌ %s", progressMsg))
			}
		} else {
			allNewDetails = append(allNewDetails, data)
			nameInfo := ""
			if name != "" {
				nameInfo = fmt.Sprintf(" %s", name)
			}
			progressMsg := fmt.Sprintf("%s [%d/%d] 获取%s%s (ID:%d)", stepPrefix, doneCount, totalMissing, catName, nameInfo, id)
			updateProgressState(fmt.Sprintf("%s_detail", category), progressMsg, doneCount, totalMissing, percent)
		}

		/* 实时更新数据更新结果到全局进度 */
		result.NewCount = len(allNewDetails)
		result.FailedCount = len(failedIds)
		result.FailedIds = failedIds
		updateProgressCategoryResult(result)
	}

	// 6. 写入文件
	if len(allNewDetails) > 0 {
		writeMsg := fmt.Sprintf("%s 正在写入%s数据文件（%d条）...", stepPrefix, catName, len(allNewDetails))
		updateProgressState(fmt.Sprintf("%s_write", category), writeMsg, 1, 1, 100)
		addProgressLog("info", fmt.Sprintf("💾 %s", writeMsg))

		updated, err := writeJsDataFile(jsFilePath, exportName, category, allNewDetails)
		if err != nil {
			result.Error = fmt.Sprintf("写入JS文件失败: %v", err)
			addProgressLog("error", fmt.Sprintf("❌ %s 写入%s数据文件失败: %v", stepPrefix, catName, err))
			return result, allNewDetails, false
		}
		result.FileUpdated = updated
	}

	failInfo := ""
	if result.FailedCount > 0 {
		failInfo = fmt.Sprintf("，失败%d条", result.FailedCount)
	}
	doneMsg := fmt.Sprintf("%s %s更新完成：远程%d，本地%d，新增%d%s", stepPrefix, catName, result.TotalRemote, result.TotalLocal, result.NewCount, failInfo)
	addProgressLog("success", fmt.Sprintf("✅ %s", doneMsg))
	updateProgressState(fmt.Sprintf("%s_detail", category), doneMsg, totalMissing, totalMissing, 100)
	addCompletedCategory(category)

	// 重置类别级别的计数，为下一个类别准备
	globalProgress.mu.Lock()
	globalProgress.TotalMissing = 0
	globalProgress.SkippedCount = 0
	globalProgress.mu.Unlock()

	return result, allNewDetails, false
}

// ==================== 通用更新执行器 ====================

/**
 * @typedef updatePhases
 * @description 更新阶段开关。续传时数据类别之外的图片/CNS阶段也要能被续传覆盖，
 * @description 否则在图片或CNS阶段中止后，续传会因「数据类别都已完成」而直接收工，剩余步骤永久跳过。
 */
type updatePhases struct {
	images bool /* 是否执行图片下载阶段 */
	cns    bool /* 是否执行CNS比对阶段 */
}

/**
 * @function upsertDataResult
 * @description 按类别写入数据更新结果（同类别覆盖，避免续传时同一类别重复累计）
 */
func upsertDataResult(list []DataUpdateResult, r DataUpdateResult) []DataUpdateResult {
	for i := range list {
		if list[i].Category == r.Category {
			list[i] = r
			return list
		}
	}
	return append(list, r)
}

/**
 * @function upsertImageResult
 * @description 按类别写入图片下载结果（同类别覆盖）
 */
func upsertImageResult(list []ImageDownloadResult, r ImageDownloadResult) []ImageDownloadResult {
	for i := range list {
		if list[i].Category == r.Category {
			list[i] = r
			return list
		}
	}
	return append(list, r)
}

/**
 * @function upsertFieldResult
 * @description 按类别写入CNS比对结果（同类别覆盖）
 */
func upsertFieldResult(list []FieldUpdateResult, r FieldUpdateResult) []FieldUpdateResult {
	for i := range list {
		if list[i].Category == r.Category {
			list[i] = r
			return list
		}
	}
	return append(list, r)
}

/**
 * @function appendFieldResultIfAbsent
 * @description 仅当该类别尚无结果时追加。用于「新增数据CNS汇总」这类零值占位统计，
 * @description 避免覆盖续传前已完成的真实CNS比对结果。
 */
func appendFieldResultIfAbsent(list []FieldUpdateResult, r FieldUpdateResult) []FieldUpdateResult {
	for _, e := range list {
		if e.Category == r.Category {
			return list
		}
	}
	return append(list, r)
}

/**
 * @function executeBatchUpdate
 * @description 执行完整的增量更新流程
 * @description 步骤编排：[1/N] 版本比对 → [2~6/N] 数据拉取(物品/怪物/技能/套装/成就) → [7~9/N] 图片下载 → [10~11/N] CNS比对(物品/怪物/技能/成就 + 套装)
 * @description 无论版本是否变化，都先请求远程ID列表与本地数据比对，有缺失则拉取详情并写入文件
 * @description 本地ID比对优先使用本地ID列表缓存文件（如 item_id.json），不存在时回退解析JS文件中的纯数字ID（如ITEM_INFO中的id字段）
 * @param {[]string} startCategories - 从哪些类别开始更新（跳过已完成的）
 * @param {*VersionCompareResult} versionInfo - 版本比对结果（续传时复用，首次为nil则执行比对）
 * @param {updatePhases} phases - 图片/CNS 阶段开关（续传时按已完成情况传入）
 */
func executeBatchUpdate(startCategories []string, versionInfo *VersionCompareResult, phases updatePhases) {
	limiter := NewRateLimiter()
	wasAborted := false

	/* 续传时复用上一轮已完成的类别/图片/CNS结果，保证最终统计与落库记录不丢失前序阶段 */
	prev := readProgress()
	results := make([]DataUpdateResult, 0, len(prev.CategoryResults))
	results = append(results, prev.CategoryResults...)
	imageResults := make([]ImageDownloadResult, 0, len(prev.ImageResults))
	imageResults = append(imageResults, prev.ImageResults...)
	fieldResults := make([]FieldUpdateResult, 0, len(prev.FieldResults))
	fieldResults = append(fieldResults, prev.FieldResults...)

	// 版本比对
	if versionInfo == nil {
		updateProgressState("version_compare", "正在比对版本...", 0, 1, 0)
		addProgressLog("info", "🔄 正在比对版本...")

		remoteVersion, err := fetchRemoteVersion()
		if err != nil {
			errMsg := fmt.Sprintf("获取远程版本失败: %v", err)
			addProgressLog("error", fmt.Sprintf("❌ %s", errMsg))
			abortProgress(errMsg)
			return
		}

		localVersion := readLocalVersion()
		needsUpdate := compareVersions(localVersion, remoteVersion)

		versionInfo = &VersionCompareResult{
			RemoteVersion: remoteVersion,
			LocalVersion:  localVersion,
			NeedsUpdate:   needsUpdate,
		}
		setVersionResult(versionInfo)
	} else {
		// 续传：跳过版本比对，复用已有的版本信息
		setVersionResult(versionInfo)
		addProgressLog("info", fmt.Sprintf("▶️ 续传：跳过版本比对（本地 %s → 远程 %s），继续更新...", versionInfo.LocalVersion, versionInfo.RemoteVersion))
	}

	/**
	 * 总步骤数：版本比对1 + 数据拉取5(物品/怪物/技能/套装/成就) + 图片下载3(物品/怪物/技能) + CNS比对2(新增CNS汇总 + 套装) = 11
	 * 版本变化时额外追加逐条CNS比对步骤（物品/怪物/技能/成就）
	 */
	totalSteps := 1 + len(updateCategories) + len(imageCategories) + 2
	if versionInfo.NeedsUpdate {
		totalSteps += len(cnsCompareCategories)
	}
	setTotalSteps(totalSteps)

	/* 无论版本是否变化，都执行全量ID比对流程 */
	/* 先请求远程ID列表，再与本地数据做比对，有缺失的ID就请求API获取详情并写入JS文件，同时下载缺失图片 */
	if versionInfo.NeedsUpdate {
		addProgressLog("info", fmt.Sprintf("🆕 检测到新版本 %s → %s，将执行全量ID比对与已有条目逐条CNS比对", versionInfo.LocalVersion, versionInfo.RemoteVersion))
	} else {
		log.Printf("[DataUpdater] 数据版本相同 (%s)，但仍执行全量ID比对（可能有手动删除或文件损坏导致的数据缺失）", versionInfo.LocalVersion)
		addProgressLog("info", fmt.Sprintf("📋 版本相同 (%s)，仍执行全量ID比对（检测本地是否有数据缺失）", versionInfo.LocalVersion))
	}

	doneMsg := fmt.Sprintf("[1/%d] 版本比对完成：本地 %s → 远程 %s，开始全量ID比对", totalSteps, versionInfo.LocalVersion, versionInfo.RemoteVersion)
	addProgressLog("success", fmt.Sprintf("✅ %s", doneMsg))
	updateProgressState("version_compare", doneMsg, 1, 1, 100)

	// 逐类别更新数据（步骤 2~6：物品、怪物、技能、套装、成就）
	/* 收集各类别新增详情数据，用于后续图片下载和CNS比对 */
	newDetailsMap := make(map[string][]interface{})
	for _, category := range startCategories {
		if isAborted() {
			wasAborted = true
			break
		}
		// 步骤编号按 updateCategories 中的真实位置计算（续传时 startCategories 是子集，不能按下标推算）
		stepIdx := 2
		for j, c := range updateCategories {
			if c == category {
				stepIdx = j + 2
				break
			}
		}
		result, newDetails, aborted := updateCategoryDataWithProgress(category, limiter, stepIdx, totalSteps)
		results = upsertDataResult(results, result)
		if newDetails != nil && len(newDetails) > 0 {
			newDetailsMap[category] = newDetails
		}
		if aborted {
			wasAborted = true
			break
		}
	}

	/* 数据拉取完成后，逐类别补全缺失图片（步骤 7~9）——全量比对JS条目与本地图标目录，历史缺失的图标也会被补回 */
	if !wasAborted && phases.images {
		for i, category := range imageCategories {
			if isAborted() {
				wasAborted = true
				break
			}
			// 步骤编号：图片下载从[2+len(updateCategories)/N]开始
			stepIdx := i + 2 + len(updateCategories)
			log.Printf("[DataUpdater] 开始补全%s图片 (步骤 %d/%d)，本轮新增数据=%d条", getCategoryName(category), stepIdx, totalSteps, len(newDetailsMap[category]))
			imgResult := downloadMissingIcons(category, limiter, stepIdx, totalSteps)
			log.Printf("[DataUpdater] %s图片补全完成：共%d，下载%d，已存在%d，失败%d", getCategoryName(category), imgResult.TotalIcons, imgResult.Downloaded, imgResult.Skipped, imgResult.Failed)
			imageResults = upsertImageResult(imageResults, imgResult)
		}
	}

	/* CNS比对步骤 */
	/* 步骤10：新增数据CNS汇总（版本变化时该步改为提示，实际逐条比对在尾部执行） */
	/* 步骤11：套装CNS名称比对（逐条请求API比对name.cns） */
	cnsStep1 := 2 + len(updateCategories) + len(imageCategories)
	cnsStep2 := cnsStep1 + 1
	if !wasAborted && phases.cns {
		if versionInfo.NeedsUpdate {
			/* 版本变化：已有条目的 name.cns / description.cns 需要与官方逐条比对（尾部步骤执行） */
			addProgressLog("info", fmt.Sprintf("📋 [%d/%d] 版本已变化，将对已有条目逐条比对CNS名称与描述", cnsStep1, totalSteps))
		} else {
			/* 版本未变化：新增数据自带最新CNS，无需额外比对 */
			hasNewData := false
			for _, nd := range newDetailsMap {
				if len(nd) > 0 {
					hasNewData = true
					break
				}
			}
			if hasNewData {
				addProgressLog("info", fmt.Sprintf("📋 [%d/%d] 处理新增数据CNS字段（新增数据自带最新CNS，无需额外比对）", cnsStep1, totalSteps))
				for _, category := range updateCategories {
					if category == "equipset" {
						continue /* 套装CNS在步骤11单独处理 */
					}
					newDetails := newDetailsMap[category]
					catName := getCategoryName(category)
					fieldResult := FieldUpdateResult{
						Category:       category,
						TotalCompared:  len(newDetails),
						NameCnsUpdated: 0,
						DescCnsUpdated: 0,
					}
					addProgressLog("success", fmt.Sprintf("✅ %s新增%d条数据，CNS字段为API最新值，无需比对", catName, len(newDetails)))
					fieldResults = appendFieldResultIfAbsent(fieldResults, fieldResult)
					updateProgressFieldResult(fieldResult)
				}
			} else {
				addProgressLog("success", fmt.Sprintf("📋 [%d/%d] 无新增数据，跳过CNS比对", cnsStep1, totalSteps))
			}
		}

		/* 步骤11：套装CNS名称比对（逐条请求API比对name.cns） */
		if !isAborted() {
			addProgressLog("info", fmt.Sprintf("📋 [%d/%d] 比对套装CNS名称（确保套装中文名称为最新）", cnsStep2, totalSteps))
			equipsetFieldResult := compareAndUpdateEquipsetCns(limiter, cnsStep2, totalSteps)
			fieldResults = upsertFieldResult(fieldResults, equipsetFieldResult)
		}

		/* 版本变化时：对已有条目逐条比对CNS（物品/怪物/技能/成就） */
		if versionInfo.NeedsUpdate {
			for i, category := range cnsCompareCategories {
				if isAborted() {
					wasAborted = true
					break
				}
				stepIdx := cnsStep2 + 1 + i
				addProgressLog("info", fmt.Sprintf("📋 [%d/%d] 逐条比对%s已有条目CNS名称与描述", stepIdx, totalSteps, getCategoryName(category)))
				fr := compareAndUpdateFields(category, limiter, stepIdx, totalSteps)
				fieldResults = upsertFieldResult(fieldResults, fr)
			}
		}
	}

	if wasAborted {
		abortMsg := "更新任务已被用户中止，可再次点击继续"
		addProgressLog("warning", fmt.Sprintf("⏹ %s", abortMsg))
		abortProgress(abortMsg)
		return
	}

	// 全部完成，更新版本号
	if err := saveLocalVersion(versionInfo.RemoteVersion); err != nil {
		log.Printf("[DataUpdater] 保存版本号失败: %v", err)
	}

	// 汇总数据更新
	totalNew := 0
	totalFailed := 0
	totalRedundant := 0
	for _, r := range results {
		totalNew += r.NewCount
		totalFailed += r.FailedCount
		totalRedundant += r.RedundantCount
	}

	itemNew, monsterNew, skillNew, equipsetNew, achievementNew := 0, 0, 0, 0, 0
	for _, r := range results {
		switch r.Category {
		case "item":
			itemNew = r.NewCount
		case "monster":
			monsterNew = r.NewCount
		case "skill":
			skillNew = r.NewCount
		case "equipset":
			equipsetNew = r.NewCount
		case "achievement":
			achievementNew = r.NewCount
		}
	}

	// 汇总图片下载
	totalImgDownloaded := 0
	totalImgFailed := 0
	for _, ir := range imageResults {
		totalImgDownloaded += ir.Downloaded
		totalImgFailed += ir.Failed
	}

	// 汇总CNS比对
	totalNameCnsUpdated := 0
	totalDescCnsUpdated := 0
	for _, fr := range fieldResults {
		totalNameCnsUpdated += fr.NameCnsUpdated
		totalDescCnsUpdated += fr.DescCnsUpdated
	}

	redundantInfo := ""
	if totalRedundant > 0 {
		redundantInfo = fmt.Sprintf(" | 冗余%d条", totalRedundant)
	}
	message := fmt.Sprintf(
		"更新完成！版本 %s → %s | 物品新增%d，怪物新增%d，技能新增%d，套装新增%d，成就新增%d | 数据共新增%d条，失败%d条%s | 图片下载%d张，失败%d张 | CNS名称更新%d，描述更新%d",
		versionInfo.LocalVersion, versionInfo.RemoteVersion,
		itemNew, monsterNew, skillNew, equipsetNew, achievementNew,
		totalNew, totalFailed, redundantInfo,
		totalImgDownloaded, totalImgFailed,
		totalNameCnsUpdated, totalDescCnsUpdated,
	)

	/* 按类型汇总失败ID */
	failedIdsMap := make(map[string][]int)
	for _, r := range results {
		if len(r.FailedIds) > 0 {
			catKey := r.Category
			if catKey == "item" {
				catKey = "items"
			}
			failedIdsMap[catKey] = append(failedIdsMap[catKey], r.FailedIds...)
		}
	}

	/* 图片下载失败不再往 failedIdsMap["image"] 里塞 0 占位：
	 * 图标失败记录的是文件名而非数值ID，塞 0 会让前端失败面板显示「图标 0」并污染计数。
	 * 图片失败数量通过 imageResults[].failed 与汇总消息体现，重试请走图标下载流程。 */

	addProgressLog("success", fmt.Sprintf("🎉 %s", message))
	batchResult := &BatchUpdateResult{
		Version:      *versionInfo,
		Results:      results,
		ImageResults: imageResults,
		FieldResults: fieldResults,
		Message:      message,
		FailedIdsMap: failedIdsMap,
	}
	completeProgress(batchResult)

	/* 保存更新记录到数据库（仅在有数据变化时写入） */
	saveApiUpdateLog(versionInfo, batchResult)

	log.Printf("[DataUpdater] 更新完成: %s", message)
}

// ==================== HTTP 处理器 ====================

func handleVersionCompare(w http.ResponseWriter, r *http.Request) {
	remoteVersion, err := fetchRemoteVersion()
	if err != nil {
		SendError(w, http.StatusBadGateway, fmt.Sprintf("获取远程版本失败: %v", err))
		return
	}
	localVersion := readLocalVersion()
	needsUpdate := compareVersions(localVersion, remoteVersion)
	SendSuccess(w, "版本比对完成", VersionCompareResult{
		RemoteVersion: remoteVersion,
		LocalVersion:  localVersion,
		NeedsUpdate:   needsUpdate,
	})
}

/**
 * @function handleBatchUpdateStart
 * @description 启动全新的一键增量更新（异步），从步骤1开始
 */
func handleBatchUpdateStart(w http.ResponseWriter, r *http.Request) {
	current := readProgress()
	if current.Running {
		SendError(w, http.StatusConflict, "已有更新任务正在运行")
		return
	}
	/* 原子抢占运行权，防止并发请求同时通过 Running 检查 */
	if !tryAcquireUpdateRun() {
		SendError(w, http.StatusConflict, "已有更新任务正在运行")
		return
	}

	resetProgress()
	setAborted(false)

	go func() {
		defer releaseUpdateRun()
		log.Println("[DataUpdater] 开始一键增量更新...")
		executeBatchUpdate(updateCategories, nil, updatePhases{images: true, cns: true})
	}()

	SendSuccess(w, "更新任务已启动", map[string]bool{"started": true})
}

/**
 * @function handleResumeUpdate
 * @description 续传更新（异步），跳过版本比对和已完成类别，从中断处继续
 */
func handleResumeUpdate(w http.ResponseWriter, r *http.Request) {
	current := readProgress()
	if current.Running {
		SendError(w, http.StatusConflict, "已有更新任务正在运行")
		return
	}
	if !current.CanResume {
		SendError(w, http.StatusBadRequest, "当前不支持续传，请重新开始更新")
		return
	}
	/* 原子抢占运行权，防止并发请求同时通过 Running 检查 */
	if !tryAcquireUpdateRun() {
		SendError(w, http.StatusConflict, "已有更新任务正在运行")
		return
	}

	// 保留之前的日志，不清空
	globalProgress.mu.Lock()
	globalProgress.Running = true
	globalProgress.Aborted = false
	globalProgress.Completed = false
	globalProgress.CanResume = false
	globalProgress.EstimatedSec = 0
	globalProgress.Result = nil
	globalProgress.mu.Unlock()
	setAborted(false)

	// 计算剩余类别
	completedSet := make(map[string]bool)
	for _, c := range current.CompletedCategories {
		completedSet[c] = true
	}
	var remainingCategories []string
	for _, c := range updateCategories {
		if !completedSet[c] {
			remainingCategories = append(remainingCategories, c)
		}
	}

	/* 图片/CNS 阶段不在 updateCategories 中，必须单独判断，
	 * 否则在图片下载或CNS比对阶段中止后，续传会因「数据类别都已完成」而直接收工 */
	phases := updatePhases{}
	for _, c := range imageCategories {
		if !completedSet[c+"_icon"] {
			phases.images = true
			break
		}
	}
	if !completedSet["equipset_cns"] {
		phases.cns = true
	}
	if current.VersionResult != nil && current.VersionResult.NeedsUpdate {
		for _, c := range cnsCompareCategories {
			if !completedSet[c+"_cns"] {
				phases.cns = true
				break
			}
		}
	}

	if len(remainingCategories) == 0 && !phases.images && !phases.cns {
		// 所有阶段都完成了，只需保存版本号
		vr := current.VersionResult
		completed := &BatchUpdateResult{Message: "所有类别已更新完成"}
		if vr != nil {
			completed.Version = *vr
			if err := saveLocalVersion(vr.RemoteVersion); err != nil {
				log.Printf("[DataUpdater] 保存版本号失败: %v", err)
			}
		}
		completeProgress(completed)
		releaseUpdateRun()
		SendSuccess(w, "所有类别已完成", map[string]bool{"completed": true})
		return
	}

	// 续传版本结果
	var versionInfo *VersionCompareResult
	if current.VersionResult != nil {
		versionInfo = current.VersionResult
	}

	go func() {
		defer releaseUpdateRun()
		log.Printf("[DataUpdater] 续传更新，剩余类别: %v，图片阶段: %v，CNS阶段: %v", remainingCategories, phases.images, phases.cns)
		executeBatchUpdate(remainingCategories, versionInfo, phases)
	}()

	SendSuccess(w, "续传任务已启动", map[string]interface{}{
		"resumed":             true,
		"remainingCategories": remainingCategories,
	})
}

func handleGetProgress(w http.ResponseWriter, r *http.Request) {
	progress := readProgress()
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(progress)
}

func handleAbortUpdate(w http.ResponseWriter, r *http.Request) {
	setAborted(true)
	log.Println("[DataUpdater] 收到中止请求，正在停止更新任务...")
	SendSuccess(w, "已发送中止信号", map[string]bool{"aborted": true})
}

/**
 * @function handleRetryFailedIds
 * @description 重试失败ID：按类别重新请求详情，写入对应JS数据文件（内部按已有ID去重），并补下载缺失图标。
 * @description 与前端旧的「仅探活」重试不同，此处会真正落地数据到 src/data 并补图标，返回逐类别成功/失败结果。
 * @description 需要请求体 JSON：{"item":[...],"monster":[...],"skill":[...],"achievement":[...]}（缺省类别可省略）
 */
func handleRetryFailedIds(w http.ResponseWriter, r *http.Request) {
	/* 与批量/续传互斥，避免并发写同一JS文件 */
	if !tryAcquireUpdateRun() {
		SendError(w, http.StatusConflict, "已有更新任务正在运行，请稍后再试")
		return
	}
	defer releaseUpdateRun()
	/* 清理上一次可能残留的中止标志，否则限速器/请求会立即退出 */
	setAborted(false)

	var req RetryIdsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, fmt.Sprintf("请求体解析失败: %v", err))
		return
	}

	limiter := NewRateLimiter()
	categoryIDs := []struct {
		category string
		ids      []int
	}{
		{"item", req.Item},
		{"monster", req.Monster},
		{"skill", req.Skill},
		{"achievement", req.Achievement},
	}

	var results []RetryCategoryResult
	imageDownloaded, imageFailed := 0, 0

	for _, c := range categoryIDs {
		if len(c.ids) == 0 {
			continue
		}
		catResult := RetryCategoryResult{Category: c.category}
		endpoint := getAPIEndpoint(c.category)
		jsFilePath := getTargetJsFilePath(c.category)
		exportName := getExportName(c.category)

		var newDetails []interface{}
		for _, id := range c.ids {
			if isAborted() {
				break
			}
			if limiter.Wait() {
				break
			}
			catResult.Retried++
			data, err := flyffAPIGet(fmt.Sprintf("/%s/%d", endpoint, id))
			if err != nil || data == nil {
				catResult.Failed++
				catResult.FailedIds = append(catResult.FailedIds, id)
				continue
			}
			newDetails = append(newDetails, data)
			catResult.Succeeded++
		}

		if len(newDetails) > 0 {
			/* 写入JS文件：writeJsDataFile 内部按已有ID去重，只会追加缺失条目 */
			if _, err := writeJsDataFile(jsFilePath, exportName, c.category, newDetails); err != nil {
				log.Printf("[DataUpdater] 重试写入%s数据文件失败: %v", getCategoryName(c.category), err)
				catResult.Failed += len(newDetails)
				for _, d := range newDetails {
					if m, ok := d.(map[string]interface{}); ok {
						if idv, ok := m["id"].(float64); ok {
							catResult.FailedIds = append(catResult.FailedIds, int(idv))
						}
					}
				}
				catResult.Succeeded = 0
			} else if c.category != "achievement" {
				/* 为新增/补回的条目补下载缺失图标（成就无图标） */
				imgResult := downloadMissingIcons(c.category, limiter, 1, 1)
				imageDownloaded += imgResult.Downloaded
				imageFailed += imgResult.Failed
			}
		}

		results = append(results, catResult)
	}

	SendSuccess(w, "重试完成", map[string]interface{}{
		"results":         results,
		"imageDownloaded": imageDownloaded,
		"imageFailed":     imageFailed,
	})
}

// ==================== 无进度的内部方法（保留兼容） ====================

func updateCategoryData(category string, limiter *RateLimiter) DataUpdateResult {
	result := DataUpdateResult{Category: category}
	limiter.Wait()
	remoteIds, err := fetchRemoteIDList(category)
	if err != nil {
		result.Error = fmt.Sprintf("获取远程ID列表失败: %v", err)
		return result
	}
	result.TotalRemote = len(remoteIds)
	if err := saveIDList(category, remoteIds); err != nil {
		log.Printf("[DataUpdater] 保存 %s ID列表失败: %v", category, err)
	} else {
		result.IDListSaved = true
	}
	jsFilePath := getTargetJsFilePath(category)
	exportName := getExportName(category)
	existingIds := parseExistingJsIds(jsFilePath)
	result.TotalLocal = len(existingIds)
	var missingIds []int
	for _, id := range remoteIds {
		if !existingIds[id] {
			missingIds = append(missingIds, id)
		}
	}
	sort.Ints(missingIds)
	if len(missingIds) == 0 {
		return result
	}
	var allNewDetails []interface{}
	var failedIds []int
	endpoint := getAPIEndpoint(category)
	for i, id := range missingIds {
		limiter.Wait()
		detailPath := fmt.Sprintf("/%s/%d", endpoint, id)
		data, err := flyffAPIGet(detailPath)
		if err != nil {
			failedIds = append(failedIds, id)
			continue
		}
		allNewDetails = append(allNewDetails, data)
		if (i+1)%50 == 0 || (i+1) == len(missingIds) {
			log.Printf("[DataUpdater] [%d/%d] 获取 %s ID:%d", i+1, len(missingIds), category, id)
		}
	}
	result.NewCount = len(allNewDetails)
	result.FailedCount = len(failedIds)
	result.FailedIds = failedIds
	if len(allNewDetails) > 0 {
		updated, err := writeJsDataFile(jsFilePath, exportName, category, allNewDetails)
		if err != nil {
			result.Error = fmt.Sprintf("写入JS文件失败: %v", err)
			return result
		}
		result.FileUpdated = updated
	}
	return result
}

func handleBatchUpdate(w http.ResponseWriter, r *http.Request) {
	log.Println("[DataUpdater] 开始一键增量更新（非流式）...")
	if !tryAcquireUpdateRun() {
		SendError(w, http.StatusConflict, "已有更新任务正在运行")
		return
	}
	defer releaseUpdateRun()
	setAborted(false)
	limiter := NewRateLimiter()
	remoteVersion, err := fetchRemoteVersion()
	if err != nil {
		SendError(w, http.StatusBadGateway, fmt.Sprintf("获取远程版本失败: %v", err))
		return
	}
	localVersion := readLocalVersion()
	needsUpdate := compareVersions(localVersion, remoteVersion)
	versionResult := VersionCompareResult{
		RemoteVersion: remoteVersion,
		LocalVersion:  localVersion,
		NeedsUpdate:   needsUpdate,
	}
	if !needsUpdate {
		SendSuccess(w, "当前数据已是最新版本，无需更新", BatchUpdateResult{
			Version: versionResult,
			Message: fmt.Sprintf("本地版本 %s 与远程版本 %s 一致，无需更新", localVersion, remoteVersion),
		})
		return
	}
	categories := []string{"item", "monster", "skill"}
	var results []DataUpdateResult
	for _, category := range categories {
		result := updateCategoryData(category, limiter)
		results = append(results, result)
	}
	if err := saveLocalVersion(remoteVersion); err != nil {
		log.Printf("[DataUpdater] 保存版本号失败: %v", err)
	}
	totalNew := 0
	totalFailed := 0
	for _, r := range results {
		totalNew += r.NewCount
		totalFailed += r.FailedCount
	}
	message := fmt.Sprintf(
		"更新完成！版本 %s → %s | 物品新增 %d，怪物新增 %d，技能新增 %d | 共新增 %d 条，失败 %d 条",
		localVersion, remoteVersion,
		results[0].NewCount, results[1].NewCount, results[2].NewCount,
		totalNew, totalFailed,
	)

	/* 按类型汇总失败ID */
	failedIdsMap := make(map[string][]int)
	for _, r := range results {
		if len(r.FailedIds) > 0 {
			catKey := r.Category
			if catKey == "item" {
				catKey = "items"
			}
			failedIdsMap[catKey] = append(failedIdsMap[catKey], r.FailedIds...)
		}
	}

	SendSuccess(w, message, BatchUpdateResult{
		Version:      versionResult,
		Results:      results,
		Message:      message,
		FailedIdsMap: failedIdsMap,
	})
}

func handleGetLocalVersion(w http.ResponseWriter, r *http.Request) {
	localVersion := readLocalVersion()
	SendSuccess(w, "获取本地版本成功", map[string]string{"version": localVersion})
}

func handleGetLocalIdCount(w http.ResponseWriter, r *http.Request) {
	categories := []string{"item", "monster", "skill", "equipset"}
	counts := make(map[string]int)
	for _, category := range categories {
		jsFilePath := getTargetJsFilePath(category)
		existingIds := parseExistingJsIds(jsFilePath)
		counts[category] = len(existingIds)
	}
	SendSuccess(w, "获取本地ID数量成功", counts)
}

// ==================== API 更新记录数据库操作 ====================

/**
 * @typedef ApiUpdateLog
 * @description API更新记录结构体，对应 api_update_logs 表
 */
type ApiUpdateLog struct {
	ID               int64  `json:"id"`
	LocalVersion     string `json:"localVersion"`
	RemoteVersion    string `json:"remoteVersion"`
	ItemNew          int    `json:"itemNew"`
	ItemFailed       int    `json:"itemFailed"`
	MonsterNew       int    `json:"monsterNew"`
	MonsterFailed    int    `json:"monsterFailed"`
	SkillNew         int    `json:"skillNew"`
	SkillFailed      int    `json:"skillFailed"`
	EquipsetNew      int    `json:"equipsetNew"`
	EquipsetFailed   int    `json:"equipsetFailed"`
	AchievementNew   int    `json:"achievementNew"`
	AchievementFailed int   `json:"achievementFailed"`
	ImageDownloaded  int    `json:"imageDownloaded"`
	ImageFailed      int    `json:"imageFailed"`
	NameCnsUpdated   int    `json:"nameCnsUpdated"`
	DescCnsUpdated   int    `json:"descCnsUpdated"`
	TotalNew         int    `json:"totalNew"`
	TotalFailed      int    `json:"totalFailed"`
	Message          string `json:"message"`
	CreatedAt        string `json:"createdAt"`
}

/**
 * @function saveApiUpdateLog
 * @description 保存API更新结果到数据库（仅在有数据变化时写入）
 * @param {*VersionCompareResult} versionInfo - 版本比对结果
 * @param {*BatchUpdateResult} batchResult - 批量更新结果
 * @returns {error} 保存错误
 */
func saveApiUpdateLog(versionInfo *VersionCompareResult, batchResult *BatchUpdateResult) error {
	if globalDB == nil {
		return fmt.Errorf("数据库未初始化")
	}

	/* 计算各类别新增和失败数量 */
	itemNew, itemFailed := 0, 0
	monsterNew, monsterFailed := 0, 0
	skillNew, skillFailed := 0, 0
	equipsetNew, equipsetFailed := 0, 0
	achievementNew, achievementFailed := 0, 0
	for _, r := range batchResult.Results {
		switch r.Category {
		case "item":
			itemNew = r.NewCount
			itemFailed = r.FailedCount
		case "monster":
			monsterNew = r.NewCount
			monsterFailed = r.FailedCount
		case "skill":
			skillNew = r.NewCount
			skillFailed = r.FailedCount
		case "equipset":
			equipsetNew = r.NewCount
			equipsetFailed = r.FailedCount
		case "achievement":
			achievementNew = r.NewCount
			achievementFailed = r.FailedCount
		}
	}

	/* 计算图片下载统计 */
	imageDownloaded, imageFailed := 0, 0
	for _, ir := range batchResult.ImageResults {
		imageDownloaded += ir.Downloaded
		imageFailed += ir.Failed
	}

	/* 计算CNS比对统计 */
	nameCnsUpdated, descCnsUpdated := 0, 0
	for _, fr := range batchResult.FieldResults {
		nameCnsUpdated += fr.NameCnsUpdated
		descCnsUpdated += fr.DescCnsUpdated
	}

	/* 仅在有数据变化时写入数据库 */
	hasChanges := itemNew > 0 || monsterNew > 0 || skillNew > 0 || equipsetNew > 0 || achievementNew > 0 ||
		imageDownloaded > 0 || nameCnsUpdated > 0 || descCnsUpdated > 0 ||
		itemFailed > 0 || monsterFailed > 0 || skillFailed > 0 || equipsetFailed > 0 || achievementFailed > 0 || imageFailed > 0

	if !hasChanges {
		log.Println("[DataUpdater] 本次更新无数据变化，不写入更新记录")
		return nil
	}

	totalNew := itemNew + monsterNew + skillNew + equipsetNew + achievementNew
	totalFailed := itemFailed + monsterFailed + skillFailed + equipsetFailed + achievementFailed

	localVer := ""
	remoteVer := ""
	if versionInfo != nil {
		localVer = versionInfo.LocalVersion
		remoteVer = versionInfo.RemoteVersion
	}

	_, err := globalDB.Exec(`
		INSERT INTO api_update_logs (
			local_version, remote_version,
			item_new, item_failed,
			monster_new, monster_failed,
			skill_new, skill_failed,
			equipset_new, equipset_failed,
			achievement_new, achievement_failed,
			image_downloaded, image_failed,
			name_cns_updated, desc_cns_updated,
			total_new, total_failed,
			message
		) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
		localVer, remoteVer,
		itemNew, itemFailed,
		monsterNew, monsterFailed,
		skillNew, skillFailed,
		equipsetNew, equipsetFailed,
		achievementNew, achievementFailed,
		imageDownloaded, imageFailed,
		nameCnsUpdated, descCnsUpdated,
		totalNew, totalFailed,
		batchResult.Message,
	)

	if err != nil {
		log.Printf("[DataUpdater] 保存更新记录失败: %v", err)
		return err
	}

	log.Printf("[DataUpdater] 已保存更新记录: 物品+%d 怪物+%d 技能+%d 套装+%d 成就+%d 图片+%d CNS名称+%d 描述+%d",
		itemNew, monsterNew, skillNew, equipsetNew, achievementNew, imageDownloaded, nameCnsUpdated, descCnsUpdated)
	return nil
}

/**
 * @function queryApiUpdateLogs
 * @description 查询API更新记录列表（按时间倒序，支持分页）
 * @param {int} limit - 每页数量（默认20，最大100）
 * @param {int} offset - 偏移量
 * @returns {[]ApiUpdateLog} 更新记录列表
 * @returns {int} 总记录数
 * @returns {error} 查询错误
 */
func queryApiUpdateLogs(limit, offset int) ([]ApiUpdateLog, int, error) {
	if globalDB == nil {
		return nil, 0, fmt.Errorf("数据库未初始化")
	}

	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	/* 查询总记录数 */
	var totalCount int
	err := globalDB.QueryRow("SELECT COUNT(*) FROM api_update_logs").Scan(&totalCount)
	if err != nil {
		return nil, 0, fmt.Errorf("查询更新记录总数失败: %v", err)
	}

	/* 查询分页记录 */
	rows, err := globalDB.Query(`
		SELECT id, local_version, remote_version,
			item_new, item_failed,
			monster_new, monster_failed,
			skill_new, skill_failed,
			equipset_new, equipset_failed,
			achievement_new, achievement_failed,
			image_downloaded, image_failed,
			name_cns_updated, desc_cns_updated,
			total_new, total_failed,
			message, created_at
		FROM api_update_logs
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?`,
		limit, offset,
	)
	if err != nil {
		return nil, 0, fmt.Errorf("查询更新记录失败: %v", err)
	}
	defer rows.Close()

	var logs []ApiUpdateLog
	for rows.Next() {
		var logEntry ApiUpdateLog
		err := rows.Scan(
			&logEntry.ID,
			&logEntry.LocalVersion,
			&logEntry.RemoteVersion,
			&logEntry.ItemNew, &logEntry.ItemFailed,
			&logEntry.MonsterNew, &logEntry.MonsterFailed,
			&logEntry.SkillNew, &logEntry.SkillFailed,
			&logEntry.EquipsetNew, &logEntry.EquipsetFailed,
			&logEntry.AchievementNew, &logEntry.AchievementFailed,
			&logEntry.ImageDownloaded, &logEntry.ImageFailed,
			&logEntry.NameCnsUpdated, &logEntry.DescCnsUpdated,
			&logEntry.TotalNew, &logEntry.TotalFailed,
			&logEntry.Message,
			&logEntry.CreatedAt,
		)
		if err != nil {
			log.Printf("[DataUpdater] 扫描更新记录失败: %v", err)
			continue
		}
		logs = append(logs, logEntry)
	}

	return logs, totalCount, nil
}

/**
 * @function handleGetUpdateLogs
 * @description HTTP处理器：获取API更新记录列表
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func handleGetUpdateLogs(w http.ResponseWriter, r *http.Request) {
	/* 解析分页参数 */
	limit := 20
	offset := 0

	if l := r.URL.Query().Get("limit"); l != "" {
		if v, err := fmt.Sscanf(l, "%d", &limit); err != nil || v != 1 {
			limit = 20
		}
	}
	if o := r.URL.Query().Get("offset"); o != "" {
		if v, err := fmt.Sscanf(o, "%d", &offset); err != nil || v != 1 {
			offset = 0
		}
	}

	logs, totalCount, err := queryApiUpdateLogs(limit, offset)
	if err != nil {
		SendError(w, http.StatusInternalServerError, err.Error())
		return
	}

	if logs == nil {
		logs = []ApiUpdateLog{}
	}

	SendSuccess(w, "获取更新记录成功", map[string]interface{}{
		"logs":       logs,
		"totalCount": totalCount,
		"limit":      limit,
		"offset":     offset,
	})
}

func registerDataUpdaterRoutes(mux *http.ServeMux) {
	mux.HandleFunc("/api/data/version-compare", withCORS(withMethod("GET", handleVersionCompare)))
	mux.HandleFunc("/api/data/batch-update", withCORS(withMethod("POST", handleBatchUpdate)))
	mux.HandleFunc("/api/data/batch-update-start", withCORS(withMethod("POST", handleBatchUpdateStart)))
	mux.HandleFunc("/api/data/resume-update", withCORS(withMethod("POST", handleResumeUpdate)))
	mux.HandleFunc("/api/data/progress", withCORS(withMethod("GET", handleGetProgress)))
	mux.HandleFunc("/api/data/abort-update", withCORS(withMethod("POST", handleAbortUpdate)))
	mux.HandleFunc("/api/data/retry-ids", withCORS(withMethod("POST", handleRetryFailedIds)))
	mux.HandleFunc("/api/data/local-version", withCORS(withMethod("GET", handleGetLocalVersion)))
	mux.HandleFunc("/api/data/local-id-count", withCORS(withMethod("GET", handleGetLocalIdCount)))
	mux.HandleFunc("/api/data/update-logs", withCORS(withMethod("GET", handleGetUpdateLogs)))

	log.Println("✅ FlyFF 数据更新路由已注册")
}
