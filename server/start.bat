@echo off
chcp 65001 >nul
REM FlyFF后端服务启动脚本
REM 双击即可启动，自动同时运行HTTP(8080)和HTTPS/HTTP2(8443)双端口
REM 首次启动会自动生成TLS证书，无需手动操作

echo ========================================
echo   FlyFF 后端服务启动脚本
echo ========================================
echo.

REM 检查Go是否安装
where go >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [错误] 未检测到Go语言环境，请先安装Go 1.21+
    echo 下载地址: https://go.dev/dl/
    pause
    exit /b 1
)

echo [1/3] 下载依赖...
go mod tidy
if %ERRORLEVEL% neq 0 (
    echo [错误] 下载依赖失败
    pause
    exit /b 1
)

echo [2/3] 编译项目...
go build -o flyff-server.exe .
if %ERRORLEVEL% neq 0 (
    echo [错误] 编译失败
    pause
    exit /b 1
)

echo [3/3] 启动服务...
echo.
echo 双端口模式启动：
echo   HTTP  → http://localhost:8080/api  （Vite代理兼容）
echo   HTTPS → https://localhost:8443/api （HTTP/2，无并发限制）
echo.
echo 按 Ctrl+C 停止服务
echo.

flyff-server.exe

pause
