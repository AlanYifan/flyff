@echo off
setlocal enabledelayedexpansion

for %%F in (*_*_*.png) do (
    set "oldname=%%~nF"
    for /f "tokens=2 delims=_" %%A in ("!oldname!") do (
        ren "%%F" "%%A.png"
    )
)

echo 文件名修改完成！
pause