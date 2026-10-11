/**
 * @file main.go
 * @description FlyFF游戏后端服务入口
 * @description 初始化数据库、路由和HTTP服务器，提供用户认证和玩家数据管理API
 * @description 同时启动HTTP（8080）和HTTPS/HTTP2（8443）双端口服务
 * @description HTTPS证书自动生成，首次启动无需手动操作，双击exe即可运行
 * @description HTTP端口同时提供前端静态文件服务（dist目录），实现一键启动
 */
package main

import (
	"bufio"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/pem"
	"fmt"
	"log"
	"math/big"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"golang.org/x/net/http2"
)

/**
 * @function ensureTLSCertificates
 * @description 确保TLS证书文件存在，如果不存在则自动生成自签名证书
 * @param {string} certFile - 证书文件路径
 * @param {string} keyFile - 密钥文件路径
 * @returns {void}
 */
func ensureTLSCertificates(certFile, keyFile string) {
	// 检查证书和密钥文件是否都已存在
	certExists := false
	keyExists := false
	if _, err := os.Stat(certFile); err == nil {
		certExists = true
	}
	if _, err := os.Stat(keyFile); err == nil {
		keyExists = true
	}

	// 两者都存在，直接使用
	if certExists && keyExists {
		log.Printf("🔑 检测到已有TLS证书，直接使用")
		return
	}

	// 只有一个存在，提示异常
	if certExists != keyExists {
		log.Printf("⚠️ 证书文件不完整（cert=%v key=%v），将重新生成", certExists, keyExists)
	}

	// 自动生成自签名证书
	log.Printf("🔐 正在自动生成自签名TLS证书...")

	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		log.Fatalf("❌ 生成私钥失败: %v", err)
	}

	serialNumber, err := rand.Int(rand.Reader, new(big.Int).Lsh(big.NewInt(1), 128))
	if err != nil {
		log.Fatalf("❌ 生成序列号失败: %v", err)
	}

	template := x509.Certificate{
		SerialNumber: serialNumber,
		Subject: pkix.Name{
			Organization: []string{"FlyFF Dev"},
			CommonName:   "localhost",
		},
		NotBefore: time.Now(),
		NotAfter:  time.Now().Add(3650 * 24 * time.Hour), // 10年有效期

		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		BasicConstraintsValid: true,

		DNSNames:    []string{"localhost"},
		IPAddresses: []net.IP{net.ParseIP("127.0.0.1"), net.ParseIP("::1")},
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &privateKey.PublicKey, privateKey)
	if err != nil {
		log.Fatalf("❌ 创建证书失败: %v", err)
	}

	// 写入证书文件
	certOut, err := os.Create(certFile)
	if err != nil {
		log.Fatalf("❌ 创建证书文件失败: %v", err)
	}
	if err := pem.Encode(certOut, &pem.Block{Type: "CERTIFICATE", Bytes: derBytes}); err != nil {
		log.Fatalf("❌ 写入证书失败: %v", err)
	}
	certOut.Close()

	// 写入私钥文件
	keyOut, err := os.Create(keyFile)
	if err != nil {
		log.Fatalf("❌ 创建密钥文件失败: %v", err)
	}
	privBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		log.Fatalf("❌ 序列化私钥失败: %v", err)
	}
	if err := pem.Encode(keyOut, &pem.Block{Type: "EC PRIVATE KEY", Bytes: privBytes}); err != nil {
		log.Fatalf("❌ 写入密钥失败: %v", err)
	}
	keyOut.Close()

	log.Printf("✅ 自签名TLS证书已自动生成（有效期10年，适用localhost/127.0.0.1）")
}

/**
 * @function main
 * @description 程序入口，初始化数据库、路由并启动双端口HTTP服务器
 * @description HTTP端口同时提供前端静态文件服务，访问 http://localhost:8080 即可打开游戏
 * 同时监听：
 *   - HTTP（端口8080）：前端静态文件 + API（兼容模式，供Vite代理使用）
 *   - HTTPS/HTTP2（端口8443）：自动生成证书，消除浏览器6连接并发限制
 * @returns {void}
 */
func main() {
	// 初始化静态文件目录（dist 目录），用于提供前端页面服务
	initStaticFileDir()

	// 获取端口号
	httpPort := os.Getenv("FLYFF_PORT")
	if httpPort == "" {
		httpPort = "8080"
	}
	httpsPort := os.Getenv("FLYFF_TLS_PORT")
	if httpsPort == "" {
		httpsPort = "8443"
	}

	// 端口占用检测：如果端口已被占用（通常因上次未正常退出），提示用户并等待按键后退出
	// 避免双击 exe 时窗口一闪而过（闪退），用户无法看到错误信息
	if !isPortAvailable("127.0.0.1", httpPort) || !isPortAvailable("127.0.0.1", httpsPort) {
		log.Println("──────────────────────────────────────")
		log.Printf("❌ 端口 %s 或 %s 已被占用，服务可能已在运行", httpPort, httpsPort)
		log.Println("   请先关闭已有的 flyff-server 进程后再启动")
		log.Println("──────────────────────────────────────")
		waitForKeyAndExit()
	}

	// 初始化数据库
	// 支持通过环境变量 FLYFF_DB_PATH 自定义数据库路径
	// 默认基于 exe 所在目录，确保不受工作目录影响（双击启动 vs 命令行启动）
	dbPath := os.Getenv("FLYFF_DB_PATH")
	if dbPath == "" {
		execPath, _ := os.Executable()
		execDir := filepath.Dir(execPath)
		dbPath = filepath.Join(execDir, "flyff.db")
	}
	log.Printf("📦 数据库路径: %s", dbPath)
	db, err := InitDB(dbPath)
	if err != nil {
		log.Fatalf("❌ 数据库初始化失败: %v", err)
	}
	defer db.Close()

	log.Println("✅ 数据库初始化成功")

	// 创建服务实例
	userService := NewUserService(db)
	playerService := NewPlayerService(db)

	// 确保默认GM账号（recall）存在
	userService.EnsureDefaultGMAccount()

	// 创建路由多路复用器
	mux := http.NewServeMux()

	// 全局 panic 恢复包装器，防止 handler panic 导致 TCP 连接重置（ECONNRESET）
	handler := withRecover(mux)

	// 公开路由（无需鉴权）
	mux.HandleFunc("/api/auth/register", withCORS(withMethod("POST", userService.Register)))
	mux.HandleFunc("/api/auth/login", withCORS(withMethod("POST", userService.Login)))

	// 受保护路由（需要JWT鉴权）
	mux.HandleFunc("/api/player/data", withCORS(withJWT(withMethod("GET", playerService.GetPlayerData))))
	mux.HandleFunc("/api/player/save", withCORS(withJWT(withMethod("POST", playerService.SavePlayerData))))
	mux.HandleFunc("/api/player/slots", withCORS(withJWT(withMethod("GET", playerService.GetAllSaveSlots))))
	mux.HandleFunc("/api/player/slot", withCORS(withJWT(withMethod("POST", playerService.SelectSaveSlot))))
	mux.HandleFunc("/api/player/character", withCORS(withJWT(
		withMethodRouter("POST", playerService.CreateCharacter, "DELETE", playerService.DeleteCharacter),
	)))
	mux.HandleFunc("/api/player/dungeon", withCORS(withJWT(
		withMethodRouter("POST", playerService.SaveDungeonProgress, "GET", playerService.LoadDungeonProgress, "DELETE", playerService.ClearDungeonProgress),
	)))
	mux.HandleFunc("/api/player/enhance", withCORS(withJWT(
		withMethodRouter("POST", playerService.SaveEnhanceAttributes, "GET", playerService.GetEnhanceAttributes, "DELETE", playerService.ClearEnhanceAttributes),
	)))
	mux.HandleFunc("/api/player/settings", withCORS(withJWT(
		withMethodRouter("POST", playerService.SaveUserSettings, "GET", playerService.LoadUserSettings),
	)))
	mux.HandleFunc("/api/player/diamonds", withCORS(withJWT(withMethod("POST", playerService.SavePlayerDiamonds))))

	// FlyFF API 代理路由（无需鉴权，用于数据更新器页面）
	registerFlyffProxyRoutes(mux)

	// FlyFF 数据增量更新路由（无需鉴权，版本比对+增量拉取+写文件）
	// 注入数据库实例给更新器使用（用于保存更新记录）
	globalDB = db
	registerDataUpdaterRoutes(mux)

	// 前端静态文件服务（注册在所有 API 路由之后，作为 catch-all 兜底）
	// ServeMux 的最长前缀匹配规则确保 /api/* 路由优先于 / 兜底处理器
	mux.HandleFunc("/", staticFileHandler())

	// ========== 启动 HTTPS/HTTP2 服务器（异步） ==========
	// 证书路径同样基于 exe 所在目录，确保分发后不受工作目录影响
	certFile := os.Getenv("FLYFF_TLS_CERT")
	keyFile := os.Getenv("FLYFF_TLS_KEY")
	if certFile == "" || keyFile == "" {
		execPath, _ := os.Executable()
		execDir := filepath.Dir(execPath)
		if certFile == "" {
			certFile = filepath.Join(execDir, "cert.pem")
		}
		if keyFile == "" {
			keyFile = filepath.Join(execDir, "key.pem")
		}
	}

	// 自动生成证书（如不存在）
	ensureTLSCertificates(certFile, keyFile)

	tlsServer := &http.Server{
		Addr:    fmt.Sprintf(":%s", httpsPort),
		Handler: handler,
		TLSConfig: &tls.Config{
			MinVersion: tls.VersionTLS12,
		},
		// 超时配置：防止慢连接和请求堆积导致服务端资源耗尽
		ReadTimeout:  30 * time.Second,  // 读取请求体的最长时间（含保存操作的大JSON请求）
		WriteTimeout: 60 * time.Second,  // 写入响应的最长时间（含数据库操作耗时）
		IdleTimeout:  120 * time.Second, // 空闲连接保持时间（心跳5秒一次，120秒足够）
		MaxHeaderBytes: 1 << 20,         // 1MB，限制请求头大小
	}

	// 启用HTTP/2
	if err := http2.ConfigureServer(tlsServer, nil); err != nil {
		log.Fatalf("❌ HTTP/2配置失败: %v", err)
	}

	// ========== 启动 HTTPS/HTTP2 服务器（异步） ==========
	// 先创建TCP监听器（实际绑定端口），绑定失败立即报错，避免打印误导性的"已启动"日志
	httpsListener, err := net.Listen("tcp", fmt.Sprintf(":%s", httpsPort))
	if err != nil {
		log.Printf("❌ HTTPS端口 %s 绑定失败: %v", httpsPort, err)
		waitForKeyAndExit()
		return
	}
	// 包装为TLS监听器，使用已配置好HTTP/2 ALPN的TLSConfig
	tlsListener := tls.NewListener(httpsListener, tlsServer.TLSConfig)

	// 绑定成功后才打印"已启动"日志
	log.Printf("⚡ HTTPS/HTTP2 服务已启动，监听端口: %s", httpsPort)
	log.Printf("📍 HTTPS地址: https://localhost:%s/api", httpsPort)

	// 异步启动HTTPS服务（Serve阻塞在goroutine中）
	go func() {
		if err := tlsServer.Serve(tlsListener); err != nil && err != http.ErrServerClosed {
			log.Printf("⚠️ HTTPS服务异常: %v", err)
		}
	}()

	// ========== 启动 HTTP 服务器（主线程阻塞） ==========
	httpAddr := fmt.Sprintf(":%s", httpPort)
	httpServer := &http.Server{
		Addr:    httpAddr,
		Handler: handler,
		// 超时配置：与HTTPS服务器一致，防止慢连接和请求堆积
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   60 * time.Second,
		IdleTimeout:    120 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// 先创建TCP监听器（实际绑定端口），绑定失败立即报错
	httpListener, err := net.Listen("tcp", httpAddr)
	if err != nil {
		log.Printf("❌ HTTP端口 %s 绑定失败: %v", httpPort, err)
		waitForKeyAndExit()
		return
	}

	// 绑定成功后才打印"已启动"日志
	log.Printf("📡 HTTP 服务已启动，监听端口: %s", httpPort)
	log.Printf("📍 HTTP地址: http://localhost:%s/api", httpPort)
	log.Println("──────────────────────────────────────")
	log.Printf("🚀 FlyFF后端服务已就绪（双端口模式）")
	if staticFileDir != "" {
		// 部署模式：HTTP 端口同时提供前端页面和 API
		log.Printf("   HTTP  → http://localhost:%s      （前端页面 + API）", httpPort)
	} else {
		// 开发模式：HTTP 端口仅提供 API，前端由 Vite dev server 提供
		log.Printf("   HTTP  → http://localhost:%s/api  （仅API，前端由 Vite dev server 提供）", httpPort)
	}
	log.Printf("   HTTPS → https://localhost:%s/api （HTTP/2，无并发限制）", httpsPort)
	log.Println("──────────────────────────────────────")

	// 主线程阻塞，使用已绑定的listener启动服务
	if err := httpServer.Serve(httpListener); err != nil && err != http.ErrServerClosed {
		log.Printf("❌ HTTP服务器异常: %v", err)
		waitForKeyAndExit()
	}
}

/**
 * @function isPortAvailable
 * @description 检测指定端口是否可绑定（是否已被占用）
 * @param {string} host - 绑定地址
 * @param {string} port - 端口号
 * @returns {bool} 端口可用返回 true，已被占用返回 false
 */
func isPortAvailable(host, port string) bool {
	listener, err := net.Listen("tcp", net.JoinHostPort(host, port))
	if err != nil {
		return false
	}
	listener.Close()
	return true
}

/**
 * @function waitForKeyAndExit
 * @description 等待用户按回车键后退出程序，避免双击 exe 时窗口一闪而过
 */
func waitForKeyAndExit() {
	fmt.Println("\n按回车键退出...")
	reader := bufio.NewReader(os.Stdin)
	_, _ = reader.ReadString('\n')
	os.Exit(1)
}

// ==================== 中间件工具函数 ====================

/**
 * @function withCORS
 * @description CORS跨域中间件包装器
 * @param {http.HandlerFunc} next - 目标处理器
 * @returns {http.HandlerFunc} 包装后的处理器
 */
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Heartbeat")
		w.Header().Set("Access-Control-Max-Age", "86400")

		// 处理预检请求
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next.ServeHTTP(w, r)
	}
}

/**
 * @function withMethod
 * @description HTTP方法限制中间件，只允许指定的方法
 * @param {string} method - 允许的HTTP方法
 * @param {http.HandlerFunc} handler - 目标处理器
 * @returns {http.HandlerFunc} 包装后的处理器
 */
func withMethod(method string, handler http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != method {
			SendError(w, http.StatusMethodNotAllowed, "请求方法不允许")
			return
		}
		handler.ServeHTTP(w, r)
	}
}

/**
 * @function withMethodRouter
 * @description 根据HTTP方法分发到不同的处理器
 * @param {...interface{}} args - 交替的HTTP方法名和处理器（如 "GET", handler1, "POST", handler2）
 * @returns {http.HandlerFunc} 分发处理器
 */
func withMethodRouter(args ...interface{}) http.HandlerFunc {
	handlers := make(map[string]http.HandlerFunc)
	for i := 0; i < len(args)-1; i += 2 {
		method, ok := args[i].(string)
		if !ok {
			continue
		}
		// 方法值（如 playerService.CreateCharacter）的类型是 func(http.ResponseWriter, *http.Request)，
		// 不是 http.HandlerFunc，需要分别尝试两种类型断言
		if handler, ok := args[i+1].(http.HandlerFunc); ok {
			handlers[method] = handler
		} else if fn, ok := args[i+1].(func(http.ResponseWriter, *http.Request)); ok {
			handlers[method] = http.HandlerFunc(fn)
		} else {
			log.Printf("[withMethodRouter] ⚠️ 跳过无效的处理器参数: 方法=%s 参数类型=%T", method, args[i+1])
			continue
		}
	}

	return func(w http.ResponseWriter, r *http.Request) {
		handler, ok := handlers[r.Method]
		if !ok {
			log.Printf("[withMethodRouter] ⚠️ 方法不允许: %s %s", r.Method, r.URL.Path)
			SendError(w, http.StatusMethodNotAllowed, "请求方法不允许")
			return
		}
		handler.ServeHTTP(w, r)
	}
}

/**
 * @function withJWT
 * @description JWT鉴权中间件包装器
 * @param {http.HandlerFunc} next - 目标处理器
 * @returns {http.HandlerFunc} 包装后的处理器
 */
func withJWT(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 从请求头获取令牌
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			SendError(w, http.StatusUnauthorized, "缺少认证令牌")
			return
		}

		// 解析Bearer令牌
		parts := splitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			SendError(w, http.StatusUnauthorized, "认证令牌格式错误")
			return
		}

		tokenString := parts[1]

		// 验证令牌并注入用户信息到请求头（简化处理）
		userID, username, err := ValidateToken(tokenString)
		if err != nil {
			SendError(w, http.StatusUnauthorized, "认证令牌无效或已过期")
			return
		}

		// 将用户信息注入请求Header（传递给后续处理器）
		r.Header.Set("X-User-ID", fmt.Sprintf("%d", userID))
		r.Header.Set("X-Username", username)

		next.ServeHTTP(w, r)
	}
}

/**
 * @function splitN
 * @description 字符串分割工具函数
 * @param {string} s - 待分割字符串
 * @param {string} sep - 分隔符
 * @param {int} n - 最大分割数
 * @returns {[]string} 分割结果
 */
func splitN(s, sep string, n int) []string {
	result := []string{}
	start := 0
	for i := 0; i < len(s) && len(result) < n-1; i++ {
		if s[i:i+1] == sep {
			result = append(result, s[start:i])
			start = i + 1
		}
	}
	result = append(result, s[start:])
	return result
}
