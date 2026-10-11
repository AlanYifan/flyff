# convert-icon.ps1
# 将服务端图标 server/winres/icon.png 转换为 ICO 格式
# 用于 FlyFFClient.exe，使客户端和服务端图标一致

Add-Type -AssemblyName System.Drawing

$pngPath = "d:\FF\FLYFF\server\winres\icon.png"
$icoPath = "d:\FF\FLYFF\scripts\flyff-client.ico"

# 加载 PNG 图片
$png = [System.Drawing.Image]::FromFile($pngPath)

# 创建 256x256 位图（标准图标尺寸）
$bmp = New-Object System.Drawing.Bitmap(256, 256)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($png, 0, 0, 256, 256)
$g.Dispose()

# 从位图获取图标并保存为 ICO 文件
$icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
$fs = [System.IO.File]::Create($icoPath)
$icon.Save($fs)
$fs.Close()

# 释放资源
$icon.Dispose()
$bmp.Dispose()
$png.Dispose()

Write-Host "ICO icon created: $icoPath (source: server/winres/icon.png)"
