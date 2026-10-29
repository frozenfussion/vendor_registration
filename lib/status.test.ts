import { describe, expect, it } from "vitest";
import { ACTION_TO_STATUS, canTransition, isTerminal } from "./status";

describe("status machine", () => {
  it("allows PENDING -> APPROVED | REJECTED | KIV", () => {
    expect(canTransition("PENDING", "APPROVED")).toBe(true);
    expect(canTransition("PENDING", "REJECTED")).toBe(true);
    expect(canTransition("PENDING", "KIV")).toBe(true);
  });

  it("allows KIV -> APPROVED | REJECTED but not back to PENDING", () => {
    expect(canTransition("KIV", "APPROVED")).toBe(true);
    expect(canTransition("KIV", "REJECTED")).toBe(true);
    expect(canTransition("KIV", "PENDING")).toBe(false);
    expect(canTransition("KIV", "KIV")).toBe(false);
  });

  it("treats APPROVED and REJECTED as terminal", () => {
    expect(isTerminal("APPROVED")).toBe(true);
    expect(isTerminal("REJECTED")).toBe(true);
    expect(canTransition("APPROVED", "REJECTED")).toBe(false);
    expect(canTransition("REJECTED", "APPROVED")).toBe(false);
  });

  it("maps actions to statuses", () => {
    expect(ACTION_TO_STATUS.APPROVE).toBe("APPROVED");
    expect(ACTION_TO_STATUS.KIV).toBe("KIV");
    expect(ACTION_TO_STATUS.REJECT).toBe("REJECTED");
  });
});
