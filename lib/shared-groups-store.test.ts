import { describe, it, expect, beforeEach } from "vitest";
import {
  findGroupByCode,
  joinGroupByCodeOnServer,
  syncClientData,
  getAllSharedGroups,
  resetTestStore,
  broadcastNotification,
  restoreStoreData,
  updateUserByAdmin,
} from "./shared-groups-store";

describe("Shared Groups Store", () => {
  beforeEach(() => {
    resetTestStore();
  });

  it("finds seeded group by code (case-insensitive)", () => {
    const result = findGroupByCode("ha8k29");
    expect(result.group).toBeDefined();
    expect(result.group?.name).toBe("บ้านสุขใจ");
    expect(result.group?.code).toBe("HA8K29");
  });

  it("finds group-2 by code JP2026", () => {
    const result = findGroupByCode("jp2026");
    expect(result.group).toBeDefined();
    expect(result.group?.name).toBe("ทริปเที่ยวญี่ปุ่น 2026");
  });

  it("returns undefined for unknown group code", () => {
    const result = findGroupByCode("NOTREAL99");
    expect(result.group).toBeUndefined();
  });

  it("allows joining group by code and registers member", () => {
    const newMember = {
      id: "mem-test-user",
      name: "ผู้ทดสอบ",
      email: "test@example.com",
    };
    const joinResult = joinGroupByCodeOnServer("HA8K29", newMember);
    expect(joinResult.success).toBe(true);
    expect(joinResult.group?.name).toBe("บ้านสุขใจ");
    expect(joinResult.members?.some((m) => m.id === "mem-test-user")).toBe(true);
  });

  it("syncs new group data from client", () => {
    const customGroup = {
      id: "group-custom-123",
      name: "กลุ่มเพื่อนมหาวิทยาลัย",
      description: "แชร์ค่าชีทและค่าเดินทาง",
      weekStartsOn: 1,
      defaultCurrency: "THB",
      code: "UNIV26",
    };

    syncClientData({ groups: [customGroup] });
    const lookup = findGroupByCode("univ26");
    expect(lookup.group).toBeDefined();
    expect(lookup.group?.name).toBe("กลุ่มเพื่อนมหาวิทยาลัย");
  });

  it("broadcasts notifications properly in memory store", () => {
    const broadcast = broadcastNotification({
      title: "ประกาศสำคัญ",
      body: "ทดสอบการส่งประกาศ",
      type: "announcement",
    });

    expect(broadcast.success).toBe(true);
    expect(broadcast.notification.title).toBe("ประกาศสำคัญ");
  });

  it("restores backup data safely in memory store", () => {
    const restoreResult = restoreStoreData({
      groups: [{ id: "restored-1", name: "กลุ่มกู้คืน", code: "REST01", weekStartsOn: 1, defaultCurrency: "THB", description: "" }],
      members: [],
      expenses: [],
      payments: [],
    });

    expect(restoreResult.success).toBe(true);
    const lookup = findGroupByCode("rest01");
    expect(lookup.group?.name).toBe("กลุ่มกู้คืน");
  });
});
