/**
 * @file player_service.go
 * @description 玩家数据管理服务
 * @description 处理玩家数据的CRUD操作，包括角色创建/删除、存档保存/加载、副本进度等
 */
package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

/**
 * @typedef PlayerService
 * @description 玩家数据管理服务
 * @property {*sql.DB} db - 数据库连接实例
 */
type PlayerService struct {
	db *sql.DB
}

/**
 * @function NewPlayerService
 * @description 创建玩家数据服务实例
 * @param {*sql.DB} db - 数据库连接实例
 * @returns {*PlayerService} 玩家数据服务实例
 */
func NewPlayerService(db *sql.DB) *PlayerService {
	return &PlayerService{db: db}
}

// ==================== 玩家数据读写 ====================

/**
 * @function GetPlayerData
 * @description 获取当前存档槽的玩家数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) GetPlayerData(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	slotIndex := r.URL.Query().Get("slotIndex")
	if slotIndex == "" {
		SendError(w, http.StatusBadRequest, "缺少存档槽参数")
		return
	}

	var data string
	err := s.db.QueryRow(
		"SELECT data FROM player_saves WHERE user_id = ? AND slot_index = ?",
		userID, slotIndex,
	).Scan(&data)

	if err == sql.ErrNoRows {
		SendError(w, http.StatusNotFound, "存档数据不存在")
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询存档数据失败")
		return
	}

	var playerData interface{}
	json.Unmarshal([]byte(data), &playerData)

	SendSuccess(w, "获取玩家数据成功", map[string]interface{}{
		"slotIndex": slotIndex,
		"data":      playerData,
	})
}

/**
 * @function SavePlayerData
 * @description 保存玩家数据到指定存档槽
 * @description 支持完整保存和合并保存，包含存档覆盖保护机制
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) SavePlayerData(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req SavePlayerDataRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	if req.SlotIndex < 0 || req.SlotIndex > 7 {
		SendError(w, http.StatusBadRequest, "存档槽编号无效（0-7）")
		return
	}

	// 不再记录保存开始和字段列表，减少日志噪音

	// 查询现有存档数据
	var existingData string
	err := s.db.QueryRow(
		"SELECT data FROM player_saves WHERE user_id = ? AND slot_index = ?",
		userID, req.SlotIndex,
	).Scan(&existingData)

	var mergedData map[string]interface{}

	if err == sql.ErrNoRows {
		// 新存档，直接使用传入数据
		mergedData = req.Data
	} else if err != nil {
		SendError(w, http.StatusInternalServerError, "查询存档数据失败")
		return
	} else {
		// 存档覆盖保护机制
		var existing map[string]interface{}
		json.Unmarshal([]byte(existingData), &existing)

		// 仅当请求中明确包含 level 字段时才执行保护检查
		// 补丁保存（如复活只更新 currentHealth/currentMana）不含 level，不应触发保护
		_, hasNewLevel := req.Data["level"]

		if hasNewLevel {
			oldLevel := toFloat64(existing["level"])
			newLevel := toFloat64(req.Data["level"])
			oldGold := toFloat64(existing["gold"])
			newGold := toFloat64(req.Data["gold"])

			// 更严格的保护条件：需要多个指标同时回到初始状态才判定为致命覆盖
			// 1. 等级从 >1 降到 1（可能是正常转职重置，需要其他指标佐证）
			// 2. 同时 stats.freePoints 回到 4（初始值），且 gold 回到 0 或初始值
			// 这样可以避免误拦截正常的补丁保存
			levelRollback := oldLevel > 1 && newLevel == 1

			if levelRollback {
				// 检查 stats.freePoints 是否也回到了初始值 4
				newStats, _ := req.Data["stats"].(map[string]interface{})
				newFreePoints := toFloat64(newStats["freePoints"])
				statsReset := newFreePoints == 4

				// 检查金币是否也回到了 0 或极低值
				goldReset := oldGold > 1000 && newGold <= 100

			if statsReset && goldReset {
				oldStats, _ := existing["stats"].(map[string]interface{})
				oldFreePoints := toFloat64(oldStats["freePoints"])
				log.Printf("🚨 用户ID%d 存档槽%d 检测到致命覆盖: level %.0f→%.0f, gold %.0f→%.0f, freePoints %.0f→%.0f",
					userID, req.SlotIndex, oldLevel, newLevel, oldGold, newGold,
					oldFreePoints, newFreePoints)
					SendError(w, http.StatusForbidden, "阻止了致命的存档覆盖：试图用初始数据覆盖现有存档")
					return
				}

				// 等级回退但其他指标正常，记录警告但不拦截
				log.Printf("⚠️ 用户ID%d 存档槽%d 等级回退: %.0f→%.0f（gold=%.0f, freePoints=%.0f，未拦截）",
					userID, req.SlotIndex, oldLevel, newLevel, newGold, newFreePoints)
			}
		}

		// 合并数据
		mergedData = existing
		for k, v := range req.Data {
			mergedData[k] = v
		}

		// 深度合并嵌套对象
		deepMerge(mergedData, existing, req.Data, "equipment")
		deepMerge(mergedData, existing, req.Data, "stats")
		deepMerge(mergedData, existing, req.Data, "quest")
	}

	// 序列化数据
	dataJSON, err := json.Marshal(mergedData)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "数据序列化失败")
		return
	}

	// 提取摘要字段
	nickname := toString(mergedData["nickname"])
	class := toString(mergedData["class"])
	level := int(toFloat64(mergedData["level"]))

	now := time.Now().Format(time.RFC3339)

	// 使用UPSERT保存数据
	_, err = s.db.Exec(`
		INSERT INTO player_saves (user_id, slot_index, nickname, class, level, data, created_at, last_login_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(user_id, slot_index) DO UPDATE SET
			nickname = excluded.nickname,
			class = excluded.class,
			level = excluded.level,
			data = excluded.data,
			last_login_at = excluded.last_login_at
	`, userID, req.SlotIndex, nickname, class, level, string(dataJSON), now, now)

	if err != nil {
		SendError(w, http.StatusInternalServerError, "保存玩家数据失败")
		return
	}

	SendSuccess(w, "保存玩家数据成功", nil)
	username, _ := GetUsernameFromRequest(r)
	log.Printf("💾 账号%s 角色%s 数据保存成功", username, nickname)
}

/**
 * @function deepMerge
 * @description 深度合并嵌套对象字段
 * @param {map} target - 目标合并结果
 * @param {map} existing - 现有数据
 * @param {map} incoming - 新传入数据
 * @param {string} key - 需要深度合并的键名
 */
func deepMerge(target, existing, incoming map[string]interface{}, key string) {
	existingVal, existOK := existing[key]
	incomingVal, incomingOK := incoming[key]

	if existOK && incomingOK {
		existingMap, existIsMap := existingVal.(map[string]interface{})
		incomingMap, incomingIsMap := incomingVal.(map[string]interface{})

		if existIsMap && incomingIsMap {
			merged := make(map[string]interface{})
			for k, v := range existingMap {
				merged[k] = v
			}
			for k, v := range incomingMap {
				merged[k] = v
			}
			target[key] = merged
		}
	}
}

// ==================== 存档槽管理 ====================

/**
 * @function GetAllSaveSlots
 * @description 获取用户所有存档槽摘要信息
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) GetAllSaveSlots(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	rows, err := s.db.Query(
		"SELECT slot_index, nickname, class, level, created_at, data FROM player_saves WHERE user_id = ? ORDER BY slot_index",
		userID,
	)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询存档槽失败")
		return
	}
	defer rows.Close()

	slots := []SaveSlotInfo{}
	for rows.Next() {
		var slot SaveSlotInfo
		var dataJSON string
		if err := rows.Scan(&slot.SlotIndex, &slot.Nickname, &slot.Class, &slot.Level, &slot.CreatedAt, &dataJSON); err != nil {
			continue
		}
		// 从 data JSON 中提取 sex 字段
		var dataMap map[string]interface{}
		if json.Unmarshal([]byte(dataJSON), &dataMap) == nil {
			if sex, ok := dataMap["sex"].(string); ok {
				slot.Sex = sex
			}
		}
		slots = append(slots, slot)
	}

	SendSuccess(w, "获取存档槽信息成功", slots)
}

/**
 * @function SelectSaveSlot
 * @description 选择存档槽（验证存档是否存在）
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) SelectSaveSlot(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req SlotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	var exists int
	err := s.db.QueryRow(
		"SELECT 1 FROM player_saves WHERE user_id = ? AND slot_index = ?",
		userID, req.SlotIndex,
	).Scan(&exists)

	if err == sql.ErrNoRows {
		SendError(w, http.StatusNotFound, fmt.Sprintf("存档槽 %d 不存在", req.SlotIndex))
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询存档槽失败")
		return
	}

	SendSuccess(w, "存档槽选择成功", map[string]interface{}{
		"slotIndex": req.SlotIndex,
	})
}

// ==================== 角色管理 ====================

/**
 * @function CreateCharacter
 * @description 创建新角色，在指定存档槽初始化角色默认属性
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) CreateCharacter(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req CreateCharacterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	if req.SlotIndex < 0 || req.SlotIndex > 7 {
		SendError(w, http.StatusBadRequest, "存档槽编号无效（0-7）")
		return
	}

	// 检查存档槽是否已被占用
	var exists int
	err := s.db.QueryRow(
		"SELECT 1 FROM player_saves WHERE user_id = ? AND slot_index = ?",
		userID, req.SlotIndex,
	).Scan(&exists)

	if err == nil {
		SendError(w, http.StatusConflict, fmt.Sprintf("存档槽 %d 已被占用", req.SlotIndex))
		return
	}
	if err != sql.ErrNoRows {
		SendError(w, http.StatusInternalServerError, "查询存档槽失败")
		return
	}

	// 初始化角色默认数据
	nickname := req.Nickname
	if nickname == "" {
		nickname = fmt.Sprintf("新角色%d", req.SlotIndex+1)
	}
	sex := req.Sex
	if sex == "" {
		sex = "male"
	}

	now := time.Now().Format(time.RFC3339)
	defaultData := map[string]interface{}{
		"nickname": nickname,
		"class":    req.Class,
		"sex":      sex,
		"level":    1,
		"exp":      0,
		"maxExp":   100,
		"gold":     10000,
		"diamonds": 0,
		"bankGold": 0,
		"maxHealth":         100,
		"currentHealth":     100,
		"maxMana":           100,
		"currentMana":       100,
		"minAttack":         5,
		"maxAttack":         10,
		"minDefense":        1,
		"maxDefense":        10,
		"criticalRate":      0,
		"criticalDamage":    0,
		"attackSpeed":       0,
		"hitRate":           0,
		"lifeSteal":         0,
		"blockRate":         0,
		"dodgeRate":         0,
		"stun":              0,
		"decreasedCastingTime": 0,
		"pveAttackBonus":    0,
		"pveDefenseBonus":   0,
		"availableBagSlots": 20,
		"totalBagSlots":     400,
		"bag":               []interface{}{},
		"equipmentBag":      []interface{}{},
		"bankBag":           []interface{}{},
		"skills":            map[string]interface{}{},
		"equipment": map[string]interface{}{
			"weapon": nil, "shield": nil, "helmet": nil, "armor": nil,
			"gloves": nil, "boots": nil, "necklace": nil,
			"ring1": nil, "ring2": nil, "earring1": nil, "earring2": nil,
		},
		"stats": map[string]interface{}{
			"strength": 1, "agility": 1, "intelligence": 1, "constitution": 1, "freePoints": 4,
		},
		"tempStats":     map[string]interface{}{},
		"originalStats": map[string]interface{}{},
		"activeBuffs":   []interface{}{},
		"quest": map[string]interface{}{
			"activeQuests":    []interface{}{},
			"completedQuests": []interface{}{},
		},
		"createTime":    now,
		"lastLoginTime": now,
		"createdAt":     now,
	}

	dataJSON, _ := json.Marshal(defaultData)

	_, err = s.db.Exec(
		"INSERT INTO player_saves (user_id, slot_index, nickname, class, level, data, created_at, last_login_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
		userID, req.SlotIndex, nickname, req.Class, 1, string(dataJSON), now, now,
	)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "创建角色失败")
		return
	}

	SendSuccess(w, "创建角色成功", map[string]interface{}{
		"slotIndex": req.SlotIndex,
		"nickname":  nickname,
	})
	log.Printf("🎭 用户ID %d 创建角色成功：昵称 %s，职业 %s，存档槽 %d", userID, nickname, req.Class, req.SlotIndex)
}

/**
 * @function DeleteCharacter
 * @description 删除指定存档槽的角色，同时删除关联数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) DeleteCharacter(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req DeleteCharacterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	// 删除存档数据
	result, err := s.db.Exec(
		"DELETE FROM player_saves WHERE user_id = ? AND slot_index = ?",
		userID, req.SlotIndex,
	)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "删除角色失败")
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		SendError(w, http.StatusNotFound, fmt.Sprintf("存档槽 %d 不存在", req.SlotIndex))
		return
	}

	// 同时删除关联数据
	s.db.Exec("DELETE FROM dungeon_progress WHERE user_id = ? AND slot_index = ?", userID, req.SlotIndex)
	s.db.Exec("DELETE FROM enhance_attributes WHERE user_id = ? AND slot_index = ?", userID, req.SlotIndex)
	s.db.Exec("DELETE FROM user_settings WHERE user_id = ? AND slot_index = ?", userID, req.SlotIndex)

	SendSuccess(w, "删除角色成功", nil)
	log.Printf("🗑️ 用户ID %d 删除角色成功：存档槽 %d", userID, req.SlotIndex)
}

// ==================== 副本进度 ====================

/**
 * @function SaveDungeonProgress
 * @description 保存副本进度数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) SaveDungeonProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req DungeonProgressRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	dataJSON, _ := json.Marshal(req.Data)
	now := time.Now().Format(time.RFC3339)

	_, err := s.db.Exec(`
		INSERT INTO dungeon_progress (user_id, slot_index, data, updated_at) VALUES (?, ?, ?, ?)
		ON CONFLICT(user_id, slot_index) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
	`, userID, req.SlotIndex, string(dataJSON), now)

	if err != nil {
		SendError(w, http.StatusInternalServerError, "保存副本进度失败")
		return
	}

	SendSuccess(w, "保存副本进度成功", nil)
}

/**
 * @function LoadDungeonProgress
 * @description 加载副本进度数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) LoadDungeonProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	slotIndex := r.URL.Query().Get("slotIndex")
	if slotIndex == "" {
		SendError(w, http.StatusBadRequest, "缺少存档槽参数")
		return
	}

	var data string
	err := s.db.QueryRow(
		"SELECT data FROM dungeon_progress WHERE user_id = ? AND slot_index = ?",
		userID, slotIndex,
	).Scan(&data)

	if err == sql.ErrNoRows {
		SendSuccess(w, "无副本进度数据", nil)
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询副本进度失败")
		return
	}

	var dungeonData interface{}
	json.Unmarshal([]byte(data), &dungeonData)

	SendSuccess(w, "获取副本进度成功", dungeonData)
}

/**
 * @function ClearDungeonProgress
 * @description 清除副本进度数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) ClearDungeonProgress(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req SlotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	s.db.Exec("DELETE FROM dungeon_progress WHERE user_id = ? AND slot_index = ?", userID, req.SlotIndex)
	SendSuccess(w, "清除副本进度成功", nil)
}

// ==================== 属性强化 ====================

/**
 * @function SaveEnhanceAttributes
 * @description 保存属性强化数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) SaveEnhanceAttributes(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req EnhanceAttributesRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	dataJSON, _ := json.Marshal(req.Data)
	now := time.Now().Format(time.RFC3339)

	_, err := s.db.Exec(`
		INSERT INTO enhance_attributes (user_id, slot_index, data, updated_at) VALUES (?, ?, ?, ?)
		ON CONFLICT(user_id, slot_index) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
	`, userID, req.SlotIndex, string(dataJSON), now)

	if err != nil {
		SendError(w, http.StatusInternalServerError, "保存属性强化数据失败")
		return
	}

	SendSuccess(w, "保存属性强化数据成功", nil)
}

/**
 * @function GetEnhanceAttributes
 * @description 获取属性强化数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) GetEnhanceAttributes(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	slotIndex := r.URL.Query().Get("slotIndex")
	if slotIndex == "" {
		SendError(w, http.StatusBadRequest, "缺少存档槽参数")
		return
	}

	var data string
	err := s.db.QueryRow(
		"SELECT data FROM enhance_attributes WHERE user_id = ? AND slot_index = ?",
		userID, slotIndex,
	).Scan(&data)

	if err == sql.ErrNoRows {
		SendSuccess(w, "无属性强化数据", nil)
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询属性强化数据失败")
		return
	}

	var enhanceData interface{}
	json.Unmarshal([]byte(data), &enhanceData)

	SendSuccess(w, "获取属性强化数据成功", enhanceData)
}

/**
 * @function ClearEnhanceAttributes
 * @description 清除属性强化数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) ClearEnhanceAttributes(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req SlotRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	s.db.Exec("DELETE FROM enhance_attributes WHERE user_id = ? AND slot_index = ?", userID, req.SlotIndex)
	SendSuccess(w, "清除属性强化数据成功", nil)
}

// ==================== 用户设置 ====================

/**
 * @function SaveUserSettings
 * @description 保存用户设置数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) SaveUserSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req UserSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	dataJSON, _ := json.Marshal(req.Data)
	now := time.Now().Format(time.RFC3339)

	_, err := s.db.Exec(`
		INSERT INTO user_settings (user_id, slot_index, data, updated_at) VALUES (?, ?, ?, ?)
		ON CONFLICT(user_id, slot_index) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
	`, userID, req.SlotIndex, string(dataJSON), now)

	if err != nil {
		SendError(w, http.StatusInternalServerError, "保存用户设置失败")
		return
	}

	SendSuccess(w, "保存用户设置成功", nil)
}

/**
 * @function LoadUserSettings
 * @description 加载用户设置数据
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) LoadUserSettings(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	slotIndex := r.URL.Query().Get("slotIndex")
	if slotIndex == "" {
		SendError(w, http.StatusBadRequest, "缺少存档槽参数")
		return
	}

	var data string
	err := s.db.QueryRow(
		"SELECT data FROM user_settings WHERE user_id = ? AND slot_index = ?",
		userID, slotIndex,
	).Scan(&data)

	if err == sql.ErrNoRows {
		SendSuccess(w, "无用户设置数据", nil)
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询用户设置失败")
		return
	}

	var settingsData interface{}
	json.Unmarshal([]byte(data), &settingsData)

	SendSuccess(w, "获取用户设置成功", settingsData)
}

// ==================== 钻石 ====================

/**
 * @function SavePlayerDiamonds
 * @description 保存玩家钻石数量
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *PlayerService) SavePlayerDiamonds(w http.ResponseWriter, r *http.Request) {
	userID, ok := GetUserIDFromRequest(r)
	if !ok {
		SendError(w, http.StatusUnauthorized, "用户未认证")
		return
	}

	var req SaveDiamondsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	// 查询现有存档数据
	var existingData string
	err := s.db.QueryRow(
		"SELECT data FROM player_saves WHERE user_id = ? AND slot_index = ?",
		userID, req.SlotIndex,
	).Scan(&existingData)

	if err == sql.ErrNoRows {
		SendError(w, http.StatusNotFound, "存档数据不存在")
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "查询存档数据失败")
		return
	}

	// 更新diamonds字段
	var data map[string]interface{}
	json.Unmarshal([]byte(existingData), &data)
	data["diamonds"] = req.Diamonds

	dataJSON, _ := json.Marshal(data)

	_, err = s.db.Exec(
		"UPDATE player_saves SET data = ? WHERE user_id = ? AND slot_index = ?",
		string(dataJSON), userID, req.SlotIndex,
	)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "保存钻石数据失败")
		return
	}

	SendSuccess(w, "保存钻石数据成功", nil)
}

// ==================== 工具函数 ====================

/**
 * @function toFloat64
 * @description 将interface{}转换为float64
 * @param {interface{}} v - 待转换的值
 * @returns {float64} 转换后的float64值
 */
func toFloat64(v interface{}) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case float32:
		return float64(val)
	case int:
		return float64(val)
	case int64:
		return float64(val)
	case json.Number:
		f, _ := val.Float64()
		return f
	default:
		return 0
	}
}

/**
 * @function toString
 * @description 将interface{}转换为string
 * @param {interface{}} v - 待转换的值
 * @returns {string} 转换后的string值
 */
func toString(v interface{}) string {
	if v == nil {
		return ""
	}
	switch val := v.(type) {
	case string:
		return val
	default:
		return fmt.Sprintf("%v", val)
	}
}
