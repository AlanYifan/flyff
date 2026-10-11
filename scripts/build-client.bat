@echo off
chcp 65001 >nul
REM ================================================
REM   FlyFF 客户端启动器编译脚本
REM   功能：将 FlyFFClient.cs 编译为 FlyFFClient.exe
REM   图标：使用 pt/fly/xx.png 转换的 flyff-client.ico
REM   输出：public/FlyFFClient.exe（构建时自动复制到 dist/）
REM ================================================

echo ========================================
echo   FlyFF Client - 编译启动器
echo ========================================
echo.

REM 查找 .NET Framework csc.exe 编译器
set "CSC="
for /f "delims=" %%i in ('dir /b /s /o:n "C:\Windows\Microsoft.NET\Framework64\csc.exe" 2^>nul') do set "CSC=%%i"

if not defined CSC (
    for /f "delims=" %%i in ('dir /b /s /o:n "C:\Windows\Microsoft.NET\Framework\csc.exe" 2^>nul') do set "CSC=%%i"
)

if not defined CSC (
    echo [错误] 未找到 csc.exe 编译器，请确认已安装 .NET Framework
    pause
    exit /b 1
)

echo 编译器: %CSC%
echo.

REM 检查 ICO 图标文件是否存在
if not exist "%~dp0flyff-client.ico" (
    echo [提示] ICO 图标不存在，正在从 PNG 转换...
    powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0convert-icon.ps1"
)

REM 编译 FlyFFClient.exe（带图标）
echo 正在编译 FlyFFClient.exe ...
"%CSC%" /out:"%~dp0..\public\FlyFFClient.exe" /target:exe /optimize+ /nologo /win32icon:"%~dp0flyff-client.ico" /reference:System.Net.Http.dll "%~dp0FlyFFClient.cs"

if %ERRORLEVEL% equ 0 (
    echo.
    echo [成功] 编译完成！
    echo 输出文件: %~dp0..\public\FlyFFClient.exe
    echo.
    echo npm run build 时会自动复制到 dist/FlyFFClient.exe
) else (
    echo.
    echo [错误] 编译失败，错误代码: %ERRORLEVEL%
)

echo.
pause
