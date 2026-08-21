import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/mocks.js";

const saveMock = vi.fn();

vi.mock("../../backend/models/userModel.js", () => {
	const User = vi.fn(function (doc) {
		Object.assign(this, doc);
		this._id = "new-user-id";
		this.followers = [];
		this.following = [];
		this.profileImg = "";
		this.coverImg = "";
		this.save = saveMock;
	});
	User.findOne = vi.fn();
	User.findById = vi.fn();
	return { default: User };
});

vi.mock("../../backend/lib/utils/generateToken.js", () => ({
	generateTokenAndSetCookie: vi.fn(),
}));

const { default: User } = await import("../../backend/models/userModel.js");
const { generateTokenAndSetCookie } = await import("../../backend/lib/utils/generateToken.js");
const { signup, login, logout, getMe } = await import("../../backend/controllers/authController.js");
const bcrypt = (await import("bcryptjs")).default;

const signupBody = {
	fullName: "Adama Chide",
	username: "adama",
	email: "adama@example.com",
	password: "secret123",
};

describe("authController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	describe("signup", () => {
		it("rejects a malformed email before touching the database", async () => {
			const res = mockRes();

			await signup(mockReq({ body: { ...signupBody, email: "not-an-email" } }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Invalid email format" });
			expect(User.findOne).not.toHaveBeenCalled();
		});

		it("rejects a duplicate username", async () => {
			User.findOne.mockResolvedValueOnce({ _id: "existing" });
			const res = mockRes();

			await signup(mockReq({ body: signupBody }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Username already exists" });
		});

		it("rejects a duplicate email", async () => {
			User.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: "existing" });
			const res = mockRes();

			await signup(mockReq({ body: signupBody }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Email already exists" });
		});

		it("rejects a password shorter than 6 characters", async () => {
			User.findOne.mockResolvedValue(null);
			const res = mockRes();

			await signup(mockReq({ body: { ...signupBody, password: "12345" } }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Password must be at least 6 characters long" });
			expect(saveMock).not.toHaveBeenCalled();
		});

		it("hashes the password, issues a token and returns the new user without it", async () => {
			User.findOne.mockResolvedValue(null);
			const res = mockRes();

			await signup(mockReq({ body: signupBody }), res);

			expect(saveMock).toHaveBeenCalledOnce();
			expect(generateTokenAndSetCookie).toHaveBeenCalledWith("new-user-id", res);
			expect(res.statusCode).toBe(201);
			expect(res.body).toMatchObject({ _id: "new-user-id", username: "adama" });
			expect(res.body).not.toHaveProperty("password");

			const storedPassword = User.mock.calls[0][0].password;
			expect(storedPassword).not.toBe(signupBody.password);
			await expect(bcrypt.compare(signupBody.password, storedPassword)).resolves.toBe(true);
		});

		it("returns 500 when saving fails", async () => {
			User.findOne.mockResolvedValue(null);
			saveMock.mockRejectedValueOnce(new Error("db down"));
			const res = mockRes();

			await signup(mockReq({ body: signupBody }), res);

			expect(res.statusCode).toBe(500);
			expect(res.body).toEqual({ error: "Internal Server Error" });
		});
	});

	describe("login", () => {
		it("returns 400 for an unknown username without leaking which field was wrong", async () => {
			User.findOne.mockResolvedValue(null);
			const res = mockRes();

			await login(mockReq({ body: { username: "ghost", password: "secret123" } }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Invalid username or password" });
		});

		it("returns 400 for a wrong password", async () => {
			const hashed = await bcrypt.hash("secret123", 10);
			User.findOne.mockResolvedValue({ _id: "user-1", password: hashed });
			const res = mockRes();

			await login(mockReq({ body: { username: "adama", password: "wrong-password" } }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Invalid username or password" });
			expect(generateTokenAndSetCookie).not.toHaveBeenCalled();
		});

		it("issues a cookie and returns the profile on success", async () => {
			const hashed = await bcrypt.hash("secret123", 10);
			User.findOne.mockResolvedValue({
				_id: "user-1",
				fullName: "Adama Chide",
				username: "adama",
				email: "adama@example.com",
				followers: [],
				following: [],
				profileImg: "",
				coverImg: "",
				password: hashed,
			});
			const res = mockRes();

			await login(mockReq({ body: { username: "adama", password: "secret123" } }), res);

			expect(generateTokenAndSetCookie).toHaveBeenCalledWith("user-1", res);
			expect(res.statusCode).toBe(200);
			expect(res.body).not.toHaveProperty("password");
		});

		it("returns 500 when the lookup throws", async () => {
			User.findOne.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await login(mockReq({ body: { username: "adama", password: "secret123" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("logout", () => {
		it("clears the jwt cookie", async () => {
			const res = mockRes();

			await logout(mockReq(), res);

			expect(res.cookies.jwt).toEqual({ value: "", options: { maxAge: 0 } });
			expect(res.statusCode).toBe(200);
		});

		it("returns 500 when clearing the cookie throws", async () => {
			const res = mockRes();
			res.cookie.mockImplementationOnce(() => {
				throw new Error("boom");
			});

			await logout(mockReq(), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("getMe", () => {
		it("returns the authenticated user without the password", async () => {
			const user = { _id: "user-1", username: "adama" };
			const select = vi.fn().mockResolvedValue(user);
			User.findById.mockReturnValue({ select });
			const res = mockRes();

			await getMe(mockReq({ user: { _id: "user-1" } }), res);

			expect(select).toHaveBeenCalledWith("-password");
			expect(res.statusCode).toBe(200);
			expect(res.body).toBe(user);
		});

		it("returns 500 when the lookup throws", async () => {
			User.findById.mockReturnValue({ select: vi.fn().mockRejectedValue(new Error("db down")) });
			const res = mockRes();

			await getMe(mockReq({ user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});
});
