import { describe, expect, it } from "vitest";
import { calculateFee, calculateLoan, canAccess, feeRules } from "./utils";

describe("SmartBank finance utilities", () => {
  it("calculates marketplace payment request fees transparently", () => {
    const result = calculateFee("marketplace", 100000);

    expect(result.appFee).toBe(2000);
    expect(result.gatewayFee).toBe(500);
    expect(result.bankFee).toBe(1000);
    expect(result.tax).toBe(2000);
    expect(result.totalDebit).toBe(105500);
  });

  it("calculates fixed logistics fee mode", () => {
    const result = calculateFee("logistikita", 100000, "flat");

    expect(result.logisticsFee).toBe(feeRules.logisticsFlat);
    expect(result.totalDebit).toBe(108500);
  });

  it("calculates loan interest at ten percent", () => {
    const result = calculateLoan(80000);

    expect(result.interestAmount).toBe(8000);
    expect(result.totalRepayment).toBe(88000);
  });

  it("keeps ledger visible to read-only insight role but blocks transfers", () => {
    expect(canAccess("insight_readonly", "ledger")).toBe(true);
    expect(canAccess("insight_readonly", "transfer")).toBe(false);
  });
});
