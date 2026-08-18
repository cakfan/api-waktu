import { describe, expect, test } from "bun:test";
import {
  gregorianToHijri,
  hijriToGregorian,
  getDaysInHijriMonth,
  getDaysInHijriYear,
} from "./convert-to-hijri";

describe("gregorianToHijri", () => {
  test("1 January 2024", () => {
    const result = gregorianToHijri(2024, 1, 1);
    expect(result.year).toBe(1445);
    expect(result.month).toBe(6);
    expect(result.day).toBe(19);
    expect(result.monthName).toBe("Jumadil Akhir");
  });

  test("17 August 1945 — Indonesian Independence Day", () => {
    const result = gregorianToHijri(1945, 8, 17);
    expect(result.year).toBe(1364);
    expect(result.month).toBe(9);
    expect(result.day).toBe(8);
    expect(result.monthName).toBe("Ramadan");
  });

  test("28 June 2023", () => {
    const result = gregorianToHijri(2023, 6, 28);
    expect(result.year).toBe(1444);
    expect(result.month).toBe(12);
    expect(result.day).toBe(9);
    expect(result.monthName).toBe("Dzulhijjah");
  });

  test("17 June 2024 — Eid al-Adha 1445", () => {
    const result = gregorianToHijri(2024, 6, 17);
    expect(result.year).toBe(1445);
    expect(result.month).toBe(12);
    expect(result.day).toBe(10);
    expect(result.monthName).toBe("Dzulhijjah");
  });

  test("8 July 2024 — Muharram 1446", () => {
    const result = gregorianToHijri(2024, 7, 8);
    expect(result.year).toBe(1446);
    expect(result.month).toBe(1);
    expect(result.day).toBe(1);
    expect(result.monthName).toBe("Muharram");
  });
});

describe("hijriToGregorian", () => {
  test("1 Muharram 1446", () => {
    const result = hijriToGregorian(1446, 1, 1);
    expect(result.year).toBe(2024);
    expect(result.month).toBe(7);
    expect(result.day).toBe(8);
  });

  test("10 Dzulhijjah 1445 — Eid al-Adha", () => {
    const result = hijriToGregorian(1445, 12, 10);
    expect(result.year).toBe(2024);
    expect(result.month).toBe(6);
    expect(result.day).toBe(17);
  });

  test("1 Ramadan 1445", () => {
    const result = hijriToGregorian(1445, 9, 1);
    expect(result.year).toBe(2024);
    expect(result.month).toBe(3);
    expect(result.day).toBe(11);
  });
});

describe("round-trip conversion", () => {
  test("Gregorian → Hijri → Gregorian preserves date", () => {
    const dates: [number, number, number][] = [
      [2024, 1, 1],
      [2024, 6, 17],
      [2024, 7, 8],
      [1945, 8, 17],
      [2000, 1, 1],
      [1600, 3, 15],
    ];

    for (const [y, m, d] of dates) {
      const hijri = gregorianToHijri(y, m, d);
      const greg = hijriToGregorian(hijri.year, hijri.month, hijri.day);
      expect(greg.year).toBe(y);
      expect(greg.month).toBe(m);
      expect(greg.day).toBe(d);
    }
  });

  test("Hijri → Gregorian → Hijri preserves date", () => {
    const dates: [number, number, number][] = [
      [1445, 6, 19],
      [1445, 12, 10],
      [1446, 1, 1],
      [1445, 9, 1],
      [1364, 9, 8],
    ];

    for (const [y, m, d] of dates) {
      const greg = hijriToGregorian(y, m, d);
      const hijri = gregorianToHijri(greg.year, greg.month, greg.day);
      expect(hijri.year).toBe(y);
      expect(hijri.month).toBe(m);
      expect(hijri.day).toBe(d);
    }
  });
});

describe("getDaysInHijriMonth", () => {
  test("odd months have 30 days", () => {
    expect(getDaysInHijriMonth(1445, 1)).toBe(30);
    expect(getDaysInHijriMonth(1445, 3)).toBe(30);
    expect(getDaysInHijriMonth(1445, 5)).toBe(30);
  });

  test("even months (except 12) have 29 days", () => {
    expect(getDaysInHijriMonth(1445, 2)).toBe(29);
    expect(getDaysInHijriMonth(1445, 4)).toBe(29);
    expect(getDaysInHijriMonth(1445, 10)).toBe(29);
  });

  test("month 12 depends on leap year", () => {
    expect(getDaysInHijriMonth(1445, 12)).toBe(30);
    expect(getDaysInHijriMonth(1446, 12)).toBe(29);
  });
});

describe("getDaysInHijriYear", () => {
  test("leap year has 355 days", () => {
    expect(getDaysInHijriYear(1445)).toBe(355);
  });

  test("common year has 354 days", () => {
    expect(getDaysInHijriYear(1446)).toBe(354);
  });
});
