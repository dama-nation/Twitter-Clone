import { describe, expect, it, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { generateTokenAndSetCookie } from "../../backend/lib/utils/generateToken.js";
import { mockRes } from "../helpers/mocks.js";

describe("generateTokenAndSetCookie", () => {
	const originalEnv = process.env.NODE_ENV;

	afterEach(() => {
		process.env.NODE_ENV = originalEnv;
	});

	it("signs a token containing the user id", () => {
		const res = mockRes();
		generateTokenAndSetCookie("user-1", res);

		const decoded = jwt.verify(res.cookies.jwt.value, process.env.JWT_SECRET);
		expect(decoded.userId).toBe("user-1");
		expect(decoded.exp - decoded.iat).toBe(15 * 24 * 60 * 60);
	});

	it("sets an httpOnly, strict cookie that lives for 15 days", () => {
		const res = mockRes();
		generateTokenAndSetCookie("user-1", res);

		expect(res.cookies.jwt.options).toMatchObject({
			maxAge: 15 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			sameSite: "strict",
		});
	});

	it("marks the cookie insecure in development and secure elsewhere", () => {
		process.env.NODE_ENV = "development";
		const devRes = mockRes();
		generateTokenAndSetCookie("user-1", devRes);
		expect(devRes.cookies.jwt.options.secure).toBe(false);

		process.env.NODE_ENV = "production";
		const prodRes = mockRes();
		generateTokenAndSetCookie("user-1", prodRes);
		expect(prodRes.cookies.jwt.options.secure).toBe(true);
	});
});
