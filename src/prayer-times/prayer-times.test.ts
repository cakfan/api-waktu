import { describe, expect, test } from "bun:test";
import { computePrayerTimes } from "./prayer-times";

const JAKARTA = { latitude: -6.2088, longitude: 106.8456 };

describe("prayer times for Jakarta (Kemenag method)", () => {
  test("18 August 2026", () => {
    const r = computePrayerTimes(2026, 8, 18, JAKARTA.latitude, JAKARTA.longitude);
    expect(r.fajr).toBe("04:41");
    expect(r.sunrise).toBe("05:59");
    expect(r.dhuhr).toBe("11:58");
    expect(r.asr).toBe("15:18");
    expect(r.maghrib).toBe("17:55");
    expect(r.isha).toBe("19:05");
  });

  test("01 January 2026", () => {
    const r = computePrayerTimes(2026, 1, 1, JAKARTA.latitude, JAKARTA.longitude);
    expect(r.fajr).toBe("04:17");
    expect(r.sunrise).toBe("05:42");
    expect(r.dhuhr).toBe("11:58");
    expect(r.asr).toBe("15:24");
    expect(r.maghrib).toBe("18:11");
    expect(r.isha).toBe("19:27");
  });

  test("21 June 2026 (solstice)", () => {
    const r = computePrayerTimes(2026, 6, 21, JAKARTA.latitude, JAKARTA.longitude);
    expect(r.fajr).toBe("04:38");
    expect(r.sunrise).toBe("06:02");
    expect(r.dhuhr).toBe("11:56");
    expect(r.asr).toBe("15:17");
    expect(r.maghrib).toBe("17:48");
    expect(r.isha).toBe("19:03");
  });
});

describe("prayer times for Surabaya", () => {
  test("18 August 2026", () => {
    const SURABAYA = { latitude: -7.2575, longitude: 112.7521 };
    const r = computePrayerTimes(2026, 8, 18, SURABAYA.latitude, SURABAYA.longitude);
    expect(r.fajr).toBe("04:18");
    expect(r.sunrise).toBe("05:37");
    expect(r.dhuhr).toBe("11:34");
    expect(r.asr).toBe("14:55");
    expect(r.maghrib).toBe("17:30");
    expect(r.isha).toBe("18:41");
  });
});

describe("prayer times for Bandung", () => {
  test("18 August 2026", () => {
    const BANDUNG = { latitude: -6.9175, longitude: 107.6191 };
    const r = computePrayerTimes(2026, 8, 18, BANDUNG.latitude, BANDUNG.longitude);
    expect(r.fajr).toBe("04:38");
    expect(r.sunrise).toBe("05:57");
    expect(r.dhuhr).toBe("11:55");
    expect(r.asr).toBe("15:15");
    expect(r.maghrib).toBe("17:51");
    expect(r.isha).toBe("19:02");
  });
});
