"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RoomsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <main className="shell">
      <div style={{ textAlign: "center", padding: "80px 20px", color: "var(--text-muted, #6a766e)" }}>
        กำลังนำทางไปที่หน้าหลัก...
      </div>
    </main>
  );
}
