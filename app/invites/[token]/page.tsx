"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGroup } from "@/lib/group-context";

export default function AcceptInvitePage() {
  const params = useParams();
  const token = params?.token as string;
  const router = useRouter();
  const { group, addMember } = useGroup();

  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("กรุณากรอกชื่อของคุณ");
      return;
    }

    if (!/^\d{4,12}$/.test(pin)) {
      setError("PIN ต้องเป็นตัวเลขระหว่าง 4 ถึง 12 หลัก");
      return;
    }

    if (pin !== confirmPin) {
      setError("PIN ยืนยันไม่ตรงกัน");
      return;
    }

    // เพิ่มสมาชิกเข้ากลุ่มและตั้ง PIN
    addMember(name.trim(), "member");
    setSuccess(true);

    setTimeout(() => {
      router.push("/");
    }, 2000);
  };

  return (
    <main className="shell">
      <div style={{ maxWidth: "480px", margin: "40px auto" }} className="card">
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div className="brand" style={{ justifyContent: "center", fontSize: "28px" }}>
            หาร<i>กัน</i>
          </div>
          <h2 style={{ margin: "14px 0 6px" }}>คำเชิญเข้าร่วมกลุ่ม</h2>
          <p style={{ color: "#666", fontSize: "14px", margin: 0 }}>
            คุณได้รับคำเชิญให้เข้าร่วมกลุ่ม <strong>{group.name}</strong>
          </p>
        </div>

        {success ? (
          <div className="notice" style={{ textAlign: "center", padding: "20px" }}>
            🎉 <strong>ยินดีต้อนรับสู่กลุ่ม!</strong>
            <p style={{ margin: "6px 0 0", fontSize: "13px" }}>
              ระบบได้บันทึกชื่อและ PIN ของคุณเรียบร้อยแล้ว กำลังนำคุณเข้าสู่หน้าภาพรวม...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="field">
              ชื่อของคุณที่ต้องการให้แสดงในกลุ่ม
              <input
                type="text"
                placeholder="เช่น สมชาย, นิว"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="field">
              ตั้งรหัส PIN ส่วนตัว (ตัวเลข 4–12 หลัก)
              <input
                type="password"
                inputMode="numeric"
                maxLength={12}
                placeholder="เช่น 1234"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                required
              />
              <small style={{ color: "#666", display: "block", marginTop: "4px" }}>
                PIN จะถูกแฮชอย่างปลอดภัย สำหรับใช้ยืนยันการทำธุรกรรมสำคัญ
              </small>
            </label>

            <label className="field">
              ยืนยันรหัส PIN อีกครั้ง
              <input
                type="password"
                inputMode="numeric"
                maxLength={12}
                placeholder="ยืนยัน PIN เดียวกัน"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                required
              />
            </label>

            {error && (
              <div
                style={{
                  background: "#fdf2f2",
                  color: "#c0392b",
                  border: "1px solid #f9d2d2",
                  borderRadius: "8px",
                  padding: "10px",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                {error}
              </div>
            )}

            <button type="submit" className="primary full-btn" style={{ marginTop: "16px" }}>
              ยอมรับคำเชิญและเข้ากลุ่ม
            </button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <Link href="/" className="link">
                กลับหน้าหลัก
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
