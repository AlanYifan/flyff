@echo off
chcp 65001 >nul
echo ========================================
echo   FlyFF 服务端 - 生成自签名TLS证书
echo ========================================
echo.

REM 检查是否已存在证书
if exist "cert.pem" (
    echo [警告] 检测到已有证书文件：
    echo   - cert.pem
    echo   - key.pem
    echo.
    set /p OVERWRITE="是否覆盖？(y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo 已取消，保留现有证书。
        pause
        exit /b 0
    )
)

echo [1/2] 生成自签名TLS证书...
echo.

REM 使用Go自带的crypto/tls/generate_cert逻辑
REM 通过运行一个临时Go程序来生成证书
go run -v -mod=mod github.com/FiloSottilla/mkcert/v2@latest -install 2>nul

REM 使用openssl或go generate方式
REM 生成有效期365天的RSA 2048位自签名证书
go run ./cmd/generate_cert

if %ERRORLEVEL% neq 0 (
    echo.
    echo [错误] 证书生成失败，尝试使用 OpenSSL...
    
    REM 尝试使用OpenSSL
    where openssl >nul 2>nul
    if %ERRORLEVEL% equ 0 (
        openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 3650 -nodes -subj "/CN=localhost" -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"
        if %ERRORLEVEL% equ 0 (
            echo.
            echo [成功] OpenSSL证书生成完成！
        ) else (
            echo [错误] OpenSSL证书生成也失败了
            pause
            exit /b 1
        )
    ) else (
        echo [错误] 未找到OpenSSL，请安装OpenSSL或Go环境
        pause
        exit /b 1
    )
)

echo.
echo [2/2] 验证证书文件...
if exist "cert.pem" (
    echo   ✅ cert.pem 已生成
) else (
    echo   ❌ cert.pem 未找到
    pause
    exit /b 1
)
if exist "key.pem" (
    echo   ✅ key.pem 已生成
) else (
    echo   ❌ key.pem 未找到
    pause
    exit /b 1
)

echo.
echo ========================================
echo   证书生成完成！
echo   下次启动服务端时可设置 FLYFF_TLS=true
echo   启用HTTP/2模式
echo ========================================
echo.
pause
