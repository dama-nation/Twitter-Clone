import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/mocks.js";

const notificationSave = vi.fn();

vi.mock("../../backend/models/userModel.js", () => ({
	default: {
		find: vi.fn(),
		findOne: vi.fn(),
		findById: vi.fn(),
		findByIdAndUpdate: vi.fn(),
		aggregate: vi.fn(),
	},
}));

vi.mock("../../backend/models/notificationModel.js", () => {
	const Notification = vi.fn(function (doc) {
		Object.assign(this, doc);
		this.save = notificationSave;
	});
	return { default: Notification };
});

vi.mock("cloudinary", () => ({
	v2: {
		uploader: {
			upload: vi.fn(),
			destroy: vi.fn(),
		},
	},
}));

const { default: User } = await import("../../backend/models/userModel.js");
const { default: Notification } = await import("../../backend/models/notificationModel.js");
const { v2: cloudinary } = await import("cloudinary");
const { getProfile, followUser, getSuggestedUsers, updateUser, searchUsers } = await import(
	"../../backend/controllers/userController.js"
);
const bcrypt = (await import("bcryptjs")).default;

const selecting = (value) => ({ select: vi.fn().mockResolvedValue(value) });

describe("userController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	describe("getProfile", () => {
		it("returns the profile without the password", async () => {
			const user = { username: "adama" };
			const select = vi.fn().mockResolvedValue(user);
			User.findOne.mockReturnValue({ select });
			const res = mockRes();

			await getProfile(mockReq({ params: { username: "adama" } }), res);

			expect(User.findOne).toHaveBeenCalledWith({ username: "adama" });
			expect(select).toHaveBeenCalledWith("-password");
			expect(res.statusCode).toBe(200);
			expect(res.body).toBe(user);
		});

		it("returns 404 for an unknown username", async () => {
			User.findOne.mockReturnValue(selecting(null));
			const res = mockRes();

			await getProfile(mockReq({ params: { username: "ghost" } }), res);

			expect(res.statusCode).toBe(404);
			expect(res.body).toEqual({ error: "User not found" });
		});

		it("returns 500 when the lookup throws", async () => {
			User.findOne.mockReturnValue({ select: vi.fn().mockRejectedValue(new Error("db down")) });
			const res = mockRes();

			await getProfile(mockReq({ params: { username: "adama" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("followUser", () => {
		const req = (targetId, following = []) =>
			mockReq({ params: { id: targetId }, user: { _id: "user-1" } });

		it("refuses self-follow", async () => {
			User.findById.mockResolvedValue({ following: [] });
			const res = mockRes();

			await followUser(req("user-1"), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "You cannot follow / unfollow yourself" });
			expect(User.findByIdAndUpdate).not.toHaveBeenCalled();
		});

		it("returns 404 when the target user is missing", async () => {
			User.findById.mockResolvedValueOnce({ following: [] }).mockResolvedValueOnce(null);
			const res = mockRes();

			await followUser(req("user-2"), res);

			expect(res.statusCode).toBe(404);
		});

		it("follows a user and notifies them", async () => {
			User.findById
				.mockResolvedValueOnce({ _id: "user-1", following: [] })
				.mockResolvedValueOnce({ _id: "user-2" });
			User.findByIdAndUpdate.mockResolvedValue({});
			const res = mockRes();

			await followUser(req("user-2"), res);

			expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-2", {
				$push: { followers: "user-1" },
			});
			expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-1", {
				$push: { following: "user-2" },
			});
			expect(Notification).toHaveBeenCalledWith({ type: "follow", from: "user-1", to: "user-2" });
			expect(notificationSave).toHaveBeenCalledOnce();
			expect(res.body).toEqual({ message: "User followed successfully" });
		});

		it("unfollows an already followed user without notifying", async () => {
			User.findById
				.mockResolvedValueOnce({ _id: "user-1", following: ["user-2"] })
				.mockResolvedValueOnce({ _id: "user-2" });
			User.findByIdAndUpdate.mockResolvedValue({});
			const res = mockRes();

			await followUser(req("user-2"), res);

			expect(User.findByIdAndUpdate).toHaveBeenCalledWith("user-2", {
				$pull: { followers: "user-1" },
			});
			expect(notificationSave).not.toHaveBeenCalled();
			expect(res.body).toEqual({ message: "User unfollowed successfully" });
		});

		it("returns 500 when the update throws", async () => {
			User.findById.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await followUser(req("user-2"), res);

			expect(res.statusCode).toBe(500);
			expect(res.body).toEqual({ error: "db down" });
		});
	});

	describe("getSuggestedUsers", () => {
		it("excludes already followed users, caps the list at four and hides passwords", async () => {
			User.findById.mockReturnValue(selecting({ following: ["user-2"] }));
			User.aggregate.mockResolvedValue(
				["user-2", "user-3", "user-4", "user-5", "user-6", "user-7"].map((id) => ({
					_id: id,
					password: "hashed",
				}))
			);
			const res = mockRes();

			await getSuggestedUsers(mockReq({ user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(200);
			expect(res.body).toHaveLength(4);
			expect(res.body.map((user) => user._id)).toEqual(["user-3", "user-4", "user-5", "user-6"]);
			expect(res.body.every((user) => user.password === null)).toBe(true);
		});

		it("returns 500 when the aggregation throws", async () => {
			User.findById.mockReturnValue(selecting({ following: [] }));
			User.aggregate.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await getSuggestedUsers(mockReq({ user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("updateUser", () => {
		const existingUser = () => ({
			_id: "user-1",
			fullName: "Adama Chide",
			email: "adama@example.com",
			username: "adama",
			bio: "old bio",
			link: "",
			profileImg: "",
			coverImg: "",
			password: "hashed",
			save: vi.fn().mockResolvedValue(undefined),
		});

		it("returns 404 when the user no longer exists", async () => {
			User.findById.mockResolvedValue(null);
			const res = mockRes();

			await updateUser(mockReq({ body: {}, user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(404);
		});

		it("requires both passwords when only one is supplied", async () => {
			User.findById.mockResolvedValue(existingUser());
			const res = mockRes();

			await updateUser(mockReq({ body: { newPassword: "newsecret" }, user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Please provide both current and new password" });
		});

		it("rejects an incorrect current password", async () => {
			const user = existingUser();
			user.password = await bcrypt.hash("secret123", 10);
			User.findById.mockResolvedValue(user);
			const res = mockRes();

			await updateUser(
				mockReq({
					body: { currentPassword: "wrong-password", newPassword: "newsecret" },
					user: { _id: "user-1" },
				}),
				res
			);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Current Password is incorrect" });
			expect(user.save).not.toHaveBeenCalled();
		});

		it("rejects a short new password", async () => {
			const user = existingUser();
			user.password = await bcrypt.hash("secret123", 10);
			User.findById.mockResolvedValue(user);
			const res = mockRes();

			await updateUser(
				mockReq({
					body: { currentPassword: "secret123", newPassword: "123" },
					user: { _id: "user-1" },
				}),
				res
			);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Password must be at least 6 characters long" });
		});

		it("hashes an accepted new password", async () => {
			const user = existingUser();
			user.password = await bcrypt.hash("secret123", 10);
			User.findById.mockResolvedValue(user);
			const res = mockRes();

			await updateUser(
				mockReq({
					body: { currentPassword: "secret123", newPassword: "newsecret" },
					user: { _id: "user-1" },
				}),
				res
			);

			expect(user.save).toHaveBeenCalledOnce();
			expect(res.statusCode).toBe(200);
			expect(res.body.password).toBeNull();
		});

		it("replaces existing images on cloudinary and stores the new urls", async () => {
			const user = existingUser();
			user.profileImg = "https://res.cloudinary.com/demo/image/upload/old-profile.png";
			user.coverImg = "https://res.cloudinary.com/demo/image/upload/old-cover.png";
			User.findById.mockResolvedValue(user);
			cloudinary.uploader.upload
				.mockResolvedValueOnce({ secure_url: "https://cdn/new-profile.png" })
				.mockResolvedValueOnce({ secure_url: "https://cdn/new-cover.png" });
			const res = mockRes();

			await updateUser(
				mockReq({
					body: { profileImg: "data:profile", coverImg: "data:cover" },
					user: { _id: "user-1" },
				}),
				res
			);

			expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("old-profile");
			expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("old-cover");
			expect(user.profileImg).toBe("https://cdn/new-profile.png");
			expect(user.coverImg).toBe("https://cdn/new-cover.png");
		});

		it("keeps existing values for fields that are not supplied", async () => {
			const user = existingUser();
			User.findById.mockResolvedValue(user);
			const res = mockRes();

			await updateUser(mockReq({ body: { bio: "new bio" }, user: { _id: "user-1" } }), res);

			expect(user.bio).toBe("new bio");
			expect(user.fullName).toBe("Adama Chide");
			expect(user.username).toBe("adama");
			expect(res.statusCode).toBe(200);
		});

		it("returns 500 when saving throws", async () => {
			const user = existingUser();
			user.save.mockRejectedValue(new Error("db down"));
			User.findById.mockResolvedValue(user);
			const res = mockRes();

			await updateUser(mockReq({ body: { bio: "new bio" }, user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("searchUsers", () => {
		it("returns an empty list for an empty query without querying", async () => {
			const res = mockRes();

			await searchUsers(mockReq({ params: {} }), res);

			expect(res.statusCode).toBe(200);
			expect(res.body).toEqual([]);
			expect(User.find).not.toHaveBeenCalled();
		});

		it("matches username or full name case-insensitively", async () => {
			const users = [{ username: "adama" }];
			User.find.mockReturnValue(selecting(users));
			const res = mockRes();

			await searchUsers(mockReq({ params: { query: "ada" } }), res);

			expect(User.find).toHaveBeenCalledWith({
				$or: [
					{ username: { $regex: "ada", $options: "i" } },
					{ fullName: { $regex: "ada", $options: "i" } },
				],
			});
			expect(res.body).toBe(users);
		});

		it("returns 500 when the search throws", async () => {
			User.find.mockReturnValue({ select: vi.fn().mockRejectedValue(new Error("db down")) });
			const res = mockRes();

			await searchUsers(mockReq({ params: { query: "ada" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});
});
