/**
 * @file models.go
 * @description 数据模型和通用响应结构定义
 * @description 定义API请求/响应结构体、通用错误码和工具函数
 */
package main

import (
	"encoding/json"
	"net/http"
)

// ==================== 通用响应结构 ====================

/**
 * @typedef APIResponse
 * @description 通用API响应结构
 * @property {boolean} success - 操作是否成功
 * @property {string} message - 响应消息
 * @property {any} data - 响应数据
 */
type APIResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

/**
 * @function SendJSON
 * @description 发送JSON格式响应
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {int} statusCode - HTTP状态码
 * @param {APIResponse} response - 响应数据
 */
func SendJSON(w http.ResponseWriter, statusCode int, response APIResponse) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(response)
}

/**
 * @function SendError
 * @description 发送错误响应
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {int} statusCode - HTTP状态码
 * @param {string} message - 错误消息
 */
func SendError(w http.ResponseWriter, statusCode int, message string) {
	SendJSON(w, statusCode, APIResponse{
		Success: false,
		Message: message,
	})
}

/**
 * @function SendSuccess
 * @description 发送成功响应
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {string} message - 成功消息
 * @param {any} data - 响应数据
 */
func SendSuccess(w http.ResponseWriter, message string, data interface{}) {
	SendJSON(w, http.StatusOK, APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// ==================== 认证相关结构 ====================

/**
 * @typedef RegisterRequest
 * @description 用户注册请求
 * @property {string} username - 用户名（3-12个字符）
 * @property {string} password - 密码（6-20个字符）
 * @property {string} email - 邮箱（可选）
 */
type RegisterRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
	Email    string `json:"email"`
}

/**
 * @typedef LoginRequest
 * @description 用户登录请求
 * @property {string} username - 用户名
 * @property {string} password - 密码
 */
type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

/**
 * @typedef LoginResponse
 * @description 登录成功响应数据
 * @property {string} token - JWT令牌
 * @property {string} username - 用户名
 * @property {number} userId - 用户ID
 * @property {boolean} isGM - 是否为GM权限账号
 */
type LoginResponse struct {
	Token    string `json:"token"`
	Username string `json:"username"`
	UserID   int64  `json:"userId"`
	IsGM     bool   `json:"isGM"`
}

// ==================== 玩家数据相关结构 ====================

/**
 * @typedef SavePlayerDataRequest
 * @description 保存玩家数据请求
 * @property {number} slotIndex - 存档槽编号
 * @property {object} data - 玩家数据（完整JSON）
 */
type SavePlayerDataRequest struct {
	SlotIndex int                    `json:"slotIndex"`
	Data      map[string]interface{} `json:"data"`
}

/**
 * @typedef SavePlayerPatchRequest
 * @description 补丁式更新玩家数据请求
 * @property {number} slotIndex - 存档槽编号
 * @property {object} patch - 需要更新的字段
 */
type SavePlayerPatchRequest struct {
	SlotIndex int                    `json:"slotIndex"`
	Patch     map[string]interface{} `json:"patch"`
}

/**
 * @typedef SlotRequest
 * @description 存档槽操作请求
 * @property {number} slotIndex - 存档槽编号
 */
type SlotRequest struct {
	SlotIndex int `json:"slotIndex"`
}

/**
 * @typedef CreateCharacterRequest
 * @description 创建角色请求
 * @property {number} slotIndex - 存档槽编号
 * @property {string} nickname - 角色昵称
 * @property {string} class - 职业类型
 * @property {string} sex - 性别
 */
type CreateCharacterRequest struct {
	SlotIndex int    `json:"slotIndex"`
	Nickname  string `json:"nickname"`
	Class     string `json:"class"`
	Sex       string `json:"sex"`
}

/**
 * @typedef DeleteCharacterRequest
 * @description 删除角色请求
 * @property {number} slotIndex - 存档槽编号
 */
type DeleteCharacterRequest struct {
	SlotIndex int `json:"slotIndex"`
}

/**
 * @typedef DungeonProgressRequest
 * @description 副本进度请求
 * @property {number} slotIndex - 存档槽编号
 * @property {object} data - 副本进度数据
 */
type DungeonProgressRequest struct {
	SlotIndex int                    `json:"slotIndex"`
	Data      map[string]interface{} `json:"data"`
}

/**
 * @typedef EnhanceAttributesRequest
 * @description 属性强化数据请求
 * @property {number} slotIndex - 存档槽编号
 * @property {object} data - 属性强化数据
 */
type EnhanceAttributesRequest struct {
	SlotIndex int                    `json:"slotIndex"`
	Data      map[string]interface{} `json:"data"`
}

/**
 * @typedef UserSettingsRequest
 * @description 用户设置请求
 * @property {number} slotIndex - 存档槽编号
 * @property {object} data - 用户设置数据
 */
type UserSettingsRequest struct {
	SlotIndex int                    `json:"slotIndex"`
	Data      map[string]interface{} `json:"data"`
}

/**
 * @typedef SaveDiamondsRequest
 * @description 保存钻石数量请求
 * @property {number} slotIndex - 存档槽编号
 * @property {number} diamonds - 钻石数量
 */
type SaveDiamondsRequest struct {
	SlotIndex int `json:"slotIndex"`
	Diamonds  int `json:"diamonds"`
}

/**
 * @typedef SaveSlotInfo
 * @description 存档槽摘要信息（用于角色选择界面）
 * @property {number} slotIndex - 存档槽编号
 * @property {string} nickname - 角色昵称
 * @property {string} class - 职业类型
 * @property {number} level - 角色等级
 * @property {string} createdAt - 创建时间
 */
type SaveSlotInfo struct {
	SlotIndex int    `json:"slotIndex"`
	Nickname  string `json:"nickname"`
	Class     string `json:"class"`
	Level     int    `json:"level"`
	Sex       string `json:"sex"`
	CreatedAt string `json:"createdAt"`
}
