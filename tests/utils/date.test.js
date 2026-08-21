import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatPostDate, formatMemberSinceDate } from "../../frontend/src/utils/date/index.js";

const NOW = new Date("2026-03-15T12:00:00.000Z");
const ago = (ms) => new Date(NOW.getTime() - ms).toISOString();
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatPostDate", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(NOW);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("returns 'Just now' for anything under a minute", () => {
		expect(formatPostDate(ago(0))).toBe("Just now");
		expect(formatPostDate(ago(59 * SECOND))).toBe("Just now");
	});

	it("returns minutes between one minute and one hour", () => {
		expect(formatPostDate(ago(MINUTE))).toBe("1m");
		expect(formatPostDate(ago(59 * MINUTE))).toBe("59m");
	});

	it("returns hours between one hour and one day", () => {
		expect(formatPostDate(ago(HOUR))).toBe("1h");
		expect(formatPostDate(ago(23 * HOUR))).toBe("23h");
	});

	it("returns '1d' for the second day", () => {
		expect(formatPostDate(ago(DAY))).toBe("1d");
		expect(formatPostDate(ago(DAY + 23 * HOUR))).toBe("1d");
	});

	it("returns an absolute month/day date beyond two days", () => {
		expect(formatPostDate("2026-03-01T12:00:00.000Z")).toBe(
			new Date("2026-03-01T12:00:00.000Z").toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			})
		);
	});
});

describe("formatMemberSinceDate", () => {
	it("formats the join month and year", () => {
		expect(formatMemberSinceDate("2024-01-15T00:00:00.000Z")).toBe("Joined January 2024");
		expect(formatMemberSinceDate("2025-12-31T00:00:00.000Z")).toBe("Joined December 2025");
	});
});
