import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { copyFileSync, existsSync, mkdirSync, unlinkSync } from 'fs'

function removeSourceMapPlugin() {
  return {
    name: 'remove-source-map',
    enforce: 'post',
    // 在 transform 钩子中处理所有文件
    transform(code) {
      // 移除所有类型的 sourcemap 注释
      code = code.replace(/\/\/[@#]\s*sourceMappingURL=[^\n]*/g, '')
      code = code.replace(/\/\/[@#]\s*sourceURL=[^\n]*/g, '')
      code = code.replace(/\/\*[@#] sourceMappingURL=[^*]*\*\//g, '')
      code = code.replace(/\/\*[@#] sourceURL=[^*]*\*\//g, '')
      
      // 移除 data:application/json 格式的内联 sourcemap
      code = code.replace(/\/\/#\s*sourceMappingURL=data:application\/json[^\n]*/g, '')
      
      // 移除可能的多行 sourcemap 注释
      code = code.replace(/\/\/#\s*sourceMappingURL=data:application\/json;base64,[^\n]*/g, '')
      
      return {
        code,
        map: null  // 确保不生成 sourcemap
      }
    },
    // 添加 generateBundle 钩子以确保最终输出不包含 sourcemap
    generateBundle(options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type === 'chunk') {
          // 再次清理 chunk 代码中的 sourcemap 注释
          file.code = file.code.replace(/\/\/[@#]\s*sourceMappingURL=[^\n]*/g, '')
          file.code = file.code.replace(/\/\/[@#]\s*sourceURL=[^\n]*/g, '')
        }
      }
    },
    // 简单的 configureServer 钩子，只处理原始 JS 文件的响应
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const originalEnd = res.end
        
        res.end = function(data, encoding, callback) {
          // 只处理 JavaScript 文件
          if (req.url && req.url.endsWith('.js') && data) {
            try {
              const str = Buffer.isBuffer(data) ? data.toString() : data.toString()
              const cleaned = str.replace(/\/\/[@#]\s*sourceMappingURL=[^\n]*/g, '')
                .replace(/\/\/[@#]\s*sourceURL=[^\n]*/g, '')
                .replace(/\/\/#\s*sourceMappingURL=data:application\/json[^\n]*/g, '')
              
              data = Buffer.from(cleaned)
            } catch (error) {
              // 如果处理失败，继续使用原始数据
              console.warn('Failed to remove sourcemap from:', req.url)
            }
          }
          
          return originalEnd.call(this, data, encoding, callback)
        }
        
        next()
      })
    }
  }
}

/**
 * Vite 插件：从所有 chunk 中移除对重型数据 chunk 的预加载引用
 * 用途/业务意图：防止 Select 页面跳转到 Main 时，浏览器通过 ES Module 静态 import 链
 *   预加载 ITEM_INFO(28MB)/MONSTER_INFO(19MB)/SKILL_INFO(3MB) 等大文件
 * 原理：在 generateBundle 阶段扫描所有 chunk 的代码，将引用重型 chunk 的静态 import 语句
 *   替换为延迟加载的动态 import()。重型 chunk 只有在 ensureGameStores() 实际执行时才按需加载。
 * 安全性：被替换的变量会初始化为 null，在异步 import() 完成后被赋值。
 *   由于 Main.vue 的 initGame() 在 onMounted 中 await 执行，initGame 内部会调用
 *   ensureGameStores() 加载所有子 Store，到那时重型数据才真正被使用，所以赋值顺序是安全的。
 */
function deferHeavyChunkPlugin () {
  /** 需要延迟加载的重型 chunk 名称前缀 */
  const HEAVY_CHUNK_PREFIXES = ['item-info', 'monster-info', 'skill-info']

  return {
    name: 'defer-heavy-chunk',
    enforce: 'post',
    generateBundle (options, bundle) {
      for (const file of Object.values(bundle)) {
        if (file.type !== 'chunk') continue

        for (const prefix of HEAVY_CHUNK_PREFIXES) {
          // 匹配形如 import{ITEM_INFO as wo}from"./item-info-CNFX_yp0.js"; 的静态 import
          const importRegex = new RegExp(
            `import\\{([^}]+)\\}from"(\\./${prefix}-[a-zA-Z0-9_-]+\\.js)";`,
            'g'
          )

          let match
          const replacements = []
          while ((match = importRegex.exec(file.code)) !== null) {
            replacements.push({
              fullMatch: match[0],
              imports: match[1],
              chunkPath: match[2]
            })
          }

          if (replacements.length === 0) continue

          for (const { fullMatch, imports, chunkPath } of replacements) {
            // 解析导入的变量名，如 "ITEM_INFO as wo" → [{exportName:'ITEM_INFO', localName:'wo'}]
            const importList = imports.split(',').map(s => s.trim()).filter(Boolean)
            const parsedImports = importList.map(imp => {
              const parts = imp.split(/\s+as\s+/)
              if (parts.length === 2) {
                return { exportName: parts[0].trim(), localName: parts[1].trim() }
              }
              return { exportName: parts[0].trim(), localName: parts[0].trim() }
            })

            // 生成延迟加载代码：
            // var __heavy_item_info,wo=null;async function __load_item_info(){if(!__heavy_item_info)__heavy_item_info=await import("./item-info-xxx.js");wo=__heavy_item_info.ITEM_INFO;return __heavy_item_info;};__load_item_info();
            const cacheVarName = `__heavy_${prefix.replace(/-/g, '_')}`
            const loadFnName = `__load_${prefix.replace(/-/g, '_')}`

            // 使用 var 声明所有变量（包括局部变量），否则在 ES module 严格模式下
            // 赋值未声明变量会抛出 ReferenceError: xxx is not defined
            const localVarDecls = parsedImports.map(p => p.localName).join(',')
            let proxyCode = `var ${cacheVarName}`
            if (localVarDecls) {
              proxyCode += `,${localVarDecls}`
            }
            proxyCode += ';'

            for (const { localName } of parsedImports) {
              proxyCode += `${localName}=null;`
            }

            proxyCode += `async function ${loadFnName}(){if(!${cacheVarName})${cacheVarName}=await import("${chunkPath}");`

            for (const { exportName, localName } of parsedImports) {
              proxyCode += `${localName}=${cacheVarName}.${exportName};`
            }

            proxyCode += `return ${cacheVarName};};${loadFnName}();`

            file.code = file.code.replace(fullMatch, proxyCode)
          }
        }
      }
    }
  }
}

/**
 * Vite 插件：构建后将 Go 服务端 exe 复制到 dist 目录
 * 用途/业务意图：使 dist 目录完全自包含，复制给其他玩家即可直接运行
 * 原理：在 closeBundle 钩子（所有文件已写入 dist 后）中复制 server/flyff-server.exe
 * 安全性：如果 exe 不存在则跳过并警告，不中断构建
 */
/**
 * 需要在构建后清理的运行时文件列表
 * 这些文件由 flyff-server.exe 运行时自动生成，不应打包到分发目录中
 * 如果旧的数据库被一起复制，别的玩家将无法用 guest/123456 登录
 */
const RUNTIME_FILES = [
  'flyff.db',       // SQLite 数据库（含用户账号和存档数据）
  'flyff.db-wal',   // SQLite WAL 日志文件
  'flyff.db-shm',   // SQLite 共享内存文件
  'cert.pem',       // TLS 证书（服务端首次启动自动生成）
  'key.pem'         // TLS 密钥（服务端首次启动自动生成）
]

function copyServerExePlugin () {
  return {
    name: 'copy-server-exe',
    closeBundle () {
      const src = resolve(__dirname, 'server', 'flyff-server.exe')
      const dest = resolve(__dirname, 'dist', 'flyff-server.exe')
      if (existsSync(src)) {
        try {
          copyFileSync(src, dest)
          console.log('✓ flyff-server.exe 已复制到 dist/')
        } catch (err) {
          console.warn('⚠ 复制 flyff-server.exe 失败:', err.message)
        }
      } else {
        console.warn('⚠ server/flyff-server.exe 不存在，请先编译 Go 服务端')
      }

      // 清理 dist 目录中的运行时文件，确保分发目录干净
      // 这样别的玩家拿到 dist 目录后，服务端首次启动会自动创建新数据库并初始化 guest/123456 账号
      for (const file of RUNTIME_FILES) {
        const filePath = resolve(__dirname, 'dist', file)
        if (existsSync(filePath)) {
          try {
            unlinkSync(filePath)
            console.log(`✓ 已清理运行时文件: ${file}`)
          } catch (err) {
            console.warn(`⚠ 清理 ${file} 失败:`, err.message)
          }
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [vue(), deferHeavyChunkPlugin(), removeSourceMapPlugin(), copyServerExePlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@components': resolve(__dirname, 'src/components'),
      '@views': resolve(__dirname, 'src/views'),
      '@store': resolve(__dirname, 'src/store'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@api': resolve(__dirname, 'src/api')
    }
  },
  esbuild: {
    sourcemap: false // 在开发和和生产中都禁用 esbuild 的 sourcemap
  },
  optimizeDeps: {
    esbuildOptions: {
      sourcemap: false // 在依赖优化中也禁用 sourcemap
    },
    // 排除大数据文件，避免预构建时处理它们
    exclude: [
      '@/data/ITEM_INFO.js',
      '@/data/MONSTER_INFO.js',
      '@/data/SKILL_INFO.js'
    ]
  },
  server: {
    port: 3000,
    open: true,
    host: 'localhost',
    cors: true,
    strictPort: false,
    // 配置静态文件服务，支持大文件
    fs: {
      // 允许访问项目根目录外的文件
      strict: false
    },
    // 添加 Cross-Origin 相关响应头，支持 SharedArrayBuffer
    // Cross-Origin-Resource-Policy: cross-origin 允许跨域加载和缓存资源
    // 缺少此头时，COEP(require-corp) 会导致浏览器拒绝缓存音效等静态资源
    // 报错 ERR_CACHE_OPERATION_NOT_SUPPORTED
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    // 代理配置
    proxy: {
      // Go 后端双端口：HTTP(8080) + HTTPS/HTTP2(8443)
      // 开发环境通过 Vite 代理转发，优先使用 HTTP 端口（兼容性好）
      // 生产环境可直接访问 HTTPS 端口获得 HTTP/2 并发优势
      '/api/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        // 防止自动战斗期间频繁保存导致代理超时断连
        // 默认代理超时较短，当保存请求排队时易触发 ECONNABORTED
        timeout: 60000,
        // 代理请求超时（等待目标服务器响应的最长时间）
        proxyTimeout: 60000,
        // WebSocket 超时（本项目暂未使用 WebSocket）
        ws: false,
        // 代理错误处理：页面刷新/关闭时浏览器会中止 in-flight 请求，
        // 代理写入已关闭的上游连接触发 ECONNRESET，属于正常行为无需报错
        // 另外 Vite 代理复用被 Go 后端 IdleTimeout 关闭的 keep-alive 连接也会触发 ECONNRESET
        // StorageService 已有重试机制保证数据保存成功，此处仅需静默这些已知错误
        configure: (proxy) => {
          // Vite 在 configure 回调之后才添加自己的 error 监听器，
          // 因此必须用 setTimeout(0) 延迟到 Vite 添加完自己的监听器后再移除
          setTimeout(() => {
            proxy.removeAllListeners('error')
            proxy.on('error', (err, req, res) => {
              const code = err.code || ''
              // ECONNRESET/ECONNREFUSED/EPIPE/ECANCELED：连接重置/拒绝/断开/取消，均为正常行为
              if (code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'EPIPE' || code === 'ECANCELED') {
                return
              }
              console.error(`[vite proxy] ${code}: ${req?.method || ''} ${req?.url || ''}`)
            })
          }, 0)
        }
      }
    }
  },
  /**
   * 预览服务器配置（npm run preview）
   * 用途：构建后通过 Vite 预览服务器运行前端，同时代理 API 请求到 Go 后端
   * 使用场景：不想用 Go 后端提供静态文件时，可单独启动 preview + Go 后端
   */
  preview: {
    port: 4173,
    open: true,
    host: 'localhost',
    cors: true,
    // 与 dev 服务器一致的 Cross-Origin 头，支持 SharedArrayBuffer
    headers: {
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },
    // 代理 API 请求到 Go 后端（与 dev 模式一致）
    proxy: {
      '/api/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        timeout: 60000,
        proxyTimeout: 60000,
        ws: false,
        configure: (proxy) => {
          setTimeout(() => {
            proxy.removeAllListeners('error')
            proxy.on('error', (err, req, res) => {
              const code = err.code || ''
              if (code === 'ECONNRESET' || code === 'ECONNREFUSED' || code === 'EPIPE' || code === 'ECANCELED') {
                return
              }
              console.error(`[vite preview proxy] ${code}: ${req?.method || ''} ${req?.url || ''}`)
            })
          }, 0)
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // 禁用 sourcemap
    rollupOptions: {
      output: {
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
        // 手动分割代码块，将大数据文件分离
        manualChunks: (id) => {
          // 大数据文件单独打包
          if (id.includes('ITEM_INFO.js')) {
            return 'item-info'
          }
          if (id.includes('MONSTER_INFO.js')) {
            return 'monster-info'
          }
          if (id.includes('SKILL_INFO.js')) {
            return 'skill-info'
          }
          // 其他 vendor 代码
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    },
    // 提高块大小警告阈值
    chunkSizeWarningLimit: 40000
  },
  css: {
    devSourcemap: false, // 禁用开发模式的 CSS sourcemap
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler',
        additionalData: '@use "@/styles/variables.scss" as *;',
        sourceMap: false // 禁用 SCSS sourcemap
      }
    }
  }
})
