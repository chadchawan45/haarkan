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
  members?: any[];
  expenses?: any[];
  payments?: any[];
}

interface StoreData {
  groups: SharedGroupData[];
  expenses: any[];
  payments: any[];
  members: any[];
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
}): StoreData {
  const store = readStore();

  if (payload.groups && Array.isArray(payload.groups)) {
    for (const g of payload.groups) {
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
