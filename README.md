# Yamal888 Shop — Backend API

REST API สำหรับ Yamal888 Shop พัฒนาด้วย **NestJS + Prisma + SQL Server** (JWT auth, bcrypt)

## เทคโนโลยี

- NestJS 10 (REST)
- Prisma 5 (ORM) + Microsoft SQL Server
- JWT (`@nestjs/jwt` + Passport) + bcryptjs
- class-validator / class-transformer (ตรวจ input ตาม DTO)

## เตรียม SQL Server (ครั้งแรกครั้งเดียว)

โปรเจกต์นี้ใช้ SQL Server Express (instance `SQLEXPRESS2022`) — Prisma ต่อผ่าน TCP เท่านั้น

1. **เปิด TCP + port 1433** — เปิด PowerShell แบบ **Run as administrator** แล้วรัน:
   ```powershell
   powershell -ExecutionPolicy Bypass -File "C:\Yamal888Dev\yamalshop\yamalshop-back\scripts\enable-sqlserver-tcp.ps1"
   ```
2. login + database (`yamalshop`) ถูกสร้างไว้แล้ว — ดูค่าเชื่อมต่อใน `.env`

## ติดตั้ง & รัน

```bash
npm install
npm run prisma:generate    # สร้าง Prisma client
npm run prisma:push        # สร้างตารางใน SQL Server ตาม schema
npm run seed               # ใส่ข้อมูลตัวอย่าง (หมวดหมู่ + สินค้า + บัญชีแอดมิน)
npm run start:dev          # รัน API ที่ http://localhost:3000/api
```

## บัญชีทดสอบ

- **แอดมิน:** `admin@yamal888.com` / `admin1234`
- ลูกค้า: สมัครผ่าน `POST /api/auth/register`

## โครงสร้าง API (prefix `/api`)

### Auth
| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/auth/register` | ทุกคน | สมัครสมาชิก (คืน user + accessToken) |
| POST | `/auth/login` | ทุกคน | เข้าสู่ระบบ |
| GET | `/auth/me` | ล็อกอิน | ข้อมูลผู้ใช้ปัจจุบัน |

### Categories / Products
| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| GET | `/categories` | ทุกคน | หมวดหมู่ทั้งหมด |
| GET | `/products?q=&category=&sort=` | ทุกคน | รายการสินค้า (ค้นหา/กรอง/เรียง) |
| GET | `/products/featured` | ทุกคน | สินค้าแนะนำ |
| GET | `/products/slug/:slug` | ทุกคน | สินค้าตาม slug |
| GET | `/products/:id` | ทุกคน | สินค้าตาม id |
| POST | `/products` | admin | เพิ่มสินค้า |
| PATCH | `/products/:id` | admin | แก้ไขสินค้า |
| PATCH | `/products/:id/stock` | admin | ปรับสต็อก |
| DELETE | `/products/:id` | admin | ลบสินค้า |

### Orders
| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| POST | `/orders` | ล็อกอิน | สร้างคำสั่งซื้อ (คิดราคา/ตัดสต็อกฝั่ง server) |
| GET | `/orders/mine` | ล็อกอิน | ประวัติคำสั่งซื้อของฉัน |
| GET | `/orders/:id` | เจ้าของ/admin | รายละเอียดคำสั่งซื้อ |
| POST | `/orders/:id/pay` | เจ้าของ | แจ้งชำระเงิน/แนบสลิป → รอตรวจสอบ |
| POST | `/orders/:id/received` | เจ้าของ | ยืนยันรับสินค้า |
| POST | `/orders/:id/issues` | เจ้าของ | แจ้งปัญหาสินค้า |
| GET | `/orders` | admin | คำสั่งซื้อทั้งหมด (`?status=`) |
| GET | `/orders/stats` | admin | สรุปตัวเลข dashboard |
| PATCH | `/orders/:id/status` | admin | อัปเดตสถานะ |
| PATCH | `/orders/:id/issues/:issueId/resolve` | admin | ปิดเรื่องที่แจ้ง |

### Users
| Method | Path | สิทธิ์ | คำอธิบาย |
|---|---|---|---|
| GET | `/users` | admin | รายชื่อสมาชิก + สรุปยอดซื้อ |

## หมายเหตุ

- ราคาและสต็อกคำนวณ/ตัดที่ฝั่ง server เท่านั้น (client ส่งแค่ productId + quantity) เพื่อกันการปลอมราคา
- SQL Server ไม่รองรับ enum/array ของ Prisma → role/status เป็น String, images/tags เก็บเป็น JSON string แล้วแปลงเป็น array ในชั้น service
- ใช้ `prisma db push` สำหรับ dev (ไม่ต้องมีสิทธิ์สร้าง shadow database); production ค่อยเปลี่ยนเป็น `prisma migrate`
