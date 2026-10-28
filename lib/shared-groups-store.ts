import fs from "fs";
import path from "path";
import os from "os";

export interface SharedGroupData {
  id: string;
  name: string;
  description: string;
  weekStartsOn: number;
  defaultCurrency: string;
  creatorMemberId?: string;
  code: string;
  bannerGradient?: string;
  createdAt?: string;
  memberIds?: string[];
  members?: any[];
  expenses?: any[];
  payments?: any[];
}
export interface SystemAuditLogItem {
  id: string;
  actorId?: string;
  actorName: string;
  actorEmail?: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  status: "success" | "failure" | "denied";
  createdAt: string;
}

export interface SiteSettingsData {
  siteName: string;
  tagline: string;
  contactEmail: string;
  maintenanceMode: boolean;
  announcement?: {
    active: boolean;
    title: string;
    content: string;
    type: "info" | "warning" | "alert";
  };
}

interface StoreData {
  groups: SharedGroupData[];
  expenses: any[];
  payments: any[];
  members: any[];
  systemAuditLogs?: SystemAuditLogItem[];
  siteSettings?: SiteSettingsData;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_FILE = path.join(DATA_DIR, "shared_groups_store.json");
const TMP_STORE_FILE = path.join(os.tmpdir(), "shared_groups_store.json");

const SEED_GROUPS: SharedGroupData[] = [
  {
    id: "group-1",
    name: "บ้านสุขใจ",
    description: "กลุ่มแชร์ค่าใช้จ่ายในบ้านและทริปส่วนกลาง",
    weekStartsOn: 1,
    defaultCurrency: "THB",
    creatorMemberId: "mem-golf",
    code: "HA8K29",
    bannerGradient: "linear-gradient(135deg, #1f6f53 0%, #154c39 100%)",
    createdAt: new Date().toISOString(),
    members: [],
    expenses: [],
    payments: [],
  },
  {
    id: "group-2",
    name: "ทริปเที่ยวญี่ปุ่น 2026",
    description: "หารค่าที่พัก ค่าตั๋วรถไฟ และค่ากินตลอดทริป",
    weekStartsOn: 1,
    defaultCurrency: "THB",
    creatorMemberId: "mem-golf",
    code: "JP2026",
    bannerGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    createdAt: new Date().toISOString(),
    members: [],
    expenses: [],
    payments: [],
  },
];

// ใช้ in-memory global variable ร่วมด้วย เพื่อให้คงอยู่ข้าม request ใน serverless container เดียวกัน
declare global {
  // eslint-disable-next-line no-var
  var __sharedGroupsStore: StoreData | undefined;
}

function readStore(): StoreData {
  // 1. ถ้ามีข้อมูลในหน่วยความจำ ให้ใช้เป็นหลัก
  if (globalThis.__sharedGroupsStore && globalThis.__sharedGroupsStore.groups.length > 0) {
    return globalThis.__sharedGroupsStore;
  }

  // 2. ลองอ่านจาก STORE_FILE ในโฟลเดอร์ data/
  try {
    if (fs.existsSync(STORE_FILE)) {
      const raw = fs.readFileSync(STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.groups)) {
        globalThis.__sharedGroupsStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    // continue fallback
  }

  // 3. ลองอ่านจาก TMP_STORE_FILE ใน tmpdir (กรณี serverless/Vercel)
  try {
    if (fs.existsSync(TMP_STORE_FILE)) {
      const raw = fs.readFileSync(TMP_STORE_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.groups)) {
        globalThis.__sharedGroupsStore = parsed;
        return parsed;
      }
    }
  } catch (err) {
    // continue fallback
  }

  // 4. สร้างค่าเริ่มต้น SEED
  const initial: StoreData = {
    groups: SEED_GROUPS,
    expenses: [],
    payments: [],
    members: [],
    systemAuditLogs: [
      {
        id: "log-init",
        actorName: "System",
        action: "system.init",
        targetType: "system",
        details: { message: "System initialized successfully" },
        status: "success",
        createdAt: new Date().toISOString(),
      },
    ],
    siteSettings: {
      siteName: "หารกัน (HaarKan)",
      tagline: "ระบบจัดการแชร์ค่าใช้จ่ายและเคลียร์เงินในกลุ่ม",
      contactEmail: "golf2545mc@gmail.com",
      maintenanceMode: false,
      announcement: {
        active: false,
        title: "",
        content: "",
        type: "info",
      },
    },
    lastUpdated: new Date().toISOString(),
  };

  globalThis.__sharedGroupsStore = initial;
  writeStore(initial);
  return initial;
}

function writeStore(data: StoreData): void {
  data.lastUpdated = new Date().toISOString();
  globalThis.__sharedGroupsStore = data;

  // ลองเขียนลง data/
  let written = false;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    written = true;
  } catch (err) {
    // data/ อาจเป็น Read-only ใน serverless (เช่น Vercel)
  }

  // หากเขียนลง data/ ไม่ได้ หรือเพื่อความปลอดภัย ให้เขียนลง os.tmpdir() ด้วย
  try {
    fs.writeFileSync(TMP_STORE_FILE, JSON.stringify(data, null, 2), "utf-8");
    written = true;
  } catch (err) {
    // tmpdir write error
  }

  if (!written) {
    console.warn("Could not write store to disk, persisting in memory only");
  }
}

export function getAllSharedGroups(): SharedGroupData[] {
  const store = readStore();
  return store.groups;
}

export function getAllSharedData(): StoreData {
  return readStore();
}

export function findGroupByCode(code: string): {
  group: SharedGroupData | undefined;
  expenses: any[];
  payments: any[];
  members: any[];
} {
  const clean = code.trim().toUpperCase();
  const store = readStore();
  const group = store.groups.find((g) => g.code?.toUpperCase() === clean);
  if (!group) {
    return { group: undefined, expenses: [], payments: [], members: [] };
  }
  const expenses = (store.expenses || []).filter((e) => !e.groupId || e.groupId === group.id);
  const payments = (store.payments || []).filter((p) => !p.groupId || p.groupId === group.id);
  return {
    group,
    expenses,
    payments,
    members: store.members || [],
  };
}

export function syncClientData(payload: {
  groups?: SharedGroupData[];
  expenses?: any[];
  payments?: any[];
  members?: any[];
  deletedMemberId?: string;
  deletedGroupId?: string;
  groupId?: string;
}): StoreData {
  const store = readStore();

  // จัดการการลบกลุ่มออกจาก store
  if (payload.deletedGroupId) {
    store.groups = (store.groups || []).filter((g) => g.id !== payload.deletedGroupId);
    store.expenses = (store.expenses || []).filter((e: any) => e.groupId !== payload.deletedGroupId);
    store.payments = (store.payments || []).filter((p: any) => p.groupId !== payload.deletedGroupId);
  }

  // จัดการการลบสมาชิกออกจากกลุ่มและ store
  if (payload.deletedMemberId) {
    if (payload.groupId) {
      const g = store.groups.find((grp) => grp.id === payload.groupId);
      if (g) {
        if (g.memberIds) {
          g.memberIds = g.memberIds.filter((id: string) => id !== payload.deletedMemberId);
        }
        if (g.members) {
          g.members = g.members.filter((m: any) => m.id !== payload.deletedMemberId);
        }
      }
    }
    store.members = (store.members || []).filter((m) => m.id !== payload.deletedMemberId);
  }

  if (payload.groups && Array.isArray(payload.groups)) {
    for (const g of payload.groups) {
      if (payload.deletedGroupId && g.id === payload.deletedGroupId) continue;
      const idx = store.groups.findIndex((existing) => existing.id === g.id || (existing.code && existing.code.toUpperCase() === g.code?.toUpperCase()));
      if (idx >= 0) {
        store.groups[idx] = { ...store.groups[idx], ...g };
      } else {
        store.groups.push(g);
      }
    }
  }

  if (payload.expenses && Array.isArray(payload.expenses)) {
    const existingIds = new Set((store.expenses || []).map((e) => e.id));
    for (const exp of payload.expenses) {
      if (existingIds.has(exp.id)) {
        const idx = store.expenses.findIndex((e) => e.id === exp.id);
        if (idx >= 0) store.expenses[idx] = exp;
      } else {
        store.expenses.push(exp);
      }
    }
  }

  if (payload.payments && Array.isArray(payload.payments)) {
    const existingIds = new Set((store.payments || []).map((p) => p.id));
    for (const pay of payload.payments) {
      if (existingIds.has(pay.id)) {
        const idx = store.payments.findIndex((p) => p.id === pay.id);
        if (idx >= 0) store.payments[idx] = pay;
      } else {
        store.payments.push(pay);
      }
    }
  }

  if (payload.members && Array.isArray(payload.members)) {
    const existingIds = new Set((store.members || []).map((m) => m.id));
    for (const mem of payload.members) {
      if (existingIds.has(mem.id)) {
        const idx = store.members.findIndex((m) => m.id === mem.id);
        if (idx >= 0) store.members[idx] = { ...store.members[idx], ...mem };
      } else {
        store.members.push(mem);
      }

      // ซิงค์ข้อมูลธนาคารและพร้อมเพย์ไปยัง g.members ในทุกกลุ่มด้วย
      for (const grp of store.groups) {
        if (Array.isArray(grp.members)) {
          const mIdx = grp.members.findIndex((m: any) => m.id === mem.id);
          if (mIdx >= 0) {
            grp.members[mIdx] = { ...grp.members[mIdx], ...mem };
          }
        }
      }
    }
  }

  writeStore(store);
  return store;
}

export function joinGroupByCodeOnServer(code: string, member?: any): {
  success: boolean;
  message: string;
  group?: SharedGroupData;
  expenses?: any[];
  payments?: any[];
  members?: any[];
} {
  const clean = code.trim().toUpperCase();
  const store = readStore();
  const group = store.groups.find((g) => g.code?.toUpperCase() === clean);

  if (!group) {
    return {
      success: false,
      message: `ไม่พบกลุ่มที่ตรงกับรหัส "${clean}" กรุณาตรวจสอบรหัส 6 หลักจากผู้สร้างกลุ่มอีกครั้ง`,
    };
  }

  // เพิ่มสมาชิกหากระบุมา
  if (member && member.id) {
    const memberIdx = store.members.findIndex((m) => m.id === member.id);
    if (memberIdx >= 0) {
      store.members[memberIdx] = { ...store.members[memberIdx], ...member, status: "active" };
    } else {
      store.members.push({ ...member, status: "active" });
    }

    if (!group.members) {
      group.members = [];
    }
    const gMemIdx = group.members.findIndex((m: any) => m.id === member.id);
    if (gMemIdx >= 0) {
      group.members[gMemIdx] = { ...group.members[gMemIdx], ...member, status: "active" };
    } else {
      group.members.push({ ...member, status: "active" });
    }

    const groupIdx = store.groups.findIndex((g) => g.id === group.id);
    if (groupIdx >= 0) {
      store.groups[groupIdx] = group;
    }

    writeStore(store);
  }

  const expenses = (store.expenses || []).filter((e) => !e.groupId || e.groupId === group.id);
  const payments = (store.payments || []).filter((p) => !p.groupId || p.groupId === group.id);

  return {
    success: true,
    message: `เข้าร่วมกลุ่ม "${group.name}" สำเร็จ!`,
    group,
    expenses,
    payments,
    members: store.members,
  };
}

// ==========================================
// ADMIN DASHBOARD HELPER FUNCTIONS
// ==========================================

export function addSystemAuditLog(
  log: Omit<SystemAuditLogItem, "id" | "createdAt">
): SystemAuditLogItem {
  const store = readStore();
  if (!store.systemAuditLogs) store.systemAuditLogs = [];

  const newLog: SystemAuditLogItem = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  store.systemAuditLogs.unshift(newLog);
  // Cap at 1,000 logs to prevent unbounded file growth
  if (store.systemAuditLogs.length > 1000) {
    store.systemAuditLogs = store.systemAuditLogs.slice(0, 1000);
  }

  writeStore(store);
  return newLog;
}

export function getSystemAuditLogs(limit = 100): SystemAuditLogItem[] {
  const store = readStore();
  return (store.systemAuditLogs || []).slice(0, limit);
}

export function getSiteSettings(): SiteSettingsData {
  const store = readStore();
  return (
    store.siteSettings || {
      siteName: "หารกัน (HaarKan)",
      tagline: "ระบบจัดการแชร์ค่าใช้จ่ายและเคลียร์เงินในกลุ่ม",
      contactEmail: "golf2545mc@gmail.com",
      maintenanceMode: false,
      announcement: {
        active: false,
        title: "",
        content: "",
        type: "info",
      },
    }
  );
}

export function updateSiteSettings(updates: Partial<SiteSettingsData>): SiteSettingsData {
  const store = readStore();
  const current = getSiteSettings();
  const updated: SiteSettingsData = {
    ...current,
    ...updates,
    announcement: updates.announcement ? { ...current.announcement, ...updates.announcement } : current.announcement,
  };
  store.siteSettings = updated;
  writeStore(store);
  return updated;
}

export function getAllUsersForAdmin(): any[] {
  const store = readStore();
  const members = store.members || [];
  const groups = store.groups || [];
  const expenses = store.expenses || [];

  return members.map((m) => {
    // Determine system role
    let systemRole = m.systemRole;
    if (!systemRole) {
      if (m.id === "mem-golf" || m.email?.toLowerCase() === "golf2545mc@gmail.com") {
        systemRole = "super_admin";
      } else {
        systemRole = "member";
      }
    }

    // Calculate user's group involvement
    const userGroups = groups.filter((g) => {
      if (g.creatorMemberId === m.id) return true;
      if (Array.isArray(g.memberIds) && g.memberIds.includes(m.id)) return true;
      if (Array.isArray(g.members) && g.members.some((gm: any) => gm.id === m.id)) return true;
      return false;
    });

    // Calculate total expenses paid
    const userExpenses = expenses.filter((e) => e.createdByMemberId === m.id);
    const totalSpentSatang = userExpenses.reduce((sum, e) => sum + (e.totalAmountSatang || 0), 0);

    return {
      id: m.id,
      name: m.name,
      nickname: m.nickname,
      email: m.email || null,
      phone: m.phone || null,
      systemRole,
      status: m.status || "active",
      avatarColor: m.avatarColor || "#1f6f53",
      avatarUrl: m.avatarUrl || null,
      bankName: m.bankName || null,
      bankAccountNumber: m.bankAccountNumber || null,
      promptpayNumber: m.promptpayNumber || null,
      groupsCount: userGroups.length,
      expensesCount: userExpenses.length,
      totalSpentSatang,
      createdAt: m.createdAt || "2026-01-01T00:00:00.000Z",
    };
  });
}

export function updateUserByAdmin(
  userId: string,
  updates: {
    systemRole?: string;
    status?: string;
    name?: string;
    email?: string;
    phone?: string;
  }
): { success: boolean; message: string; user?: any } {
  const store = readStore();
  const idx = (store.members || []).findIndex((m) => m.id === userId);
  if (idx < 0) {
    return { success: false, message: "ไม่พบผู้ใช้ที่ระบุ" };
  }

  const current = store.members[idx];

  // Prevent demoting golf2545mc if they are the primary super admin
  if (
    (current.id === "mem-golf" || current.email?.toLowerCase() === "golf2545mc@gmail.com") &&
    updates.systemRole &&
    updates.systemRole !== "super_admin"
  ) {
    return { success: false, message: "ไม่สามารถลดระดับสิทธิ์ของ Super Admin หลักได้" };
  }

  const updatedUser = {
    ...current,
    ...updates,
  };

  store.members[idx] = updatedUser;

  // Also sync in groups
  for (const g of store.groups || []) {
    if (Array.isArray(g.members)) {
      const gIdx = g.members.findIndex((gm: any) => gm.id === userId);
      if (gIdx >= 0) {
        g.members[gIdx] = { ...g.members[gIdx], ...updates };
      }
    }
  }

  writeStore(store);
  return { success: true, message: "อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว", user: updatedUser };
}

export function deleteGroupByAdmin(
  groupId: string,
  reason?: string
): { success: boolean; message: string } {
  const store = readStore();
  const grpIdx = (store.groups || []).findIndex((g) => g.id === groupId);
  if (grpIdx < 0) {
    return { success: false, message: "ไม่พบกลุ่มที่ต้องการลบ" };
  }

  const targetGroup = store.groups[grpIdx];
  store.groups.splice(grpIdx, 1);
  store.expenses = (store.expenses || []).filter((e) => e.groupId !== groupId);
  store.payments = (store.payments || []).filter((p) => p.groupId !== groupId);

  writeStore(store);
  return {
    success: true,
    message: `ลบกลุ่ม "${targetGroup.name}" สำเร็จ${reason ? ` (เหตุผล: ${reason})` : ""}`,
  };
}

export function getAdminOverviewStats(): {
  totalMembers: number;
  activeMembers: number;
  suspendedMembers: number;
  totalGroups: number;
  totalExpenses: number;
  totalExpenseAmountSatang: number;
  totalPayments: number;
  totalConfirmedPaymentAmountSatang: number;
  recentExpenses: any[];
  recentAuditLogs: SystemAuditLogItem[];
  recentMembers: any[];
} {
  const store = readStore();
  const members = store.members || [];
  const groups = store.groups || [];
  const expenses = store.expenses || [];
  const payments = store.payments || [];

  const activeMembers = members.filter((m) => m.status !== "suspended" && m.status !== "removed").length;
  const suspendedMembers = members.filter((m) => m.status === "suspended").length;

  const totalExpenseAmountSatang = expenses.reduce((sum, e) => sum + (e.totalAmountSatang || 0), 0);
  const confirmedPayments = payments.filter((p) => p.status === "confirmed");
  const totalConfirmedPaymentAmountSatang = confirmedPayments.reduce(
    (sum, p) => sum + (p.amountSatang || 0),
    0
  );

  const recentExpenses = [...expenses]
    .sort((a, b) => new Date(b.createdAt || b.expenseDate).getTime() - new Date(a.createdAt || a.expenseDate).getTime())
    .slice(0, 6);

  const recentMembers = [...members]
    .slice(-6)
    .reverse()
    .map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email || m.phone || "ไม่ระบุ",
      systemRole: m.systemRole || (m.id === "mem-golf" ? "super_admin" : "member"),
      status: m.status || "active",
      createdAt: m.createdAt || "2026-01-01T00:00:00.000Z",
    }));

  return {
    totalMembers: members.length,
    activeMembers,
    suspendedMembers,
    totalGroups: groups.length,
    totalExpenses: expenses.length,
    totalExpenseAmountSatang,
    totalPayments: payments.length,
    totalConfirmedPaymentAmountSatang,
    recentExpenses,
    recentAuditLogs: (store.systemAuditLogs || []).slice(0, 8),
    recentMembers,
  };
}
