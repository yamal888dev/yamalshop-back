# ============================================================
#  เปิด TCP/IP ให้ SQL Server Express (instance: SQLEXPRESS2022)
#  ตั้ง static port 1433 และรีสตาร์ต service
#
#  วิธีรัน: คลิกขวาที่ PowerShell -> "Run as administrator"
#  แล้วสั่ง:
#     powershell -ExecutionPolicy Bypass -File "C:\Yamal888Dev\yamalshop\yamalshop-back\scripts\enable-sqlserver-tcp.ps1"
# ============================================================

$ErrorActionPreference = 'Stop'

# ตรวจสอบสิทธิ์ admin
$isAdmin = ([Security.Principal.WindowsPrincipal] `
  [Security.Principal.WindowsIdentity]::GetCurrent()
).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
  Write-Error "กรุณารันสคริปต์นี้แบบ Run as administrator"
  exit 1
}

$instanceId = 'MSSQL16.SQLEXPRESS2022'
$service    = 'MSSQL$SQLEXPRESS2022'
$tcp = "HKLM:\SOFTWARE\Microsoft\Microsoft SQL Server\$instanceId\MSSQLServer\SuperSocketNetLib\Tcp"

Write-Host "กำลังเปิด TCP/IP และตั้ง port 1433 ..." -ForegroundColor Cyan
Set-ItemProperty -Path $tcp            -Name Enabled          -Value 1
Set-ItemProperty -Path "$tcp\IPAll"    -Name TcpPort          -Value "1433"
Set-ItemProperty -Path "$tcp\IPAll"    -Name TcpDynamicPorts  -Value ""

Write-Host "กำลังรีสตาร์ต service $service ..." -ForegroundColor Cyan
Restart-Service $service -Force

Start-Sleep -Seconds 2
$ok = (Test-NetConnection -ComputerName localhost -Port 1433 -WarningAction SilentlyContinue).TcpTestSucceeded
if ($ok) {
  Write-Host "สำเร็จ! SQL Server ฟังอยู่ที่ localhost:1433 แล้ว" -ForegroundColor Green
} else {
  Write-Warning "ตั้งค่าเสร็จแต่ยังต่อ port 1433 ไม่ได้ ลองรอสักครู่แล้วเช็คใหม่"
}