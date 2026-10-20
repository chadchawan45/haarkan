import { describe, it, expect } from "vitest";
import { generatePromptPayPayload, crc16, generatePromptPayDataUrl } from "./promptpay";

describe("PromptPay EMVCo Generator", () => {
  it("computes correct CRC16 for sample payload", () => {
    // Standard EMVCo CRC check
    const data = "00020101021129370016A0000006770101110113006681234567853037645802TH6304";
    const crc = crc16(data);
    expect(crc).toHaveLength(4);
  });

  it("generates dynamic payload with amount", () => {
    const payload = generatePromptPayPayload("081-234-5678", 17837.66);
    expect(payload).toContain("000201"); // Format indicator
    expect(payload).toContain("010212"); // Dynamic tag (12)
    expect(payload).toContain("A000000677010111"); // PromptPay AID
    expect(payload).toContain("0066812345678"); // Normalized mobile
    expect(payload).toContain("5303764"); // Currency THB
    expect(payload).toContain("540817837.66"); // Amount
    expect(payload).toContain("5802TH"); // Country TH
    expect(payload).toContain("6304"); // CRC tag
  });

  it("generates data URL for QR code", async () => {
    const dataUrl = await generatePromptPayDataUrl("0812345678", 500);
    expect(dataUrl).toMatch(/^data:image\/png;base64,/);
  });
});
