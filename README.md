# หารกัน (Group Expense Manager)

เว็บแอปพลิเคชันสำหรับจัดการและติดตามค่าใช้จ่ายร่วมกันของกลุ่มขนาดเล็ก (บ้านเช่า, กลุ่มเพื่อน, ทริปท่องเที่ยว หรือทีมงาน) ออกแบบเป็น **ภาษาไทย (Thai-first)** รองรับการใช้งานเต็มรูปแบบบนมือถือและเดสก์ท็อป โดยยึดหลักความถูกต้องทางการเงินอย่างเคร่งครัด

---

## 🎯 จุดเด่นและฟังก์ชันหลัก

1. **คำนวณเงินระดับสตางค์ (Exact Integer-Satang Precision)**:
   - จัดเก็บและคำนวณเงินทั้งหมดเป็นจำนวนเต็ม integer `amount_satang` ไม่ใช้ Floating Point
   - ป้องกันปัญหาเศษสตางค์คลาดเคลื่อน โดยจัดการเศษตามลำดับสมาชิกที่คงที่และตรวจสอบได้
2. **วิธีการหารค่าใช้จ่าย 3 รูปแบบ (Split Modes)**:
   - **หารเท่ากัน (Equal Split)**: กระจายเศษสตางค์ตามลำดับสมาชิกที่เสถียร ผลรวมตรง 100%
   - **กำหนดจำนวนเงินเอง (Custom Amounts)**: ตรวจสอบผลรวมต้องเท่ากับยอดรายจ่ายพอดี
   - **แบ่งตามสัดส่วน (Weighted Shares)**: ระบุน้ำหนักจำนวนเต็มบวก ปัดเศษและจัดการเศษคนสุดท้าย
3. **รองรับผู้สำรองจ่ายหลายคน (Multiple Payers)**:
   - สมาชิกหลายคนสามารถร่วมกันออกเงินในบิลเดียวได้ และระบบตรวจว่าผลรวมผู้จ่ายตรงกับยอดรวมของรายจ่าย
4. **การสรุปยอดชำระ 2 รูปแบบ (Settlements)**:
   - **Direct Settlement**: คำนวณตามผู้จ่ายเงินจริง (หักลบส่วนของตนเองก่อน / Self-offset) เพื่อให้ตรวจสอบย้อนกลับได้ละเอียด
   - **Optimized Settlement**: จับคู่หนี้สุทธิ (Net Balance) ระหว่าง Debtor และ Creditor เพื่อลดจำนวนครั้งในการโอนเงินของกลุ่ม
   - ผลรวม Net Balance ของสมาชิกทุกคนในกลุ่ม **เท่ากับ 0 เสมอ**
5. **วงจรการชำระเงินและสลิป (Payment Lifecycle & Private Proofs)**:
   - สมาชิกสร้างรายการชำระเงินและอัปโหลดสลิป
   - สลิปเก็บใน Private Bucket มีการออก Signed URL อายุสั้นเฉพาะผู้มีสิทธิ์ (ผู้จ่าย, ผู้รับ, Admin)
   - ผู้รับเงินหรือ Admin ตรวจสอบสลิป และสามารถ **ยืนยัน (Confirm)** เพื่อลดหนี้ หรือ **ปฏิเสธ (Reject พร้อมระบุเหตุผล)**
   - สลิปที่ `confirmed` เท่านั้นที่ส่งผลต่อการลดหนี้ใน Net Balance
6. **การจัดการกลุ่มและรายงานตามวันเริ่มสัปดาห์**:
   - รองรับการตั้งค่าวันเริ่มต้นสัปดาห์ของกลุ่ม (`week_starts_on`: 0 = อาทิตย์, 1 = จันทร์, ..., 6 = เสาร์)
   - สรุปรายงานรายสัปดาห์และรายเดือน แสดงกราฟหมวดหมู่ และภาระของสมาชิกแต่ละคน
   - ส่งออกข้อมูลเป็น CSV ได้

---

## 🛠️ เทคโนโลยีที่ใช้

- **Frontend & Backend**: Next.js 16 (App Router) + TypeScript + React 19
- **Styling**: Vanilla CSS ปรับแต่งตาม Typography Noto Sans Thai + DM Sans
- **Charts**: Recharts (PieChart, BarChart)
- **Validation**: Zod (Input Contracts & Schema Validation)
- **Database & Auth**: Supabase (PostgreSQL, Row Level Security, Storage, Stored Procedures)
- **Testing**: Vitest (14/14 Domain Tests ครอบคลุมการคำนวณเงินและ Settlements)
- **Integrations**: LINE Messaging API Abstraction (พร้อม HMAC-SHA256 Webhook Verification)

---

## 🚀 การติดตั้งและรันในเครื่อง (Local Setup)

### 1. ติดตั้ง Dependencies

```bash
npm install
```

### 2. ตั้งค่า Environment Variables

คัดลอกไฟล์ `.env.example` ไปเป็น `.env.local`:

```bash
cp .env.example .env.local
```

ตัวแปรใน `.env.local`:
```env
# Supabase settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional LINE Messaging API (หากยังไม่มี ให้เว้นว่างไว้ ระบบจะ graceful fallback)
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
```

### 3. รัน Migration ฐานข้อมูล Supabase

นำไฟล์ SQL ในโฟลเดอร์ `supabase/migrations/` ไปรันผ่าน Supabase CLI หรือ Supabase SQL Editor:
1. `supabase/migrations/001_initial.sql` (ตารางหลัก, Triggers, Atomic Functions)
2. `supabase/migrations/002_rls_and_categories.sql` (RLS Policies, Default Categories, Void Function)

### 4. รัน Dev Server และทดสอบแอป

```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

> **หมายเหตุสำหรับการทดลองใช้งานในเครื่อง (Local Interactive Mode)**:
> ตัวแอปพลิเคชันมีระบบ State Store แบบ Reactive ในตัว พร้อมข้อมูลตัวอย่างของกลุ่ม "บ้านสุขใจ" (สมาชิก 6 คน) ทำให้สามารถเปิดทดลองเล่นได้ทันทีแม้ยังไม่ได้เชื่อมต่อ Supabase credentials จริง

### 5. การรัน Unit Tests

```bash
npm test
```
ผลการทดสอบ: ผ่าน 14/14 tests สำหรับการคำนวณเงิน, การแบ่งเท่า, กำหนดเอง, สัดส่วนน้ำหนัก, Multiple Payers, Net Balances, Direct & Optimized Settlements, และขอบเขตสัปดาห์ตาม `week_starts_on`

---

## 📑 สรุปโครงสร้าง API Routes

| Endpoint | Method | คำอธิบาย |
|---|---|---|
| `/api/groups` | `GET`, `POST` | ดูรายการกลุ่ม / สร้างกลุ่มใหม่ |
| `/api/groups/:groupId` | `GET`, `PATCH` | ดูรายละเอียดกลุ่ม / แก้ไขการตั้งค่ากลุ่ม (Admin Only) |
| `/api/groups/:groupId/members` | `GET` | รายชื่อสมาชิกในกลุ่ม |
| `/api/groups/:groupId/members/:memberId` | `PATCH`, `DELETE` | แก้ไข role สมาชิก / ปิดการใช้งาน (Soft deactivation) |
| `/api/groups/:groupId/invites` | `POST` | สร้าง Invite Token สำหรับเชิญสมาชิก |
| `/api/invites/:token/accept` | `POST` | สมาชิกยอมรับคำเชิญและตั้งรหัส PIN (ตัวเลข 4-12 หลัก) |
| `/api/groups/:groupId/categories` | `GET` | หมวดหมู่ค่าใช้จ่าย |
| `/api/groups/:groupId/expenses` | `GET`, `POST` | รายการรายจ่ายพร้อมตัวกรอง / สร้างรายจ่ายใหม่ (Admin Only) |
| `/api/groups/:groupId/expenses/:expenseId` | `GET` | รายละเอียดรายจ่าย 1 รายการ พร้อม Audit Trail |
| `/api/groups/:groupId/expenses/:expenseId/void` | `POST` | ยกเลิกรายจ่ายพร้อมระบุเหตุผล (Admin Only) |
| `/api/groups/:groupId/balances` | `GET` | คำนวณ Net Balance ของสมาชิกทุกคน |
| `/api/groups/:groupId/settlements` | `GET` | ข้อเสนอการชำระเงิน (`mode=direct` หรือ `optimized`) |
| `/api/groups/:groupId/payments` | `GET`, `POST` | ดูรายการชำระเงินของกลุ่ม / บันทึกการชำระเงิน |
| `/api/payments/:paymentId/proof/upload-url` | `POST` | สร้าง Signed Upload URL สำหรับสลิป (Private Bucket) |
| `/api/payments/:paymentId/proof` | `GET` | สร้าง Signed Read URL อายุสั้นสำหรับดูสลิป |
| `/api/payments/:paymentId/submit` | `POST` | ยื่นสลิปเพื่อให้ผู้รับเงินตรวจสอบ |
| `/api/payments/:paymentId/confirm` | `POST` | ผู้รับเงินหรือ Admin ยืนยันสลิป (ลดหนี้สมบูรณ์) |
| `/api/payments/:paymentId/reject` | `POST` | ผู้รับเงินหรือ Admin ปฏิเสธสลิปพร้อมระบุเหตุผล |
| `/api/groups/:groupId/reports/weekly` | `GET` | รายงานสรุปรายสัปดาห์ตาม `week_starts_on` |
| `/api/groups/:groupId/reports/monthly` | `GET` | รายงานสรุปรายเดือน |
| `/api/notifications` | `GET` | กล่องแจ้งเตือนของตนเอง (พร้อม unread count) |
| `/api/notifications/:id/read` | `POST` | ทำเครื่องหมายว่าอ่านแล้ว |
| `/api/integrations/line/connect` | `POST` | บันทึกการเชื่อมต่อ LINE User ID |
| `/api/webhooks/line` | `POST` | LINE Webhook พร้อมตรวจสอบ HMAC-SHA256 Signature |

---

## 🔒 ความปลอดภัยและความเป็นส่วนตัว (Security Architecture)

- **Row Level Security (RLS)**: ป้องกันการรั่วไหลของข้อมูลข้ามกลุ่ม สมาชิกเห็นเฉพาะข้อมูลในกลุ่มที่ตนมีสิทธิ์
- **PIN Security**: PIN ของสมาชิกถูกแฮชด้วย bcrypt/pgcrypto ก่อนบันทึก ไม่มีการเก็บ Plain Text
- **Private Slip Storage**: สลิปการโอนเงินเก็บใน Private Bucket ไม่อนุญาต Public URL เข้าถึงได้ผ่าน Signed URL อายุสั้น 15 นาทีเฉพาะผู้เกี่ยวข้อง
- **Audit Logging**: ทุกการสร้าง/แก้ไข/ยกเลิกรายจ่าย และการยืนยัน/ปฏิเสธสลิป มีการบันทึก Before/After ในตาราง `audit_logs`
- **Integrity Constraints**: Deferred Constraint Trigger บน PostgreSQL บังคับว่าผลรวมผู้จ่ายและส่วนแบ่งต้องเท่ากับยอดรายจ่ายเสมอ แม้จะยิงข้อมูลผ่าน client แปลกปลอม

---

## ⚠️ ข้อจำกัด Free-tier Deployment Caveats

- **Supabase Free Plan**:
  - ขนาดฐานข้อมูลจำกัด 500 MB และ Storage 1 GB
  - หากไม่มีการเรียกใช้งานเกินระยะเวลาที่กำหนด โปรเจกต์อาจหยุดชั่วคราว (Paused)
  - แนะนำให้คุมขนาดไฟล์สลิปไม่เกิน 10 MB และทำ Lifecycle ทำความสะอาดไฟล์เก่า
- **Vercel Free Tier**:
  - ข้อจำกัด Runtime Serverless Function 10-15 วินาที
  - Cron Job รายวัน/รายสัปดาห์จำกัด แนะนำให้ใช้การคำนวณและแจ้งเตือนแบบ On-demand
- **LINE Messaging API**:
  - บัญชีฟรีส่งข้อความ Broadcast/Push ได้จำกัดต่อเดือน (ประมาณ 200-500 ข้อความ)
  - ระบบนี้ออกแบบ Abstraction ไว้ หากไม่มี Credentials ระบบจะไม่แสร้งส่ง และจะแสดงแจ้งเตือนผ่านเว็บเป็นหลัก
