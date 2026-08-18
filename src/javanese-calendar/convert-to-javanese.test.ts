import { describe, expect, test } from "bun:test";
import { convertToJavanese } from "./convert-to-javanese";

describe("convertToJavanese", () => {
  test("8 July 1633 — origin of Javanese calendar", () => {
    const result = convertToJavanese(1633, 7, 8);
    expect(result.dayOfWeek).toBe("Jumat");
    expect(result.pasaran).toBe("Legi");
    expect(result.wuku).toBe("Kulawu");
  });

  test("3 December 1968 — from weton.c reference", () => {
    const result = convertToJavanese(1968, 12, 3);
    expect(result.dayOfWeek).toBe("Selasa");
    expect(result.pasaran).toBe("Kliwon");
  });

  test("1 January 2024", () => {
    const result = convertToJavanese(2024, 1, 1);
    expect(result.dayOfWeek).toBe("Senin");
    expect(result.pasaran).toBe("Pahing");
    expect(result.wuku).toBe("Wukir");
  });

  test("17 August 1945 — Indonesian Independence Day", () => {
    const result = convertToJavanese(1945, 8, 17);
    expect(result.dayOfWeek).toBe("Jumat");
    expect(result.pasaran).toBe("Legi");
  });

  test("18 August 2026", () => {
    const result = convertToJavanese(2026, 8, 18);
    expect(result.dayOfWeek).toBe("Selasa");
    expect(result.pasaran).toBe("Pahing");
    expect(result.wuku).toBe("Medangkungan");
  });

  test("neptu calculation is correct", () => {
    const result = convertToJavanese(2024, 1, 1);
    expect(result.neptu).toBeGreaterThan(0);
    expect(result.neptu).toBeLessThanOrEqual(12);
  });

  test("returns correct date format", () => {
    const result = convertToJavanese(2024, 3, 5);
    expect(result.date).toBe("2024-03-05");
  });
});
