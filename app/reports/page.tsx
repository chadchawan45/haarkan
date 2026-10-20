import { redirect } from "next/navigation";

export default function ReportsPage() {
  // นำทางกลับหน้าภาพรวมหลักเพื่อความเรียบง่ายและไม่ซับซ้อนตามที่ผู้ใช้ต้องการ
  redirect("/");
}
