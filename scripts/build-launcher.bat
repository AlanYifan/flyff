@echo off
chcp 65001 >nul
REM ================================================
REM   FLYFF 启动器重编译脚本
REM   用法：双击运行或命令行执行
REM ================================================

echo ========================================
echo   FLYFF 启动器 - 重新编译
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

REM 编译（带图标）
"%CSC%" /out:"%~dp0..\FLYFF-Launcher.exe" /target:exe /optimize+ /nologo /win32icon:"%~dp0flyff-icon.ico" "%~dp0FLYFFLauncher.cs"

if %ERRORLEVEL% equ 0 (
    echo.
    echo [成功] 编译完成！
    echo 输出文件: %~dp0..\FLYFF-Launcher.exe
    echo.
    echo 双击 FLYFF-Launcher.exe 即可启动开发服务器
) else (
    echo.
    echo [错误] 编译失败，错误代码: %ERRORLEVEL%
)

echo.
pause
