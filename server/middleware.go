/**
 * @file middleware.go
 * @description JWT鉴权中间件和令牌管理
 * @description 提供JWT令牌生成、验证功能，以及从请求中提取用户信息的辅助函数
 */
package main

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// JWT密钥，生产环境应从环境变量读取
var jwtSecret = []byte("CHANGE_ME_JWT_SECRET")

/**
 * @function GenerateToken
 * @description 生成JWT令牌
 * @param {int64} userID - 用户ID
 * @param {string} username - 用户名
 * @returns {string} JWT令牌字符串
 * @returns {error} 生成错误
 */
func GenerateToken(userID int64, username string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"username": username,
		"exp":      time.Now().Add(72 * time.Hour).Unix(), // 72小时过期
		"iat":      time.Now().Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}

/**
 * @function ValidateToken
 * @description 验证JWT令牌并提取用户信息
 * @param {string} tokenString - JWT令牌字符串
 * @returns {int64} 用户ID
 * @returns {string} 用户名
 * @returns {error} 验证错误
 */
func ValidateToken(tokenString string) (int64, string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		return 0, "", fmt.Errorf("令牌无效或已过期")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return 0, "", fmt.Errorf("无法解析令牌信息")
	}

	userIDFloat, ok := claims["user_id"].(float64)
	if !ok {
		return 0, "", fmt.Errorf("令牌中缺少用户ID")
	}
	userID := int64(userIDFloat)
	username, ok := claims["username"].(string)
	if !ok {
		return 0, "", fmt.Errorf("令牌中缺少用户名")
	}

	return userID, username, nil
}

/**
 * @function GetUserIDFromRequest
 * @description 从HTTP请求中获取用户ID（由JWT中间件注入到Header）
 * @param {*http.Request} r - HTTP请求
 * @returns {int64} 用户ID
 * @returns {bool} 是否获取成功
 */
func GetUserIDFromRequest(r *http.Request) (int64, bool) {
	userIDStr := r.Header.Get("X-User-ID")
	if userIDStr == "" {
		return 0, false
	}

	userID, err := strconv.ParseInt(userIDStr, 10, 64)
	if err != nil {
		return 0, false
	}

	return userID, true
}

/**
 * @function GetUsernameFromRequest
 * @description 从HTTP请求中获取用户名（由JWT中间件注入到Header）
 * @param {*http.Request} r - HTTP请求
 * @returns {string} 用户名
 * @returns {bool} 是否获取成功
 */
func GetUsernameFromRequest(r *http.Request) (string, bool) {
	username := r.Header.Get("X-Username")
	if username == "" {
		return "", false
	}
	return username, true
}

/**
 * @function withRecover
 * @description 全局 panic 恢复中间件，捕获 handler 中的 panic 并返回 500 错误
 * @description 防止 panic 导致 TCP 连接被强制关闭（ECONNRESET），使客户端能收到错误响应
 * @param {http.Handler} handler - 目标处理器
 * @returns {http.Handler} 包装后的处理器
 */
func withRecover(handler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("🚨 处理器 panic 恢复: 路径=%s 错误=%v", r.URL.Path, err)
				SendError(w, http.StatusInternalServerError, "服务器内部错误")
			}
		}()
		handler.ServeHTTP(w, r)
	})
}
