/**
 * @file user_service.go
 * @description 用户认证服务
 * @description 处理用户注册、登录、密码验证等认证逻辑，使用bcrypt加密密码
 */
package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
)

/**
 * @typedef UserService
 * @description 用户认证服务，处理注册和登录
 * @property {*sql.DB} db - 数据库连接实例
 */
type UserService struct {
	db *sql.DB
}

/**
 * @function NewUserService
 * @description 创建用户服务实例
 * @param {*sql.DB} db - 数据库连接实例
 * @returns {*UserService} 用户服务实例
 */
func NewUserService(db *sql.DB) *UserService {
	return &UserService{db: db}
}

/**
 * @function EnsureDefaultGMAccount
 * @description 确保默认GM账号（recall）存在，不存在则自动创建
 * @description 账号名: recall，is_gm = 1（密码硬编码在函数内部，不输出到日志）
 * @description 在服务启动时由 main.go 调用
 */
func (s *UserService) EnsureDefaultGMAccount() {
	const gmUsername = "recall"
	const gmPassword = "CHANGE_ME_GM_PASSWORD"

	// 检查 recall 账号是否已存在
	var existingID int
	err := s.db.QueryRow("SELECT id FROM users WHERE username = ?", gmUsername).Scan(&existingID)
	if err == nil {
		// 账号已存在，确保 is_gm = 1
		s.db.Exec("UPDATE users SET is_gm = 1 WHERE username = ?", gmUsername)
		log.Printf("✅ GM账号 %s 已存在（用户ID: %d），已确保GM权限", gmUsername, existingID)
		return
	}
	if err != sql.ErrNoRows {
		log.Printf("⚠️ 检查GM账号失败: %v", err)
		return
	}

	// 使用bcrypt加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(gmPassword), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("❌ GM账号密码加密失败: %v", err)
		return
	}

	// 创建GM账号
	result, err := s.db.Exec(
		"INSERT INTO users (username, password, is_gm) VALUES (?, ?, 1)",
		gmUsername, string(hashedPassword),
	)
	if err != nil {
		log.Printf("❌ 创建GM账号失败: %v", err)
		return
	}

	userID, _ := result.LastInsertId()
	log.Printf("✅ GM账号 %s 创建成功（用户ID: %d）", gmUsername, userID)
}

/**
 * @function Register
 * @description 用户注册接口 - 创建新用户账号
 * @description 验证用户名和密码格式，检查用户名唯一性，使用bcrypt加密密码
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *UserService) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	// 验证用户名格式
	req.Username = strings.TrimSpace(req.Username)
	if len(req.Username) < 3 || len(req.Username) > 12 {
		SendError(w, http.StatusBadRequest, "用户名长度应为3-12个字符")
		return
	}

	// 验证密码格式
	if len(req.Password) < 6 || len(req.Password) > 20 {
		SendError(w, http.StatusBadRequest, "密码长度应为6-20个字符")
		return
	}

	// 检查用户名是否已存在
	var existingID int
	err := s.db.QueryRow("SELECT id FROM users WHERE username = ?", req.Username).Scan(&existingID)
	if err == nil {
		SendError(w, http.StatusConflict, "用户名已存在，请选择其他用户名")
		return
	}
	if err != sql.ErrNoRows {
		SendError(w, http.StatusInternalServerError, "服务器内部错误")
		return
	}

	// 使用bcrypt加密密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "密码加密失败")
		return
	}

	// 插入新用户
	result, err := s.db.Exec(
		"INSERT INTO users (username, password, email) VALUES (?, ?, ?)",
		req.Username, string(hashedPassword), req.Email,
	)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "创建用户失败")
		return
	}

	userID, _ := result.LastInsertId()

	log.Printf("📝 账号 %s 注册成功（用户ID: %d）", req.Username, userID)

	SendSuccess(w, "注册成功", map[string]interface{}{
		"userId":   userID,
		"username": req.Username,
	})
}

/**
 * @function Login
 * @description 用户登录接口 - 验证用户身份并返回JWT令牌
 * @description 验证用户名和密码，生成JWT令牌返回给前端
 * @param {http.ResponseWriter} w - HTTP响应写入器
 * @param {*http.Request} r - HTTP请求
 */
func (s *UserService) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		SendError(w, http.StatusBadRequest, "请求数据格式错误")
		return
	}

	req.Username = strings.TrimSpace(req.Username)
	if req.Username == "" || req.Password == "" {
		SendError(w, http.StatusBadRequest, "请输入用户名和密码")
		return
	}

	// 查询用户
	var userID int64
	var hashedPassword string
	var email string
	var createdAt string
	var isGM int
	err := s.db.QueryRow(
		"SELECT id, password, email, created_at, is_gm FROM users WHERE username = ?",
		req.Username,
	).Scan(&userID, &hashedPassword, &email, &createdAt, &isGM)

	if err == sql.ErrNoRows {
		log.Printf("⚠️ 账号 %s 登录失败：该账号未注册", req.Username)
		SendError(w, http.StatusUnauthorized, "该账号未注册")
		return
	}
	if err != nil {
		SendError(w, http.StatusInternalServerError, "服务器内部错误")
		return
	}

	// 验证密码（兼容旧版明文密码和bcrypt加密密码）
	isValid := false
	if err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(req.Password)); err == nil {
		isValid = true
	} else if hashedPassword == req.Password {
		// 兼容旧版明文密码：验证通过后自动升级为bcrypt加密
		isValid = true
		newHashedPassword, hashErr := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
		if hashErr == nil {
			s.db.Exec("UPDATE users SET password = ? WHERE id = ?", string(newHashedPassword), userID)
		}
	}

	if !isValid {
		log.Printf("⚠️ 账号 %s 登录失败：密码错误", req.Username)
		SendError(w, http.StatusUnauthorized, "密码错误，请重新输入")
		return
	}

	// 更新最后登录时间
	s.db.Exec("UPDATE users SET last_login_at = ? WHERE id = ?", time.Now().Format(time.RFC3339), userID)

	// 生成JWT令牌
	token, err := GenerateToken(userID, req.Username)
	if err != nil {
		SendError(w, http.StatusInternalServerError, "生成令牌失败")
		return
	}

	log.Printf("🎮 账号 %s 登录飞飞游戏成功（用户ID: %d, GM: %v）", req.Username, userID, isGM == 1)

	SendSuccess(w, "登录成功", LoginResponse{
		Token:    token,
		Username: req.Username,
		UserID:   userID,
		IsGM:     isGM == 1,
	})
}
