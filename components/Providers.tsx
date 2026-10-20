"use client";

import React from "react";
import { GroupProvider } from "@/lib/group-context";
import { ThemeProvider } from "@/lib/theme-context";
import { DemoLockModal } from "@/components/DemoLockModal";
import { CursorAura } from "@/components/CursorAura";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <GroupProvider>
        <CursorAura />
        {children}
        <MobileBottomNav />
        <DemoLockModal />
      </GroupProvider>
    </ThemeProvider>
  );
}
