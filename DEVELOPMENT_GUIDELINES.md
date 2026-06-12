# 📘 BlueFolio — คู่มือแนวทางการพัฒนาโค้ด (Development Guidelines)

คู่มือนี้จัดทำขึ้นโดยอิงตามแนวทางและหลักเกณฑ์การพัฒนาจากไฟล์ [แก้ไข.txt](file:///C:/Users/acer_/OneDrive/Documents/warakorn/แก้ไข.txt) เพื่อใช้เป็นมาตรฐานสำหรับทีมพัฒนาและผู้มีส่วนร่วมในการเขียนโค้ดสำหรับระบบ **BlueFolio** ในอนาคต เพื่อให้โค้ดสะอาด อ่านง่าย ปลอดภัย และมีคุณภาพแบบมืออาชีพ

---

## 🧭 4 เสาหลักในการพัฒนาโค้ด (Core Principles)

### 1. การเขียนและการตั้งชื่อ (Readability & Naming)
* **สื่อความหมายชัดเจน (Self-documenting):** ตั้งชื่อตัวแปร ฟังก์ชัน และคลาสให้ชัดเจนตามหน้าที่ของมัน อ่านครั้งเดียวต้องเข้าใจโดยไม่ต้องพึ่งคอมเมนต์
* **หลีกเลี่ยงชื่อย่อที่คลุมเครือ:** ไม่ใช้ชื่อสั้นๆ หรือชื่อที่เอไอทั่วไปชอบสร้างแบบซ้ำซาก (เช่น `temp`, `data`, `u`, `item` ในขอบเขตที่กว้างเกินไป)
* **สไตล์การเขียน:** ใช้ `camelCase` สำหรับตัวแปรและฟังก์ชันในฝั่ง JavaScript / React และใช้ `PascalCase` สำหรับชื่อ Component

#### 💡 ตัวอย่างการปรับปรุง:
```diff
// ❌ แบบเดิม (คลุมเครือและ Mutation ค่าตรงๆ)
const emailExists = users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase());

//  แบบใหม่ (อ่านแล้วเข้าใจทันที)
const isEmailTaken = users.some(existingUser => existingUser.email.toLowerCase() === trimmedEmail);
```

---

### 2. ความกระชับและการออกแบบ (Code Elegance & Clean Code)
* **หลักการ DRY (Don't Repeat Yourself):** ยุบรวมการทำงานหรือ Element ซ้ำซ้อนให้รวมอยู่ในจุดเดียวหรือทำเป็นฟังก์ชันส่วนกลาง
* **ลด Nested Logic (Early Return / Guard Clauses):** จัดโครงสร้างเงื่อนไขให้อ่านง่าย หลีกเลี่ยง `if-else` ซ้อนกันหลายชั้น โดยการสกัดด้วยเงื่อนไขขัดแย้งแล้ว `return` ออกไปทันที
* **ฟีเจอร์สมัยใหม่ (Best Practices):** 
  * ใช้ `useMemo` หรือ `useCallback` สำหรับข้อมูลที่ต้องประมวลผลหนักๆ ป้องกันการ re-render
  * ใช้ Functional State Updates (`prev => ...`) เมื่อค่าสเตทใหม่ต้องพึ่งพาค่าสเตทก่อนหน้า ป้องกันบั๊ก stale state

#### 💡 ตัวอย่างการปรับปรุง (Functional Updates):
```diff
// ❌ แบบเดิม (เสี่ยงเกิด Stale State และเขียนทับตรงๆ)
const updatedPortfolio = portfolio.filter((item) => item.id !== id);
setPortfolio(updatedPortfolio);
localStorage.setItem('bluefolio_items', JSON.stringify(updatedPortfolio));

//  แบบใหม่ (อัปเดตแบบฟังก์ชัน ปลอดภัยและซิงก์ LocalStorage ในตัว)
setPortfolio(prevPortfolio => {
  const updated = prevPortfolio.filter(item => item.id !== id);
  localStorage.setItem('bluefolio_items', JSON.stringify(updated));
  return updated;
});
```

---

### 3. การใส่คอมเมนต์อย่างชาญฉลาด (Smart Commenting)
* **เน้นคอมเมนต์ "เหตุผล (Why)":** ให้เขียนอธิบายว่าทำไมถึงต้องออกแบบโค้ดแบบนี้ มีที่มาอย่างไร
* **ละทิ้งคอมเมนต์อธิบาย "โค้ดทำอะไร (What)":** ลบคอมเมนต์อธิบายไวยากรณ์พื้นฐานที่โค้ดอธิบายตัวเองได้อยู่แล้วออกไปทั้งหมด เพื่อป้องกันโค้ดรก

#### 💡 ตัวอย่างการปรับปรุง:
```diff
// ❌ แบบเดิม (รกและอธิบายสิ่งที่เห็นอยู่แล้ว)
// Backdrop
<div className="fixed inset-0 bg-slate-900..." />

//  แบบใหม่ (เหลือเฉพาะคอมเมนต์อธิบายข้อจำกัดเชิงลอจิก)
const handleVideoTimeUpdate = (e) => {
  const video = e.target;
  // จำกัดการดูวิดีโอตัวอย่างของบุคคลทั่วไปไว้ที่ 10 วินาทีแรกเท่านั้น
  if (isPublicView && video.currentTime >= 10) {
    video.pause();
    setVideoPreviewEnded(true);
  }
};
```

---

### 4. การจัดการข้อผิดพลาด (Error Handling & Edge Cases)
* **ความปลอดภัยในการรันโค้ด:** ป้องกันแอปพลิเคชันพังเมื่อระบบดึงค่าที่ว่างเปล่า (Null / Undefined) หรือข้อมูลเสียหาย
* **ฟังก์ชันช่วยป้องกัน (Safety Helpers):** การเขียนตัวช่วยจัดการเคสที่มีโอกาสพังสูง เช่น การดึงและแปลงข้อมูลประเภท JSON จาก `localStorage`

#### 💡 ตัวอย่างการปรับปรุง (Safe JSON parsing):
```javascript
// ฟังก์ชันส่วนกลางสำหรับการป้องกันการพังของแอป
const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    console.error("JSON parsing error on localStorage data:", error);
    return fallback;
  }
};

// การเรียกใช้งานใน Component State
const [users, setUsers] = useState(() => safeJsonParse(localStorage.getItem('bluefolio_users'), []));
```

---

## 🎨 มาตรฐานระบบสี (Tailwind v4 Palette Standard)

เพื่อหลีกเลี่ยง **บั๊กสีในโหมดกลางคืน (Dark Mode Color Bugs)** ห้ามใส่คลาสสีที่ไม่ได้รับการสนับสนุนใน Tailwind CSS เวอร์ชันมาตรฐานโดยเด็ดขาด 

### รหัสสีมาตรฐานที่อนุญาตให้ใช้:
* **รหัสปกติ:** `50`, `100`, `200`, `300`, `400`, `500`, `600`, `700`, `800`, `900`
* **รหัสเข้มพิเศษ (เฉพาะบางเฉด):** `950`
* เฉดสีที่แนะนำ: `slate`, `blue`, `rose`, `amber`, `emerald`

> [!WARNING]
> ห้ามใช้สีนอกเกณฑ์ (เช่น `slate-850`, `slate-955`, `rose-455`, `blue-250`) เนื่องจากคลาสเหล่านี้จะไม่มี CSS ถูกสร้างขึ้นมา และทำให้การแสดงผลบนหน้าเว็บจริงเกิดข้อผิดพลาด (Fallback เป็นโปร่งแสง หรือตัวหนังสืออ่านไม่ออกในโหมดมืด)

---

## 🔒 แนวทางความปลอดภัยและการกำหนดค่าเซิร์ฟเวอร์ (Security & Configuration Standards)

ในการเขียนโค้ดและปรับแต่งเซิร์ฟเวอร์ จะต้องยึดตามหลักความปลอดภัยดังนี้:

### 1. การควบคุมการอัปโหลดไฟล์ (File Upload Constraints)
* **การจำกัดขนาดไฟล์:** ขีดจำกัดสูงสุดในการอัปโหลดไฟล์ของเซิร์ฟเวอร์ถูกตั้งค่าไว้ที่ **500 MB** เพื่อรองรับการอัปโหลดวิดีโอ 1080p ความยาวสูงสุด 10 นาที
* **การกรองประเภทไฟล์ (Allowlist):** อนุญาตเฉพาะนามสกุลไฟล์และ MIME-type ที่ระบุในระบบเท่านั้น เพื่อป้องกันการรัน Script ที่อันตราย ได้แก่:
  * **รูปภาพ:** `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`
  * **วิดีโอ:** `.mp4`, `.webm`
  * **เอกสาร:** `.pdf`, `.zip`, `.txt`

### 2. การควบคุมทราฟฟิกและการสแปม (Rate Limiting)
* ป้องกันการโจมตีแบบ Brute-Force และการโจมตีประเภท DoS โดยการจำกัดการเรียกใช้งาน API ผ่าน `express-rate-limit` ดังนี้:
  * **เส้นทาง API ทั่วไป (`/api/`):** จำกัดที่ 100 ครั้งต่อ 15 นาทีต่อ IP
  * **เส้นทางลงทะเบียนและล็อกอิน (`/api/auth/login`, `/api/auth/register`):** จำกัดที่ 10 ครั้งต่อ 15 นาทีต่อ IP

### 3. การจัดการคีย์ลับระบบ (Secrets Management)
* **JWT_SECRET:** ห้ามเปิดใช้งานระบบบนโหมด Production หากไม่ได้กำหนดตัวแปรสภาพแวดล้อม `JWT_SECRET` ในเครื่องเซิร์ฟเวอร์ปลายทาง

---

## 📝 รายการตรวจสอบก่อนส่งงาน (Pull Request Checklist)
- [ ] ตัวแปรและฟังก์ชันเป็น `camelCase` สื่อความหมายครบถ้วนหรือไม่?
- [ ] มี nested `if-else` ซ้อนกันเกิน 3 ชั้นหรือไม่? (ถ้ามี ให้เปลี่ยนมาใช้ Early Return)
- [ ] ลบคอมเมนต์อธิบาย tag HTML/JSX หรือคำสั่ง React เบื้องต้นออกหมดหรือยัง?
- [ ] การแปลงค่า JSON และการเข้าถึง API มีการดักจับข้อผิดพลาด (try-catch หรือ helper) หรือไม่?
- [ ] ตรวจสอบแล้วใช่ไหมว่าไม่มีคลาสสีแปลกๆ ที่ Tailwind ไม่รู้จัก?
- [ ] ตรวจสอบแล้วใช่ไหมว่าการอัปโหลดไฟล์และการยิง API ปฏิบัติตามเกณฑ์ความปลอดภัยด้านบน?
- [ ] รันคำสั่ง `npm run build` ตรวจสอบความถูกต้องผ่าน 100% หรือไม่?
