$env:PATH = "D:\.cargo\bin;" + $env:PATH
$env:HTTP_PROXY = "http://127.0.0.1:7890"
$env:HTTPS_PROXY = "http://127.0.0.1:7890"
Set-Location "E:\study\work\web-office-toolbox\wasm\image-converter-wasm"
wasm-pack build --target web --release 2>&1

if ($LASTEXITCODE -eq 0) {
    $dest = "E:\study\work\web-office-toolbox\src\wasm\image-converter"
    if (-not (Test-Path $dest)) { New-Item -ItemType Directory -Force -Path $dest | Out-Null }
    Copy-Item "pkg\*" $dest -Force
    Write-Host "`n✅ WASM 产物已复制到 $dest"
}
