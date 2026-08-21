import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import { mockReq, mockRes } from "../helpers/mocks.js";

vi.mock("../../backend/models/userModel.js", () => ({
	default: { findById: vi.fn() },
}));

const { default: User } = await import("../../backend/models/userModel.js");
const { protectRoute } = await import("../../backend/middleware/protectRoute.js");

const validToken = () => jwt.sign({ userId: "user-1" }, process.env.JWT_SECRET);
const selecting = (user) => ({ select: vi.fn().mockResolvedValue(user) });

describe("protectRoute", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	it("rejects requests without a jwt cookie", async () => {
		const res = mockRes();
		const next = vi.fn();

		await protectRoute(mockReq(), res, next);

		expect(res.statusCode).toBe(401);
		expect(res.body).toEqual({ error: "Unauthorized: No Token Provided" });
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 500 when the token cannot be verified", async () => {
		const res = mockRes();
		const next = vi.fn();

		await protectRoute(mockReq({ cookies: { jwt: "not-a-token" } }), res, next);

		expect(res.statusCode).toBe(500);
		expect(res.body).toEqual({ error: "Internal Server Error" });
		expect(next).not.toHaveBeenCalled();
	});

	it("returns 401 when the token points at a missing user", async () => {
		User.findById.mockReturnValue(selecting(null));
		const res = mockRes();
		const next = vi.fn();

		await protectRoute(mockReq({ cookies: { jwt: validToken() } }), res, next);

		expect(res.statusCode).toBe(401);
		expect(res.body).toEqual({ error: "User not found" });
		expect(next).not.toHaveBeenCalled();
	});

	it("attaches the password-less user and calls next", async () => {
		const user = { _id: "user-1", username: "adama" };
		const select = vi.fn().mockResolvedValue(user);
		User.findById.mockReturnValue({ select });
		const req = mockReq({ cookies: { jwt: validToken() } });
		const res = mockRes();
		const next = vi.fn();

		await protectRoute(req, res, next);

		expect(User.findById).toHaveBeenCalledWith("user-1");
		expect(select).toHaveBeenCalledWith("-password");
		expect(req.user).toBe(user);
		expect(next).toHaveBeenCalledOnce();
		expect(res.status).not.toHaveBeenCalled();
	});

	it("returns 500 when the user lookup throws", async () => {
		User.findById.mockReturnValue({ select: vi.fn().mockRejectedValue(new Error("db down")) });
		const res = mockRes();
		const next = vi.fn();

		await protectRoute(mockReq({ cookies: { jwt: validToken() } }), res, next);

		expect(res.statusCode).toBe(500);
		expect(next).not.toHaveBeenCalled();
	});
});
