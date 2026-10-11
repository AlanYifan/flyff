/**
 * @file static.go
 * @description 前端静态文件服务
 * @description 为构建后的 Vue 前端提供静态文件服务，支持 SPA 路由回退
 * @description 自动设置 Cross-Origin 头以支持 SharedArrayBuffer（音效/Worker等功能依赖）
 * @description 部署模式：exe 同级目录有 index.html → 直接提供前端页面服务
 * @description 开发模式：exe 在 server/ 目录下 → 不加载静态文件，前端由 Vite dev server 提供
 * @description 前提条件：部署模式下需将 exe 与 index.html 放在同一目录
 */

package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

/** 静态文件目录路径（dist 目录） */
var staticFileDir string

/**
 * @function initStaticFileDir
 * @description 初始化静态文件目录路径
 * @description 优先从环境变量 FLYFF_STATIC_DIR 读取
 * @description 未设置时按可执行文件位置自动推断：
 * @description   - exe 同级目录有 index.html → exe 所在目录（部署模式，支持任意目录名）
 * @description   - 否则不加载静态文件（开发模式，前端由 Vite dev server 提供）
 * @description 开发模式下 staticFileDir 为空，不影响 API 服务正常运行
 * @returns {void}
 */
func initStaticFileDir() {
	// 优先从环境变量读取，方便自定义部署路径
	staticFileDir = os.Getenv("FLYFF_STATIC_DIR")
	if staticFileDir == "" {
		// 根据可执行文件位置自动推断
		execPath, _ := os.Executable()
		execDir := filepath.Dir(execPath)

		// 检查 exe 同级目录是否有 index.html（部署模式）
		// 部署模式下 exe 与前端文件在同一目录，直接提供服务
		indexPath := filepath.Join(execDir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			staticFileDir = execDir
		} else {
			// 开发模式：exe 在 server/ 目录下，没有 index.html
			// 不回退到 ../dist，前端由 Vite dev server（端口3000）提供
			// Go 后端仅处理 API 请求，不提供静态文件服务
			staticFileDir = ""
			log.Printf("🔧 开发模式：静态文件服务已禁用，前端由 Vite dev server 提供（http://localhost:3000）")
			return
		}
	}

	// 检查目录是否存在
	info, err := os.Stat(staticFileDir)
	if err != nil || !info.IsDir() {
		log.Printf("⚠️ 静态文件目录不存在: %s（前端页面将不可用）", staticFileDir)
		staticFileDir = ""
		return
	}

	log.Printf("📁 静态文件目录: %s", staticFileDir)
}

/**
 * @function staticFileHandler
 * @description 创建前端静态文件处理器
 * @description 功能：
 *   1. 设置 COEP/COOP/CORP 头以启用 SharedArrayBuffer（音效缓存、Worker 等功能依赖）
 *   2. 文件存在则直接返回（CSS/JS/图片等静态资源）
 *   3. 文件不存在或为目录时回退到 index.html（Vue Router 历史模式 SPA 路由）
 *   4. dist 目录不存在时返回友好的错误提示
 * @returns {http.HandlerFunc} 静态文件处理器
 */
func staticFileHandler() http.HandlerFunc {
	// 开发模式下 staticFileDir 为空，不提供静态文件服务
	// 前端由 Vite dev server（端口3000）提供，Go 后端仅处理 API 请求
	if staticFileDir == "" {
		return func(w http.ResponseWriter, r *http.Request) {
			// 对 API 请求以外的路径返回提示信息
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusNotFound)
			w.Write([]byte(`<!DOCTYPE html>
<html><body style="font-family:monospace;text-align:center;padding:50px">
<h2>🔧 开发模式</h2>
<p>Go 后端仅提供 API 服务，前端由 Vite dev server 提供。</p>
<p>请访问 <a href="http://localhost:3000">http://localhost:3000</a> 打开游戏页面</p>
<p>API 地址：http://localhost:8080/api</p>
</body></html>`))
		}
	}

	fileServer := http.FileServer(http.Dir(staticFileDir))
	indexPath := filepath.Join(staticFileDir, "index.html")

	return func(w http.ResponseWriter, r *http.Request) {
		// 设置 Cross-Origin 头以支持 SharedArrayBuffer
		// 缺少这些头时，浏览器会拒绝创建 SharedArrayBuffer，导致音效和部分 Worker 不可用
		w.Header().Set("Cross-Origin-Embedder-Policy", "require-corp")
		w.Header().Set("Cross-Origin-Opener-Policy", "same-origin")
		w.Header().Set("Cross-Origin-Resource-Policy", "cross-origin")

		// 尝试打开请求的文件，检查是否存在且不是目录
		if f, err := http.Dir(staticFileDir).Open(r.URL.Path); err == nil {
			stat, err := f.Stat()
			f.Close()
			if err == nil && !stat.IsDir() {
				// 文件存在且不是目录，交给 FileServer 处理（自动设置 Content-Type、ETag 等）
				fileServer.ServeHTTP(w, r)
				return
			}
		}

		// 文件不存在或是目录（如 SPA 路由 /battle、/select 等），回退到 index.html
		http.ServeFile(w, r, indexPath)
	}
}
