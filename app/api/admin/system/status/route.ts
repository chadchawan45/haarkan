import { NextRequest, NextResponse } from "next/server";
import os from "os";
import fs from "fs";
import path from "path";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getAllSharedData } from "@/lib/shared-groups-store";

export async function GET(request: NextRequest) {
  const auth = requireAdminAuth(request, "monitoring.read");
  if ("errorResponse" in auth) {
    return auth.errorResponse;
  }

  try {
    const memory = process.memoryUsage();
    const uptimeSeconds = process.uptime();

    // Check store file health
    const dataDir = path.join(process.cwd(), "data");
    const storeFile = path.join(dataDir, "shared_groups_store.json");
    const isStoreAccessible = fs.existsSync(storeFile);
    let storeSizeBytes = 0;
    if (isStoreAccessible) {
      const stats = fs.statSync(storeFile);
      storeSizeBytes = stats.size;
    }

    // Check Supabase connection status
    const hasSupabaseConfig = !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const store = getAllSharedData();

    return NextResponse.json({
      success: true,
      health: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(uptimeSeconds),
        uptimeHuman: formatUptime(uptimeSeconds),
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
        platform: `${os.platform()} (${os.arch()})`,
        memoryUsage: {
          rssMb: Math.round(memory.rss / (1024 * 1024)),
          heapUsedMb: Math.round(memory.heapUsed / (1024 * 1024)),
          heapTotalMb: Math.round(memory.heapTotal / (1024 * 1024)),
        },
        storage: {
          backend: hasSupabaseConfig ? "Supabase PostgreSQL + JSON Cache" : "Local/Serverless JSON Store",
          storeFileExists: isStoreAccessible,
          storeSizeBytes,
          totalGroups: store.groups?.length || 0,
          totalExpenses: store.expenses?.length || 0,
          totalMembers: store.members?.length || 0,
        },
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        status: "degraded",
        message: err?.message || "Health check encountered an error",
      },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d} วัน`);
  if (h > 0) parts.push(`${h} ชม.`);
  if (m > 0) parts.push(`${m} นาที`);
  parts.push(`${s} วินาที`);
  return parts.join(" ");
}
