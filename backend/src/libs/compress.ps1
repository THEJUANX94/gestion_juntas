Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile("Logo.png")
$bmp = New-Object System.Drawing.Bitmap(300, 100)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.DrawImage($src, 0, 0, 300, 100)
$g.Dispose()
$src.Dispose()
$bmp.Save("Logo_Optimized.png", [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Move-Item -Force Logo_Optimized.png Logo.png
Write-Output "Image compressed"
