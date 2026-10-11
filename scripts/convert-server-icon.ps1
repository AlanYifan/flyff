# convert-server-icon.ps1
# 将 server/winres/icon.png 转换为 ICO 格式（256x256）
# 与客户端使用相同的方法，确保图标一致

Add-Type -AssemblyName System.Drawing

$pngPath = "d:\FF\FLYFF\server\winres\icon.png"
$icoPath = "d:\FF\FLYFF\server\winres\icon.ico"

$png = [System.Drawing.Image]::FromFile($pngPath)

$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($png, 0, 0, 256, 256)
$g.Dispose()

$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()

$icon.Dispose()
$bmp.Dispose()
$png.Dispose()

Write-Host "ICO created: $icoPath"
