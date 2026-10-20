"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page since Admin Portal has been decommissioned
    router.replace("/");
  }, [router]);

  return null;
}
