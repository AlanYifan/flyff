@echo off
chcp 65001 >nul
REM FlyFF后端服务 - HTTP/2模式一键启动
REM 首次启动会自动生成自签名证书，无需手动操作

echo ========================================
echo   FlyFF 后端服务 - HTTP/2模式启动
echo ========================================
echo.

REM 设置环境变量启用TLS
set FLYFF_TLS=true

REM 启动服务（编译+运行）
call start.bat
