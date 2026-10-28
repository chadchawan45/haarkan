"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useRef } from "react";
import { formatTHB, parseTHB, equalSplit, customSplit, weightedSplit } from "@/lib/money";
import { balances, directSettlements, optimizedSettlements, type Settlement } from "@/lib/settlements";
import { startOfWeek, endOfWeek } from "@/lib/periods";

export type Role = "admin" | "member";
export type MemberStatus = "active" | "inactive" | "removed";
export type SplitMode = "equal" | "custom" | "weighted";
export type ExpenseStatus = "active" | "voided";
export type PaymentStatus = "pending_proof" | "submitted" | "confirmed" | "rejected" | "cancelled";

export interface Member {
  id: string;
  name: string;
  nickname?: string;
  role: Role;
  status: MemberStatus;
  avatarColor: string;
  avatarUrl?: string;
  email?: string;
  bankName?: string;
  bankAccountNumber?: string;
  promptpayNumber?: string;
  qrCodeUrl?: string;
  password?: string;
}

export interface ExpenseRecord {
  id: string;
  groupId?: string;
  title: string;
  expenseDate: string;
  totalAmountSatang: number;
  categoryId: string;
  categoryName: string;
  splitMode: SplitMode;
  note?: string;
  status: ExpenseStatus;
  voidReason?: string;
  createdByMemberId: string;
  createdAt: string;
  payers: { memberId: string; amountSatang: number }[];
  shares: { memberId: string; amountSatang: number; weight?: number }[];
}

export interface PaymentProof {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
}

export interface PaymentRecord {
  id: string;
  groupId?: string;
  fromMemberId: string;
  toMemberId: string;
  amountSatang: number;
  paymentDate: string;
  status: PaymentStatus;
  settlementMode: "direct" | "optimized" | "manual";
  proof?: PaymentProof;
  rejectionReason?: string;
  createdAt: string;
  confirmedAt?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface GroupSettings {
  id: string;
  name: string;
  description: string;
  weekStartsOn: number; // 0=Sunday, 1=Monday
  defaultCurrency: string;
  creatorMemberId?: string;
  memberIds?: string[];
  members?: any[];
  code: string; // รหัสกลุ่ม 6 ตัวอักษร เช่น HA8K29
  bannerGradient?: string;
  createdAt?: string;
}

export function generateRoomCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const generateGroupCode = generateRoomCode;

export const CLASSROOM_GRADIENTS = [
  "linear-gradient(135deg, #1f6f53 0%, #154c39 100%)", // เขียวมรกต
  "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", // น้ำเงิน
  "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)", // ม่วง
  "linear-gradient(135deg, #d97706 0%, #b45309 100%)", // ส้มอำพัน
  "linear-gradient(135deg, #0d9488 0%, #0f766e 100%)", // เขียวทีล
  "linear-gradient(135deg, #e11d48 0%, #be123c 100%)", // แดงกุหลาบ
];

export const initialGroups: GroupSettings[] = [
  {
    id: "group-1",
    name: "บ้านสุขใจ",
    description: "กลุ่มแชร์ค่าใช้จ่ายในบ้านและทริปส่วนกลาง",
    weekStartsOn: 1,
    defaultCurrency: "THB",
    creatorMemberId: "mem-golf",
    memberIds: ["mem-golf", "mem-karn"],
    code: "HA8K29",
    bannerGradient: "linear-gradient(135deg, #1f6f53 0%, #154c39 100%)",
    createdAt: new Date().toISOString(),
  },
  {
    id: "group-2",
    name: "ทริปเที่ยวญี่ปุ่น 2026",
    description: "หารค่าที่พัก ค่าตั๋วรถไฟ และค่ากินตลอดทริป",
    weekStartsOn: 1,
    defaultCurrency: "THB",
    creatorMemberId: "mem-golf",
    memberIds: ["mem-golf", "mem-karn"],
    code: "JP2026",
    bannerGradient: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    createdAt: new Date().toISOString(),
  },
];

const STORAGE_KEY = "group_expense_app_state_v3";

const initialMembers: Member[] = [
  {
    id: "mem-golf",
    name: "ชัชวาลย์",
    nickname: "กอล์ฟ",
    role: "admin",
    status: "active",
    avatarColor: "#1f6f53",
    email: "golf2545mc@gmail.com",
    bankName: "กสิกรไทย (KBANK)",
    bankAccountNumber: "012-3-45678-9",
    promptpayNumber: "081-234-5678",
  },
  {
    id: "mem-karn",
    name: "กานต์",
    nickname: "กานต์",
    role: "admin",
    status: "active",
    avatarColor: "#2980b9",
    email: "karn@haarkan.local",
    bankName: "กสิกรไทย (KBANK)",
    bankAccountNumber: "012-3-45678-9",
    promptpayNumber: "081-234-5678",
  },
  {
    id: "mem-0928919213",
    name: "0928919213t",
    nickname: "0928919213t",
    role: "member",
    status: "active",
    avatarColor: "#e67e22",
    email: "0928919213t@gmail.com",
    promptpayNumber: "092-891-9213",
  },
];

// เริ่มต้นเป็นยอด 0 บาท ไม่มีรายการค้าง
const initialExpenses: ExpenseRecord[] = [];
const initialPayments: PaymentRecord[] = [];
const initialNotifications: NotificationItem[] = [];


interface GroupContextType {
  group: GroupSettings;
  members: Member[];
  allMembers: Member[];
  expenses: ExpenseRecord[];
  payments: PaymentRecord[];
  notifications: NotificationItem[];
  currentMemberId: string;
  currentMember: Member;
  isAdmin: boolean;
  isGroupCreator: boolean;
  groupCreator?: Member;
  activeMembers: Member[];

  // Financial Computations
  netBalances: Map<string, number>;
  myNetBalanceSatang: number;
  myOwedSatang: number; // ยอดที่คุณต้องชำระ (บวก)
  myDueSatang: number; // ยอดที่คุณควรได้รับ (บวก)
  directSettlementList: Settlement[];
  optimizedSettlementList: Settlement[];
  unreadNotificationCount: number;

  // Authentication & Demo Mode
  isAuthenticated: boolean;
  isDemo: boolean;
  demoLockModal: { isOpen: boolean; featureName: string };
  triggerDemoLock: (featureName: string) => void;
  closeDemoLock: () => void;
  login: (memberId: string) => boolean;
  loginWithGoogle: (googleUser: { name: string; email: string; avatarUrl?: string }) => Member;
  logout: () => void;
  demoLogin: () => void;

  // Actions
  setCurrentMemberId: (id: string) => void;
  updateGroupSettings: (settings: Partial<GroupSettings>) => void;
  addExpense: (expense: Omit<ExpenseRecord, "id" | "createdAt" | "status" | "createdByMemberId">) => string;
  voidExpense: (expenseId: string, reason: string) => void;
  createPayment: (fromId: string, toId: string, amountSatang: number, mode: "direct" | "optimized" | "manual") => string;
  uploadProofAndSubmit: (paymentId: string, filename: string, url: string) => void;
  confirmPayment: (paymentId: string) => void;
  rejectPayment: (paymentId: string, reason: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addMember: (name: string, role?: Role) => void;
  registerMember: (data: {
    name: string;
    nickname?: string;
    email?: string;
    password?: string;
    bankName?: string;
    bankAccountNumber?: string;
    promptpayNumber?: string;
    qrCodeUrl?: string;
    avatarUrl?: string;
    avatarColor?: string;
    role?: Role;
  }) => Member;
  findMemberByIdentifier: (identifier: string) => Member | undefined;
  resetPassword: (identifier: string, newPassword: string) => { success: boolean; message: string; member?: Member };
  updateProfile: (memberId: string, updates: Partial<Omit<Member, "id">>) => void;
  toggleMemberRole: (memberId: string) => void;
  toggleMemberStatus: (memberId: string) => void;
  removeMember: (memberId: string) => void;
  clearDummyMembers: () => void;
  resetToDefaultData: () => void;
  createGroup: (data: { name: string; description?: string; weekStartsOn?: number; code?: string }) => GroupSettings;
  deleteGroup: (groupId: string) => { success: boolean; message: string };
  groups: GroupSettings[];
  hasGroup: boolean;
  switchGroup: (groupId: string) => void;
  joinGroupByCode: (code: string) => Promise<{ success: boolean; message: string; group?: GroupSettings }>;
  joinModalOpen: boolean;
  setJoinModalOpen: (open: boolean) => void;
}

const GroupContext = createContext<GroupContextType | null>(null);

export function GroupProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<GroupSettings[]>(initialGroups);
  const [currentGroupId, setCurrentGroupId] = useState<string>("group-1");
  const [joinModalOpen, setJoinModalOpen] = useState<boolean>(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [currentMemberId, setCurrentMemberId] = useState<string>("mem-golf");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const deletedGroupIdsRef = useRef<Set<string>>(new Set());

  // กรองเฉพาะกลุ่มที่ผู้ใช้คนปัจจุบันเป็นผู้สร้าง หรือเป็นสมาชิกในกลุ่ม
  const userGroups = useMemo(() => {
    if (!isAuthenticated) return groups;
    if (isDemo) return groups;
    return groups.filter((g) => {
      if (g.creatorMemberId === currentMemberId) return true;
      if (Array.isArray(g.memberIds) && g.memberIds.includes(currentMemberId)) return true;
      if (Array.isArray(g.members) && g.members.some((m: any) => m.id === currentMemberId)) return true;
      if (currentMemberId === "mem-golf") return true;
      return false;
    });
  }, [groups, currentMemberId, isAuthenticated, isDemo]);

  const hasGroup = userGroups.length > 0;

  const group = useMemo(
    () => userGroups.find((g) => g.id === currentGroupId) || userGroups[0] || initialGroups[0],
    [userGroups, currentGroupId]
  );

  const setGroup = (updater: GroupSettings | ((prev: GroupSettings) => GroupSettings)) => {
    setGroups((prev) => {
      const current = prev.find((g) => g.id === currentGroupId) || prev[0] || initialGroups[0];
      const nextGroup = typeof updater === "function" ? updater(current) : updater;
      const idx = prev.findIndex((g) => g.id === nextGroup.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = nextGroup;
        return updated;
      }
      return [...prev, nextGroup];
    });
    if (typeof updater !== "function") {
      setCurrentGroupId(updater.id);
    }
  };
  const [demoLockModal, setDemoLockModal] = useState<{ isOpen: boolean; featureName: string }>({
    isOpen: false,
    featureName: "",
  });

  const triggerDemoLock = (featureName: string) => {
    setDemoLockModal({ isOpen: true, featureName });
  };

  const closeDemoLock = () => {
    setDemoLockModal({ isOpen: false, featureName: "" });
  };

  // Load from localStorage on mount (เริ่มต้นรีเซ็ตข้อมูลเก่าให้เป็น 0 บาท)
  useEffect(() => {
    try {
      // ลบคีย์เวอร์ชันเดิมเพื่อเคลียร์ข้อมูลตัวอย่างที่มียอดเงินค้าง
      localStorage.removeItem("group_expense_app_state_v1");
      localStorage.removeItem("group_expense_app_state_v2");
      localStorage.removeItem("group-expense-room-demo");

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.groups && Array.isArray(parsed.groups) && parsed.groups.length > 0) {
          const sanitizedGroups = parsed.groups.map((g: GroupSettings, i: number) => ({
            ...g,
            code: g.code || (i === 0 ? "HA8K29" : generateRoomCode()),
            bannerGradient: g.bannerGradient || CLASSROOM_GRADIENTS[i % CLASSROOM_GRADIENTS.length],
          }));
          setGroups(sanitizedGroups);
          if (parsed.currentGroupId) {
            setCurrentGroupId(parsed.currentGroupId);
          } else if (parsed.group?.id) {
            setCurrentGroupId(parsed.group.id);
          }
        } else if (parsed.group) {
          setGroup({
            ...parsed.group,
            code: parsed.group.code || "HA8K29",
            bannerGradient: parsed.group.bannerGradient || CLASSROOM_GRADIENTS[0],
          });
        }
        if (parsed.members) {
          const DUMMY_IDS = ["mem-min", "mem-ton", "mem-nont", "mem-ploy", "mem-beam"];
          // กรองสมาชิกตัวอย่างออกเพื่อพร้อมใช้งานจริง และตัดข้อความ (คุณ) ซ้ำซ้อน
          let sanitizedMembers: Member[] = parsed.members
            .filter((m: Member) => !DUMMY_IDS.includes(m.id))
            .map((m: Member) => ({
              ...m,
              name: m.name.replace(/\(คุณ\)/g, "").trim(),
            }));

          // รับรองว่า golf2545mc@gmail.com จะมีอยู่ในระบบเสมอ
          const hasGolf = sanitizedMembers.some(
            (m: Member) => m.email?.toLowerCase() === "golf2545mc@gmail.com" || m.id === "mem-golf"
          );
          if (!hasGolf) {
            sanitizedMembers = [initialMembers[0], ...sanitizedMembers];
          }

          // รับรองว่า 0928919213t@gmail.com จะมีอยู่ในระบบเสมอ
          const hasSecondAccount = sanitizedMembers.some(
            (m: Member) => m.email?.toLowerCase() === "0928919213t@gmail.com" || m.id === "mem-0928919213"
          );
          if (!hasSecondAccount && initialMembers[2]) {
            sanitizedMembers = [...sanitizedMembers, initialMembers[2]];
          }

          setMembers(sanitizedMembers.length > 0 ? sanitizedMembers : initialMembers);
        }
        if (parsed.expenses) setExpenses(parsed.expenses);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.notifications) setNotifications(parsed.notifications);
        if (parsed.currentMemberId) {
          const DUMMY_IDS = ["mem-min", "mem-ton", "mem-nont", "mem-ploy", "mem-beam"];
          if (DUMMY_IDS.includes(parsed.currentMemberId)) {
            setCurrentMemberId("mem-golf");
          } else {
            setCurrentMemberId(parsed.currentMemberId);
          }
        }
        if (typeof parsed.isAuthenticated === "boolean") setIsAuthenticated(parsed.isAuthenticated);
        if (typeof parsed.isDemo === "boolean") setIsDemo(parsed.isDemo);
      }
    } catch (e) {
      console.warn("Could not read local storage state:", e);
    }

    // ฟังก์ชันซิงค์ข้อมูลทั้งหมดจากเซิร์ฟเวอร์เพื่อให้ข้อมูลอัปเดตตรงกันข้ามเครื่อง/ข้ามบัญชี
    const syncFromServer = () => {
      fetch("/api/groups/sync")
        .then((res) => res.json())
        .then((data) => {
          if (!data?.success) return;

          if (Array.isArray(data.groups)) {
            const activeServerGroups = data.groups.filter(
              (g: any) => !deletedGroupIdsRef.current.has(g.id)
            );
            setGroups((prev) => {
              const activePrev = prev.filter((g) => !deletedGroupIdsRef.current.has(g.id));
              if (activePrev.length === 0 && activeServerGroups.length === 0) {
                return [];
              }
              const map = new Map(activePrev.map((g) => [g.id, g]));
              for (const g of activeServerGroups) {
                if (map.has(g.id)) {
                  map.set(g.id, { ...map.get(g.id)!, ...g });
                } else {
                  map.set(g.id, g);
                }
              }
              return Array.from(map.values());
            });
          }

          if (Array.isArray(data.members) && data.members.length > 0) {
            setMembers((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const m of data.members) {
                map.set(m.id, { ...(map.get(m.id) || {}), ...m });
              }
              return Array.from(map.values());
            });
          }

          if (Array.isArray(data.expenses) && data.expenses.length > 0) {
            setExpenses((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const newExps = data.expenses.filter((e: ExpenseRecord) => !existingIds.has(e.id));
              return newExps.length > 0 ? [...newExps, ...prev] : prev;
            });
          }

          if (Array.isArray(data.payments) && data.payments.length > 0) {
            setPayments((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newPays = data.payments.filter((p: PaymentRecord) => !existingIds.has(p.id));
              return newPays.length > 0 ? [...newPays, ...prev] : prev;
            });
          }
        })
        .catch(() => {});
    };

    syncFromServer();
    // โพลซิงค์ทุก 4 วินาที และเมื่อสลับแท็บกลับมา เพื่อให้เห็นสมาชิกใหม่ที่เข้าร่วมห้องได้ทันที
    const interval = setInterval(syncFromServer, 4000);
    const handleVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncFromServer();
      }
    };
    window.addEventListener("focus", handleVisibility);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleVisibility);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Save to localStorage on changes (sanitize members so passwords are never stored in plaintext)
  useEffect(() => {
    try {
      const sanitizedMembers = members.map(({ password: _, ...rest }) => rest);
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          groups,
          currentGroupId,
          group,
          members: sanitizedMembers,
          expenses,
          payments,
          notifications,
          currentMemberId,
          isAuthenticated,
          isDemo,
        })
      );
    } catch (e) {
      console.warn("Could not write to local storage:", e);
    }
  }, [groups, currentGroupId, group, members, expenses, payments, notifications, currentMemberId, isAuthenticated, isDemo]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetch("/api/groups/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groups: groups.filter((g) => !deletedGroupIdsRef.current.has(g.id)),
          expenses,
          payments,
          members: members.map(({ password: _, ...rest }) => rest),
        }),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(timer);
  }, [groups, expenses, payments, members]);


  // สมาชิกเฉพาะของกลุ่มที่กำลังเปิดใช้งาน (Current Group Members)
  const currentGroupMembers = useMemo(() => {
    if (!group) return [];
    if (Array.isArray(group.memberIds) && group.memberIds.length > 0) {
      const idSet = new Set(group.memberIds);
      if (group.creatorMemberId) idSet.add(group.creatorMemberId);
      return members.filter((m) => idSet.has(m.id));
    }
    if (group.creatorMemberId) {
      const creator = members.find((m) => m.id === group.creatorMemberId);
      return creator ? [creator] : members.slice(0, 1);
    }
    return members;
  }, [group, members]);

  const currentMember = useMemo(
    () => members.find((m) => m.id === currentMemberId) ?? members[0],
    [members, currentMemberId]
  );
  const isAdmin = currentMember.role === "admin";
  const groupCreatorId = group.creatorMemberId || "mem-karn";
  const isGroupCreator = currentMemberId === groupCreatorId;
  const groupCreator = useMemo(
    () => members.find((m) => m.id === groupCreatorId),
    [members, groupCreatorId]
  );
  const activeMembers = useMemo(() => currentGroupMembers.filter((m) => m.status === "active"), [currentGroupMembers]);

  // คำนวณรายการเฉพาะกลุ่มปัจจุบัน
  const currentGroupExpenses = useMemo(
    () => expenses.filter((e) => !e.groupId || e.groupId === currentGroupId),
    [expenses, currentGroupId]
  );
  const currentGroupPayments = useMemo(
    () => payments.filter((p) => !p.groupId || p.groupId === currentGroupId),
    [payments, currentGroupId]
  );

  // คำนวณ Net Balances ด้วย lib/settlements.ts
  const netBalances = useMemo(() => {
    const domainExpenses = currentGroupExpenses.map((e) => ({
      status: e.status,
      payers: e.payers,
      shares: e.shares,
    }));
    const domainPayments = currentGroupPayments.map((p) => ({
      status: p.status,
      fromMemberId: p.fromMemberId,
      toMemberId: p.toMemberId,
      amountSatang: p.amountSatang,
    }));
    return balances(domainExpenses, domainPayments);
  }, [currentGroupExpenses, currentGroupPayments]);

  // คำนวณยอดส่วนตัว
  const myNetBalanceSatang = netBalances.get(currentMemberId) ?? 0;
  const myOwedSatang = myNetBalanceSatang < 0 ? -myNetBalanceSatang : 0;
  const myDueSatang = myNetBalanceSatang > 0 ? myNetBalanceSatang : 0;

  // คำนวณ Direct Settlements
  const directSettlementList = useMemo(() => {
    const domainExpenses = currentGroupExpenses.map((e) => ({
      status: e.status,
      payers: e.payers,
      shares: e.shares,
    }));
    return directSettlements(domainExpenses);
  }, [currentGroupExpenses]);

  // คำนวณ Optimized Settlements
  const optimizedSettlementList = useMemo(() => {
    return optimizedSettlements(netBalances);
  }, [netBalances]);

  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const updateGroupSettings = (newSettings: Partial<GroupSettings>) => {
    if (isDemo) {
      triggerDemoLock("การแก้ไขการตั้งค่ากลุ่ม");
      return;
    }
    setGroup((prev) => ({ ...prev, ...newSettings }));
  };

  const switchGroup = (groupId: string) => {
    const target = groups.find((g) => g.id === groupId);
    if (target) {
      setCurrentGroupId(target.id);
    }
  };

  const createGroup: GroupContextType["createGroup"] = (data) => {
    if (isDemo) {
      triggerDemoLock("การสร้างกลุ่มใหม่");
      return group;
    }

    const code = (data.code?.trim() || generateRoomCode()).toUpperCase();
    const newGroup: GroupSettings = {
      id: `group-${Date.now()}`,
      name: data.name.trim() || "กลุ่มของฉัน",
      description: data.description?.trim() || "",
      weekStartsOn: data.weekStartsOn ?? 1,
      defaultCurrency: "THB",
      creatorMemberId: currentMemberId,
      memberIds: [currentMemberId],
      members: [currentMember],
      code,
      bannerGradient: CLASSROOM_GRADIENTS[groups.length % CLASSROOM_GRADIENTS.length],
      createdAt: new Date().toISOString(),
    };

    // ตั้งให้ผู้สร้างกลุ่มมีสิทธิ์เป็น admin
    setMembers((prev) =>
      prev.map((m) =>
        m.id === currentMemberId ? { ...m, role: "admin" as Role } : m
      )
    );

    const updatedGroups = [...groups, newGroup];
    setGroups(updatedGroups);
    setCurrentGroupId(newGroup.id);

    // ส่งข้อมูลกลุ่มใหม่ไปยังเซิร์ฟเวอร์ทันที เพื่อให้รหัสห้องพร้อมใช้งานข้ามเครื่องทันที
    fetch("/api/groups/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groups: updatedGroups,
        expenses,
        payments,
        members: members.map(({ password: _, ...rest }) => rest),
      }),
    }).catch(() => {});

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "สร้างกลุ่มใหม่เรียบร้อยแล้ว",
        body: `คุณได้สร้างกลุ่ม "${newGroup.name}" รหัสกลุ่มสำหรับเชิญเพื่อน: ${newGroup.code}`,
        type: "group_created",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/",
      },
      ...prev,
    ]);

    return newGroup;
  };

  const joinGroupByCode = async (inputCode: string) => {
    const clean = (inputCode || "").trim().toUpperCase();
    if (!clean || clean.length < 3) {
      return { success: false, message: "กรุณาระบุรหัสกลุ่มที่ถูกต้อง (6 ตัวอักษร)" };
    }

    // 1. ค้นหากลุ่มจาก Server Registry เพื่อให้รหัสกลุ่มใช้งานได้จริงข้ามบัญชี/ข้ามเครื่อง
    try {
      const res = await fetch(`/api/groups/code/${clean}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member: currentMember }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.group) {
          const serverGroup: GroupSettings = {
            ...data.group,
            memberIds: Array.from(new Set([...(data.group.memberIds || []), currentMemberId])),
          };

          setGroups((prev) => {
            const idx = prev.findIndex(
              (g) => g.id === serverGroup.id || g.code?.toUpperCase() === clean
            );
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...serverGroup };
              return updated;
            }
            return [serverGroup, ...prev];
          });

          if (data.expenses && Array.isArray(data.expenses) && data.expenses.length > 0) {
            setExpenses((prev) => {
              const existingIds = new Set(prev.map((e) => e.id));
              const newExps = data.expenses.filter((e: ExpenseRecord) => !existingIds.has(e.id));
              return [...newExps, ...prev];
            });
          }

          if (data.payments && Array.isArray(data.payments) && data.payments.length > 0) {
            setPayments((prev) => {
              const existingIds = new Set(prev.map((p) => p.id));
              const newPays = data.payments.filter((p: PaymentRecord) => !existingIds.has(p.id));
              return [...newPays, ...prev];
            });
          }

          if (data.members && Array.isArray(data.members) && data.members.length > 0) {
            setMembers((prev) => {
              const map = new Map(prev.map((m) => [m.id, m]));
              for (const m of data.members) {
                map.set(m.id, { ...(map.get(m.id) || {}), ...m });
              }
              return Array.from(map.values());
            });
          }

          setCurrentGroupId(serverGroup.id);

          setNotifications((prev) => [
            {
              id: `notif-${Date.now()}`,
              title: "เข้าร่วมกลุ่มสำเร็จ",
              body: `คุณได้เข้าร่วมกลุ่ม "${serverGroup.name}" ด้วยรหัส ${clean} เรียบร้อยแล้ว`,
              type: "group_joined",
              read: false,
              createdAt: new Date().toISOString(),
            },
            ...prev,
          ]);

          return {
            success: true,
            message: `เข้าร่วมกลุ่ม "${serverGroup.name}" สำเร็จ!`,
            group: serverGroup,
          };
        }
      }
    } catch (err) {
      console.warn("Could not query server group registry:", err);
    }

    // 2. Fallback ค้นหาในกลุ่มที่มีอยู่ในเครื่อง
    const found = groups.find((g) => g.code?.toUpperCase() === clean);
    if (found) {
      setCurrentGroupId(found.id);
      setGroups((prev) =>
        prev.map((g) =>
          g.id === found.id
            ? { ...g, memberIds: Array.from(new Set([...(g.memberIds || []), currentMemberId])) }
            : g
        )
      );

      if (!members.some((m) => m.id === currentMemberId && m.status === "active")) {
        setMembers((prev) =>
          prev.map((m) => (m.id === currentMemberId ? { ...m, status: "active" as MemberStatus } : m))
        );
      }

      setNotifications((prev) => [
        {
          id: `notif-${Date.now()}`,
          title: "เข้าร่วมกลุ่มสำเร็จ",
          body: `คุณได้เข้าร่วมกลุ่ม "${found.name}" ด้วยรหัส ${clean} เรียบร้อยแล้ว`,
          type: "group_joined",
          read: false,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);

      return {
        success: true,
        message: `เข้าร่วมกลุ่ม "${found.name}" สำเร็จ!`,
        group: found,
      };
    }

    // 3. ไม่พบกลุ่ม
    return {
      success: false,
      message: `ไม่พบกลุ่มที่ตรงกับรหัส "${clean}" กรุณาตรวจสอบรหัส 6 หลักจากผู้สร้างกลุ่มอีกครั้ง`,
    };
  };

  const deleteGroup = (groupId: string): { success: boolean; message: string } => {
    if (isDemo) {
      triggerDemoLock("การลบกลุ่ม");
      return { success: false, message: "โหมดทดลองใช้งานไม่สามารถลบกลุ่มได้" };
    }

    const targetGroup = groups.find((g) => g.id === groupId);
    if (!targetGroup) {
      return { success: false, message: "ไม่พบกลุ่มที่ต้องการลบ" };
    }

    deletedGroupIdsRef.current.add(groupId);

    const remainingGroups = groups.filter((g) => g.id !== groupId);
    setGroups(remainingGroups);

    // หากกลุ่มที่ลบคือกลุ่มที่กำลังเปิดใช้งานอยู่ ให้สลับไปกลุ่มแรกที่เหลือ
    if (currentGroupId === groupId) {
      const remainingUserGroups = userGroups.filter((g) => g.id !== groupId);
      if (remainingUserGroups.length > 0) {
        setCurrentGroupId(remainingUserGroups[0].id);
      } else if (remainingGroups.length > 0) {
        setCurrentGroupId(remainingGroups[0].id);
      } else {
        setCurrentGroupId("");
      }
    }

    // ล้างรายจ่ายและประวัติการชำระเงินของกลุ่มนี้ออกจาก client
    setExpenses((prev) => prev.filter((e) => e.groupId !== groupId));
    setPayments((prev) => prev.filter((p) => p.groupId !== groupId));

    // ส่งคำขอลบไปยังเซิร์ฟเวอร์ทันที
    fetch("/api/groups/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deletedGroupId: groupId,
        groups: remainingGroups,
      }),
    }).catch(() => {});

    // เรียก Supabase DELETE endpoint เผื่อต่อกับ database
    fetch(`/api/groups/${groupId}`, { method: "DELETE" }).catch(() => {});

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "ลบกลุ่มสำเร็จ",
        body: `กลุ่ม "${targetGroup.name}" ถูกลบออกจากระบบแล้ว`,
        type: "group_deleted",
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);

    return { success: true, message: `ลบกลุ่ม "${targetGroup.name}" สำเร็จเรียบร้อยแล้ว` };
  };

  const addExpense: GroupContextType["addExpense"] = (expData) => {
    const newId = `exp-${Date.now()}`;
    const newExp: ExpenseRecord = {
      ...expData,
      id: newId,
      groupId: currentGroupId,
      status: "active",
      createdByMemberId: currentMemberId,
      createdAt: new Date().toISOString(),
    };

    setExpenses((prev) => [newExp, ...prev]);

    // แจ้งเตือนผู้ที่ต้องร่วมรับผิดชอบ
    const newNotifs: NotificationItem[] = expData.shares
      .filter((s) => s.memberId !== currentMemberId && s.amountSatang > 0)
      .map((s) => ({
        id: `notif-${Date.now()}-${s.memberId}`,
        title: "มีรายจ่ายใหม่ในกลุ่ม",
        body: `${currentMember.name} เพิ่มรายการ "${expData.title}" (ส่วนของคุณ ${formatTHB(s.amountSatang)})`,
        type: "expense_created",
        read: false,
        createdAt: new Date().toISOString(),
      }));

    if (newNotifs.length) {
      setNotifications((prev) => [...newNotifs, ...prev]);
    }

    return newId;
  };

  const voidExpense = (expenseId: string, reason: string) => {
    if (isDemo) {
      triggerDemoLock("การยกเลิกรายจ่าย (Void)");
      return;
    }

    setExpenses((prev) => {
      const exp = prev.find((e) => e.id === expenseId);
      if (exp) {
        setNotifications((notifs) => [
          {
            id: `notif-${Date.now()}`,
            title: "ยกเลิกรายจ่าย",
            body: `รายการ "${exp.title}" ถูกยกเลิกโดยผู้ดูแล: ${reason}`,
            type: "expense_voided",
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...notifs,
        ]);
      }
      return prev.map((e) =>
        e.id === expenseId ? { ...e, status: "voided", voidReason: reason } : e
      );
    });
  };

  const createPayment = (
    fromId: string,
    toId: string,
    amountSatang: number,
    mode: "direct" | "optimized" | "manual"
  ) => {
    if (isDemo) {
      triggerDemoLock("การบันทึกการชำระเงิน");
      return "";
    }

    const newId = `pay-${Date.now()}`;
    const newPayment: PaymentRecord = {
      id: newId,
      groupId: currentGroupId,
      fromMemberId: fromId,
      toMemberId: toId,
      amountSatang,
      paymentDate: new Date().toISOString().slice(0, 10),
      status: "pending_proof",
      settlementMode: mode,
      createdAt: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);
    return newId;
  };

  const uploadProofAndSubmit = (paymentId: string, filename: string, url: string) => {
    if (isDemo) {
      triggerDemoLock("การแนบสลิปการโอนเงิน");
      return;
    }

    setPayments((prev) => {
      const payment = prev.find((p) => p.id === paymentId);
      if (payment) {
        const fromName = members.find((m) => m.id === payment.fromMemberId)?.name ?? "สมาชิก";
        setNotifications((notifs) => [
          {
            id: `notif-${Date.now()}`,
            title: "มีสลิปการชำระเงินรอตรวจสอบ",
            body: `${fromName} แจ้งชำระเงิน ${formatTHB(payment.amountSatang)} และแนบสลิปแล้ว`,
            type: "payment_submitted",
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...notifs,
        ]);
      }
      return prev.map((p) =>
        p.id === paymentId
          ? {
              ...p,
              status: "submitted",
              proof: {
                id: `proof-${Date.now()}`,
                filename,
                url,
                uploadedAt: new Date().toISOString(),
              },
            }
          : p
      );
    });
  };

  const confirmPayment = (paymentId: string) => {
    if (isDemo) {
      triggerDemoLock("การยืนยันยอดเงินสลิป");
      return;
    }

    setPayments((prev) => {
      const payment = prev.find((p) => p.id === paymentId);
      if (payment) {
        setNotifications((notifs) => [
          {
            id: `notif-${Date.now()}`,
            title: "ยืนยันการชำระเงินเรียบร้อยแล้ว",
            body: `การชำระเงิน ${formatTHB(payment.amountSatang)} ได้รับการยืนยันแล้ว ยอดหนี้ปรับลดทันที`,
            type: "payment_confirmed",
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...notifs,
        ]);
      }
      return prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: "confirmed", confirmedAt: new Date().toISOString() }
          : p
      );
    });
  };

  const rejectPayment = (paymentId: string, reason: string) => {
    if (isDemo) {
      triggerDemoLock("การปฏิเสธสลิป");
      return;
    }

    setPayments((prev) => {
      const payment = prev.find((p) => p.id === paymentId);
      if (payment) {
        setNotifications((notifs) => [
          {
            id: `notif-${Date.now()}`,
            title: "สลิปการชำระเงินถูกปฏิเสธ",
            body: `รายการ ${formatTHB(payment.amountSatang)} ถูกปฏิเสธ: ${reason}`,
            type: "payment_rejected",
            read: false,
            createdAt: new Date().toISOString(),
          },
          ...notifs,
        ]);
      }
      return prev.map((p) =>
        p.id === paymentId
          ? { ...p, status: "rejected", rejectionReason: reason }
          : p
      );
    });
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const addMember = (name: string, role: Role = "member") => {
    if (isDemo) {
      triggerDemoLock("การเพิ่มสมาชิกกลุ่ม");
      return;
    }

    const colors = ["#2ecc71", "#3498db", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c", "#1abc9c"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: name.trim(),
      role,
      status: "active",
      avatarColor: randomColor,
    };
    const nextMembers = [...members, newMember];
    setMembers(nextMembers);

    // เพิ่มสมาชิกใหม่เข้ากลุ่มปัจจุบันทันที
    const updatedGroups = groups.map((g) => {
      if (g.id === group.id) {
        const nextIds = Array.from(new Set([...(g.memberIds || []), newMember.id]));
        return { ...g, memberIds: nextIds };
      }
      return g;
    });
    setGroups(updatedGroups);

    fetch("/api/groups/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groups: updatedGroups,
        members: nextMembers.map(({ password: _, ...rest }) => rest),
      }),
    }).catch(() => {});
  };

  const toggleMemberStatus = (memberId: string) => {
    if (isDemo) {
      triggerDemoLock("การเปลี่ยนสถานะสมาชิก");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, status: m.status === "active" ? "inactive" : "active" }
          : m
      )
    );
  };

  const removeMember = (memberId: string) => {
    if (isDemo) {
      triggerDemoLock("การลบสมาชิกออกจากกลุ่ม");
      return;
    }
    if (memberId === currentMemberId) {
      return;
    }

    // 1. นำออกจาก memberIds ของกลุ่มปัจจุบัน
    const updatedGroups = groups.map((g) => {
      if (g.id === group.id) {
        const nextIds = (g.memberIds || []).filter((id) => id !== memberId);
        return { ...g, memberIds: nextIds };
      }
      return g;
    });
    setGroups(updatedGroups);

    // 2. นำออกจาก members ในเครื่อง
    const remainingMembers = members.filter((m) => m.id !== memberId);
    setMembers(remainingMembers);

    // 3. ส่งข้อมูลการลบไปยังเซิร์ฟเวอร์ทันทีเพื่ออัปเดต store
    fetch("/api/groups/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        groups: updatedGroups,
        deletedMemberId: memberId,
        groupId: group.id,
        members: remainingMembers.map(({ password: _, ...rest }) => rest),
      }),
    }).catch(() => {});

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "ลบสมาชิกออกจากกลุ่มสำเร็จ",
        body: "นำสมาชิกออกจากกลุ่มเรียบร้อยแล้ว",
        type: "member_removed",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/settings",
      },
      ...prev,
    ]);
  };

  const clearDummyMembers = () => {
    if (isDemo) {
      triggerDemoLock("การล้างสมาชิกตัวอย่าง");
      return;
    }
    const dummyIds = ["mem-min", "mem-ton", "mem-nont", "mem-ploy", "mem-beam"];
    setMembers((prev) => {
      const remaining = prev.filter((m) => !dummyIds.includes(m.id));
      return remaining.length > 0 ? remaining : initialMembers;
    });
    if (dummyIds.includes(currentMemberId)) {
      setCurrentMemberId("mem-karn");
    }
  };

  const login = (memberId: string) => {
    const found = members.find((m) => m.id === memberId);
    if (found) {
      setCurrentMemberId(found.id);
      setIsAuthenticated(true);
      setIsDemo(false);
      return true;
    }
    return false;
  };

  const loginWithGoogle: GroupContextType["loginWithGoogle"] = (googleUser) => {
    const cleanEmail = googleUser.email.trim().toLowerCase();
    const cleanName = googleUser.name.trim();

    // ค้นหาว่ามีสมาชิกเดิมที่มีอีเมลหรือชื่อตรงกันหรือไม่
    let target = members.find(
      (m) =>
        (m.email && m.email.toLowerCase() === cleanEmail) ||
        m.name.toLowerCase() === cleanName.toLowerCase()
    );

    if (target) {
      // อัปเดตอีเมลและรูปโปรไฟล์หากยังไม่มี
      const shouldUpdateEmail = !target.email && cleanEmail;
      const shouldUpdateAvatar = !target.avatarUrl && googleUser.avatarUrl;
      if (shouldUpdateEmail || shouldUpdateAvatar) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === target!.id
              ? {
                  ...m,
                  email: shouldUpdateEmail ? cleanEmail : m.email,
                  avatarUrl: shouldUpdateAvatar ? googleUser.avatarUrl : m.avatarUrl,
                }
              : m
          )
        );
      }
    } else {
      // สร้างสมาชิกใหม่จาก Google Profile
      const colors = ["#4285F4", "#34A853", "#FBBC05", "#EA4335", "#1f6f53", "#2980b9"];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      target = {
        id: `mem-${Date.now()}`,
        name: cleanName,
        nickname: cleanName.split(" ")[0],
        email: cleanEmail,
        role: "member",
        status: "active",
        avatarColor: randomColor,
        avatarUrl: googleUser.avatarUrl,
        password: "google_oauth_user",
      };
      setMembers((prev) => [...prev, target!]);
    }

    setCurrentMemberId(target.id);
    setIsAuthenticated(true);
    setIsDemo(false);

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "เข้าสู่ระบบด้วย Google สำเร็จ",
        body: `เข้าสู่ระบบในชื่อ ${target!.nickname ? `${target!.nickname} (${target!.name})` : target!.name} (${cleanEmail})`,
        type: "auth_google_login",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/",
      },
      ...prev,
    ]);

    return target;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsDemo(false);
  };

  const demoLogin = () => {
    setCurrentMemberId("mem-karn");
    setIsAuthenticated(true);
    setIsDemo(true);
  };

  const registerMember = (data: {
    name: string;
    nickname?: string;
    email?: string;
    password?: string;
    bankName?: string;
    bankAccountNumber?: string;
    promptpayNumber?: string;
    qrCodeUrl?: string;
    avatarUrl?: string;
    avatarColor?: string;
    role?: Role;
  }): Member => {
    const colors = ["#2ecc71", "#3498db", "#9b59b6", "#f1c40f", "#e67e22", "#e74c3c", "#1abc9c", "#1f6f53"];
    const randomColor = data.avatarColor || colors[Math.floor(Math.random() * colors.length)];
    const newMember: Member = {
      id: `mem-${Date.now()}`,
      name: data.name.trim(),
      nickname: data.nickname?.trim() || undefined,
      role: data.role ?? "member",
      status: "active",
      avatarColor: randomColor,
      avatarUrl: data.avatarUrl || undefined,
      email: data.email?.trim() || undefined,
      password: data.password || "password123",
      bankName: data.bankName?.trim() || undefined,
      bankAccountNumber: data.bankAccountNumber?.trim() || undefined,
      promptpayNumber: data.promptpayNumber?.trim() || undefined,
      qrCodeUrl: data.qrCodeUrl || undefined,
    };
    setMembers((prev) => [...prev, newMember]);
    setCurrentMemberId(newMember.id);
    setIsAuthenticated(true);
    setIsDemo(false);
    return newMember;
  };

  const findMemberByIdentifier = (identifier: string): Member | undefined => {
    const clean = identifier.trim().toLowerCase();
    if (!clean) return undefined;
    return members.find(
      (m) =>
        m.name.toLowerCase() === clean ||
        m.nickname?.toLowerCase() === clean ||
        m.email?.toLowerCase() === clean ||
        m.id.toLowerCase() === clean
    );
  };

  const resetPassword = (identifier: string, newPassword: string) => {
    const found = findMemberByIdentifier(identifier);
    if (!found) {
      return {
        success: false,
        message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ กรุณาตรวจสอบชื่อเล่น อีเมล หรือชื่อผู้ใช้อีกครั้ง",
      };
    }

    setMembers((prev) =>
      prev.map((m) => (m.id === found.id ? { ...m, password: newPassword } : m))
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: "ตั้งรหัสผ่านใหม่สำเร็จ",
        body: `บัญชี ${found.nickname ? `${found.nickname} (${found.name})` : found.name} ได้รับการตั้งรหัสผ่านใหม่เรียบร้อยแล้ว`,
        type: "auth_password_reset",
        read: false,
        createdAt: new Date().toISOString(),
        link: "/login",
      },
      ...prev,
    ]);

    return {
      success: true,
      message: "ตั้งรหัสผ่านใหม่สำเร็จเรียบร้อยแล้ว! สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที",
      member: found,
    };
  };

  const updateProfile = (memberId: string, updates: Partial<Omit<Member, "id">>) => {
    if (isDemo) {
      triggerDemoLock("การแก้ไขข้อมูลส่วนตัว/บัญชีธนาคาร");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? {
              ...m,
              ...updates,
              name: updates.name ? updates.name.trim() : m.name,
              nickname: updates.nickname !== undefined ? updates.nickname.trim() : m.nickname,
              avatarUrl: updates.avatarUrl !== undefined ? updates.avatarUrl : m.avatarUrl,
              avatarColor: updates.avatarColor !== undefined ? updates.avatarColor : m.avatarColor,
              email: updates.email !== undefined ? updates.email.trim() : m.email,
              password: updates.password !== undefined ? updates.password : m.password,
              bankName: updates.bankName !== undefined ? updates.bankName.trim() : m.bankName,
              bankAccountNumber: updates.bankAccountNumber !== undefined ? updates.bankAccountNumber.trim() : m.bankAccountNumber,
              promptpayNumber: updates.promptpayNumber !== undefined ? updates.promptpayNumber.trim() : m.promptpayNumber,
              qrCodeUrl: updates.qrCodeUrl !== undefined ? updates.qrCodeUrl : m.qrCodeUrl,
            }
          : m
      )
    );
  };

  const toggleMemberRole = (memberId: string) => {
    if (isDemo) {
      triggerDemoLock("การเปลี่ยนสิทธิ์สมาชิก");
      return;
    }

    setMembers((prev) =>
      prev.map((m) =>
        m.id === memberId
          ? { ...m, role: m.role === "admin" ? "member" : "admin" }
          : m
      )
    );
  };

  const resetToDefaultData = () => {
    setGroups(initialGroups);
    setCurrentGroupId(initialGroups[0].id);
    setMembers(initialMembers);
    setExpenses([]);
    setPayments([]);
    setNotifications([]);
    setCurrentMemberId("mem-karn");
    setIsAuthenticated(true);
    setIsDemo(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem("group_expense_app_state_v1");
      localStorage.removeItem("group_expense_app_state_v2");
      localStorage.removeItem("group-expense-room-demo");
    } catch (e) {
      console.warn("Could not clear storage keys:", e);
    }
  };

  return (
    <GroupContext.Provider
      value={{
        group,
        members: currentGroupMembers,
        allMembers: members,
        expenses,
        payments,
        notifications,
        currentMemberId,
        currentMember,
        isAdmin,
        isGroupCreator,
        groupCreator,
        activeMembers,
        isAuthenticated,
        isDemo,
        demoLockModal,
        triggerDemoLock,
        closeDemoLock,
        login,
        loginWithGoogle,
        logout,
        demoLogin,
        toggleMemberRole,
        netBalances,
        myNetBalanceSatang,
        myOwedSatang,
        myDueSatang,

        directSettlementList,
        optimizedSettlementList,
        unreadNotificationCount,
        setCurrentMemberId,
        groups: userGroups,
        hasGroup,
        switchGroup,
        joinGroupByCode,
        joinModalOpen,
        setJoinModalOpen,
        createGroup,
        deleteGroup,
        updateGroupSettings,
        addExpense,
        voidExpense,
        createPayment,
        uploadProofAndSubmit,
        confirmPayment,
        rejectPayment,
        markNotificationRead,
        markAllNotificationsRead,
        addMember,
        registerMember,
        findMemberByIdentifier,
        resetPassword,
        updateProfile,
        toggleMemberStatus,
        removeMember,
        clearDummyMembers,
        resetToDefaultData,
      }}
    >
      {children}
    </GroupContext.Provider>
  );
}

export function useGroup() {
  const context = useContext(GroupContext);
  if (!context) {
    throw new Error("useGroup must be used within a GroupProvider");
  }
  return context;
}
