/**
 * @file flyff_proxy.go
 * @description FlyFF API 反向代理服务
 * @description 将 /api/proxy/* 请求代理到 https://api.flyff.com/*
 * @description 提供 /api/check-*-icon 端点检查本地图标文件是否存在
 * @description 集成到 Go 后端，无需单独启动 7000 端口代理服务
 */
package main

import (
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
)

/** FlyFF 官方 API 基础地址 */
const flyffAPIBase = "https://api.flyff.com"

/** 项目 public/pt 目录（图标文件存储位置） */
var publicPtDir string

/**
 * @function initPublicPtDir
 * @description 初始化游戏资源目录（pt/）路径
 * @description 优先从环境变量 FLYFF_PUBLIC_PT 读取
 * @description 未设置环境变量时，按可执行文件位置推断：dist/pt 或 public/pt
 * @returns {void}
 */
func initPublicPtDir() {
	publicPtDir = os.Getenv("FLYFF_PUBLIC_PT")
	if publicPtDir == "" {
		// 默认相对于可执行文件位置推断
		// exe 在 server/ 下 → ../public/pt
		// exe 在 dist/ 下 → ./pt（Vite 构建时将 public/pt 复制到 dist/pt）
		execPath, _ := os.Executable()
		execDir := filepath.Dir(execPath)
		// 优先检查 dist/pt（可执行文件同级的 pt 目录）
		distPt := filepath.Join(execDir, "pt")
		if _, err := os.Stat(distPt); err == nil {
			publicPtDir = distPt
		} else {
			// 回退到项目根目录的 public/pt
			projectRoot := filepath.Dir(execDir)
			publicPtDir = filepath.Join(projectRoot, "public", "pt")
		}
	}
	log.Printf("📂 游戏资源目录: %s", publicPtDir)
}

/**
 * @function flyffProxyHandler
 * @description FlyFF API 反向代理处理器
 * @description 将 /api/proxy/xxx 请求转发到 https://api.flyff.com/xxx
 * @description 支持所有 HTTP 方法，透传请求头和响应体
 * @param {http.ResponseWriter} w - HTTP 响应写入器
 * @param {*http.Request} r - HTTP 请求
 */
func flyffProxyHandler(w http.ResponseWriter, r *http.Request) {
	// 提取代理路径：/api/proxy/monster/123 → /monster/123
	proxyPath := strings.TrimPrefix(r.URL.Path, "/api/proxy")
	if proxyPath == "" {
		http.Error(w, "缺少代理路径", http.StatusBadRequest)
		return
	}

	// 构建目标 URL
	targetURL := flyffAPIBase + proxyPath
	if r.URL.RawQuery != "" {
		targetURL += "?" + r.URL.RawQuery
	}

	log.Printf("[FlyFF Proxy] %s → %s", r.URL.Path, targetURL)

	// 创建新请求
	proxyReq, err := http.NewRequest(r.Method, targetURL, r.Body)
	if err != nil {
		http.Error(w, "创建代理请求失败", http.StatusInternalServerError)
		return
	}

	// 透传请求头（排除 hop-by-hop 头）
	for key, values := range r.Header {
		lowerKey := strings.ToLower(key)
		// 跳过不应转发的头
		if lowerKey == "host" || lowerKey == "connection" || lowerKey == "transfer-encoding" {
			continue
		}
		for _, value := range values {
			proxyReq.Header.Add(key, value)
		}
	}

	// 设置来源标识
	proxyReq.Header.Set("User-Agent", "FlyFF-Vue3-App/1.0")

	// 发送请求
	client := &http.Client{}
	resp, err := client.Do(proxyReq)
	if err != nil {
		log.Printf("[FlyFF Proxy] ❌ 请求失败: %v", err)
		http.Error(w, "代理请求失败: "+err.Error(), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	// 透传响应头
	for key, values := range resp.Header {
		for _, value := range values {
			w.Header().Add(key, value)
		}
	}

	// 写入状态码
	w.WriteHeader(resp.StatusCode)

	// 透传响应体
	io.Copy(w, resp.Body)
}

/**
 * @function checkItemIconHandler
 * @description 检查物品图标文件是否存在
 * @description 查询参数 id: 物品 ID
 * @param {http.ResponseWriter} w - HTTP 响应写入器
 * @param {*http.Request} r - HTTP 请求
 */
func checkItemIconHandler(w http.ResponseWriter, r *http.Request) {
	id := r.URL.Query().Get("id")
	if id == "" {
		SendJSON(w, http.StatusBadRequest, APIResponse{Success: false, Message: "缺少 id 参数"})
		return
	}

	filePath := filepath.Join(publicPtDir, "item_icon", id+".png")
	exists := fileExists(filePath)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"exists":` + boolToStr(exists) + `}`))
}

/**
 * @function checkNpcIconHandler
 * @description 检查 NPC 图标文件是否存在
 * @description 查询参数 name: 图标文件名
 * @param {http.ResponseWriter} w - HTTP 响应写入器
 * @param {*http.Request} r - HTTP 请求
 */
func checkNpcIconHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		SendJSON(w, http.StatusBadRequest, APIResponse{Success: false, Message: "缺少 name 参数"})
		return
	}

	filePath := filepath.Join(publicPtDir, "npc_icon", name)
	exists := fileExists(filePath)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"exists":` + boolToStr(exists) + `}`))
}

/**
 * @function checkSkillIconHandler
 * @description 检查技能图标文件是否存在
 * @description 查询参数 name: 图标文件名
 * @param {http.ResponseWriter} w - HTTP 响应写入器
 * @param {*http.Request} r - HTTP 请求
 */
func checkSkillIconHandler(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		SendJSON(w, http.StatusBadRequest, APIResponse{Success: false, Message: "缺少 name 参数"})
		return
	}

	filePath := filepath.Join(publicPtDir, "skill_icon", name)
	exists := fileExists(filePath)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"exists":` + boolToStr(exists) + `}`))
}

// ==================== 工具函数 ====================

/**
 * @function healthCheckHandler
 * @description 健康检查处理器，供前端检测 Go 后端是否在线
 * @description 返回 200 + {"status":"ok"}，不依赖任何外部服务
 * @param {http.ResponseWriter} w - HTTP 响应写入器
 * @param {*http.Request} r - HTTP 请求
 */
func healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

/**
 * @function fileExists
 * @description 检查文件是否存在
 * @param {string} path - 文件路径
 * @returns {bool} 文件是否存在
 */
func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

/**
 * @function boolToStr
 * @description 将布尔值转换为 JSON 字符串
 * @param {bool} b - 布尔值
 * @returns {string} "true" 或 "false"
 */
func boolToStr(b bool) string {
	if b {
		return "true"
	}
	return "false"
}

/**
 * @function registerFlyffProxyRoutes
 * @description 注册所有 FlyFF API 代理路由到指定的多路复用器
 * @description 使用 Go 1.22+ 的路径参数语法匹配 /api/proxy/ 下所有子路径
 * @param {*http.ServeMux} mux - HTTP 路由多路复用器
 */
func registerFlyffProxyRoutes(mux *http.ServeMux) {
	// 初始化图标目录
	initPublicPtDir()

	// 健康检查端点：供前端检测 Go 后端是否在线
	mux.HandleFunc("/api/health", withCORS(healthCheckHandler))

	// FlyFF API 反向代理：匹配 /api/proxy/ 下所有路径
	// Go 1.22+ 使用 {path...} 通配符匹配剩余路径
	mux.HandleFunc("/api/proxy/", withCORS(flyffProxyHandler))

	// 本地图标文件检查端点
	mux.HandleFunc("/api/check-item-icon", withCORS(checkItemIconHandler))
	mux.HandleFunc("/api/check-npc-icon", withCORS(checkNpcIconHandler))
	mux.HandleFunc("/api/check-skill-icon", withCORS(checkSkillIconHandler))

	log.Println("✅ FlyFF API 代理路由已注册")
}

/**
 * @function buildTargetURL
 * @description 构建代理目标 URL（带查询参数）
 * @param {string} basePath - 基础路径（已去除 /api/proxy 前缀）
 * @param {url.Values} query - 原始查询参数
 * @returns {string} 完整的目标 URL
 */
func buildTargetURL(basePath string, query url.Values) string {
	target := flyffAPIBase + basePath
	if len(query) > 0 {
		target += "?" + query.Encode()
	}
	return target
}
