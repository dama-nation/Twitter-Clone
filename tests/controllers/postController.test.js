import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/mocks.js";

const postSave = vi.fn();
const notificationSave = vi.fn();

vi.mock("../../backend/models/postModel.js", () => {
	const Post = vi.fn(function (doc) {
		Object.assign(this, doc);
		this.save = postSave;
	});
	Post.find = vi.fn();
	Post.findById = vi.fn();
	Post.findByIdAndDelete = vi.fn();
	Post.updateOne = vi.fn();
	return { default: Post };
});

vi.mock("../../backend/models/userModel.js", () => ({
	default: {
		find: vi.fn(),
		findOne: vi.fn(),
		findById: vi.fn(),
		updateOne: vi.fn(),
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
	v2: { uploader: { upload: vi.fn(), destroy: vi.fn() } },
}));

const { default: Post } = await import("../../backend/models/postModel.js");
const { default: User } = await import("../../backend/models/userModel.js");
const { default: Notification } = await import("../../backend/models/notificationModel.js");
const { v2: cloudinary } = await import("cloudinary");
const {
	createPost,
	deletePost,
	commentOnPost,
	likeUnlikePost,
	getAllPosts,
	getLikedPosts,
	getFollowingPosts,
	getUserPosts,
} = await import("../../backend/controllers/postController.js");

// Mirrors the chained `.populate()` calls the controllers make on a query.
const populatingQuery = (result, { sorted = false } = {}) => {
	const query = {
		populate: vi.fn(() => query),
		then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
	};
	return sorted ? { sort: vi.fn(() => query) } : query;
};

describe("postController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
	});

	describe("createPost", () => {
		const req = (body) => mockReq({ body, user: { _id: "user-1" } });

		it("returns 404 when the author no longer exists", async () => {
			User.findById.mockResolvedValue(null);
			const res = mockRes();

			await createPost(req({ text: "hello" }), res);

			expect(res.statusCode).toBe(404);
		});

		it("requires text or an image", async () => {
			User.findById.mockResolvedValue({ _id: "user-1" });
			const res = mockRes();

			await createPost(req({}), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Please provide text or image" });
		});

		it("creates a text-only post", async () => {
			User.findById.mockResolvedValue({ _id: "user-1" });
			postSave.mockResolvedValue(undefined);
			const res = mockRes();

			await createPost(req({ text: "hello" }), res);

			expect(Post).toHaveBeenCalledWith({ user: "user-1", text: "hello", image: undefined });
			expect(postSave).toHaveBeenCalledOnce();
			expect(res.statusCode).toBe(201);
		});

		it("accepts the legacy `img` field and stores the uploaded url", async () => {
			User.findById.mockResolvedValue({ _id: "user-1" });
			cloudinary.uploader.upload.mockResolvedValue({ secure_url: "https://cdn/post.png" });
			postSave.mockResolvedValue(undefined);
			const res = mockRes();

			await createPost(req({ img: "data:image" }), res);

			expect(cloudinary.uploader.upload).toHaveBeenCalledWith("data:image");
			expect(Post.mock.calls[0][0].image).toBe("https://cdn/post.png");
			expect(res.statusCode).toBe(201);
		});

		it("returns 400 when the image upload yields no url", async () => {
			User.findById.mockResolvedValue({ _id: "user-1" });
			cloudinary.uploader.upload.mockResolvedValue({});
			const res = mockRes();

			await createPost(req({ image: "data:image" }), res);

			expect(res.statusCode).toBe(400);
			expect(res.body).toEqual({ error: "Image upload failed" });
			expect(postSave).not.toHaveBeenCalled();
		});

		it("returns 500 when saving throws", async () => {
			User.findById.mockResolvedValue({ _id: "user-1" });
			postSave.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await createPost(req({ text: "hello" }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("deletePost", () => {
		const req = () => mockReq({ params: { id: "post-1" }, user: { _id: "user-1" } });

		it("returns 404 for a missing post", async () => {
			Post.findById.mockResolvedValue(null);
			const res = mockRes();

			await deletePost(req(), res);

			expect(res.statusCode).toBe(404);
		});

		it("returns 401 when the caller is not the author", async () => {
			Post.findById.mockResolvedValue({ user: "user-2" });
			const res = mockRes();

			await deletePost(req(), res);

			expect(res.statusCode).toBe(401);
			expect(Post.findByIdAndDelete).not.toHaveBeenCalled();
		});

		it("removes the attached image from cloudinary before deleting", async () => {
			Post.findById.mockResolvedValue({
				user: "user-1",
				image: "https://res.cloudinary.com/demo/image/upload/abc123.png",
			});
			Post.findByIdAndDelete.mockResolvedValue({});
			const res = mockRes();

			await deletePost(req(), res);

			expect(cloudinary.uploader.destroy).toHaveBeenCalledWith("abc123");
			expect(Post.findByIdAndDelete).toHaveBeenCalledWith("post-1");
			expect(res.statusCode).toBe(200);
		});

		it("deletes an image-less post without calling cloudinary", async () => {
			Post.findById.mockResolvedValue({ user: "user-1" });
			Post.findByIdAndDelete.mockResolvedValue({});
			const res = mockRes();

			await deletePost(req(), res);

			expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
			expect(res.statusCode).toBe(200);
		});

		it("returns 500 when the lookup throws", async () => {
			Post.findById.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await deletePost(req(), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("commentOnPost", () => {
		const req = (body) => mockReq({ body, params: { id: "post-1" }, user: { _id: "user-1" } });

		it("requires comment text", async () => {
			const res = mockRes();

			await commentOnPost(req({}), res);

			expect(res.statusCode).toBe(400);
			expect(Post.findById).not.toHaveBeenCalled();
		});

		it("returns 404 for a missing post", async () => {
			Post.findById.mockResolvedValue(null);
			const res = mockRes();

			await commentOnPost(req({ text: "nice" }), res);

			expect(res.statusCode).toBe(404);
		});

		it("appends the comment and returns the updated post", async () => {
			const post = { comments: [], save: vi.fn().mockResolvedValue(undefined) };
			Post.findById.mockResolvedValue(post);
			const res = mockRes();

			await commentOnPost(req({ text: "nice" }), res);

			expect(post.comments).toEqual([{ user: "user-1", text: "nice" }]);
			expect(post.save).toHaveBeenCalledOnce();
			expect(res.statusCode).toBe(200);
			expect(res.body).toBe(post);
		});

		it("returns 500 when saving throws", async () => {
			Post.findById.mockResolvedValue({
				comments: [],
				save: vi.fn().mockRejectedValue(new Error("db down")),
			});
			const res = mockRes();

			await commentOnPost(req({ text: "nice" }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("likeUnlikePost", () => {
		const req = () => mockReq({ params: { id: "post-1" }, user: { _id: "user-1" } });

		it("returns 404 for a missing post", async () => {
			Post.findById.mockResolvedValue(null);
			const res = mockRes();

			await likeUnlikePost(req(), res);

			expect(res.statusCode).toBe(404);
		});

		it("likes a post, tracks it on the user and notifies the author", async () => {
			const post = { user: "user-2", likes: [], save: vi.fn().mockResolvedValue(undefined) };
			Post.findById.mockResolvedValue(post);
			User.updateOne.mockResolvedValue({});
			const res = mockRes();

			await likeUnlikePost(req(), res);

			expect(post.likes).toContain("user-1");
			expect(User.updateOne).toHaveBeenCalledWith(
				{ _id: "user-1" },
				{ $push: { likedPosts: "post-1" } }
			);
			expect(Notification).toHaveBeenCalledWith({ from: "user-1", to: "user-2", type: "like" });
			expect(res.statusCode).toBe(200);
		});

		it("does not notify when a user likes their own post", async () => {
			Post.findById.mockResolvedValue({
				user: "user-1",
				likes: [],
				save: vi.fn().mockResolvedValue(undefined),
			});
			User.updateOne.mockResolvedValue({});
			const res = mockRes();

			await likeUnlikePost(req(), res);

			expect(notificationSave).not.toHaveBeenCalled();
		});

		it("unlikes a post and returns the remaining likes", async () => {
			Post.findById.mockResolvedValue({ user: "user-2", likes: ["user-1", "user-3"] });
			Post.updateOne.mockResolvedValue({});
			User.updateOne.mockResolvedValue({});
			const res = mockRes();

			await likeUnlikePost(req(), res);

			expect(Post.updateOne).toHaveBeenCalledWith(
				{ _id: "post-1" },
				{ $pull: { likes: "user-1" } }
			);
			expect(res.body).toEqual(["user-3"]);
		});

		it("returns a generic 500 when the update throws", async () => {
			Post.findById.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await likeUnlikePost(req(), res);

			expect(res.statusCode).toBe(500);
			expect(res.body).toEqual({ error: "Internal server error" });
		});
	});

	describe("getAllPosts", () => {
		it("returns posts newest first with authors and commenters populated", async () => {
			const posts = [{ _id: "post-1" }];
			Post.find.mockReturnValue(populatingQuery(posts, { sorted: true }));
			const res = mockRes();

			await getAllPosts(mockReq(), res);

			expect(res.statusCode).toBe(200);
			expect(res.body).toBe(posts);
		});

		it("returns an empty array when there are no posts", async () => {
			Post.find.mockReturnValue(populatingQuery([], { sorted: true }));
			const res = mockRes();

			await getAllPosts(mockReq(), res);

			expect(res.statusCode).toBe(200);
			expect(res.body).toEqual([]);
		});

		it("returns 500 when the query throws", async () => {
			Post.find.mockImplementation(() => {
				throw new Error("db down");
			});
			const res = mockRes();

			await getAllPosts(mockReq(), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("getLikedPosts", () => {
		it("returns 404 for an unknown user", async () => {
			User.findById.mockResolvedValue(null);
			const res = mockRes();

			await getLikedPosts(mockReq({ params: { id: "user-1" } }), res);

			expect(res.statusCode).toBe(404);
		});

		it("returns the posts the user liked", async () => {
			const posts = [{ _id: "post-1" }];
			User.findById.mockResolvedValue({ likedPosts: ["post-1"] });
			Post.find.mockReturnValue(populatingQuery(posts));
			const res = mockRes();

			await getLikedPosts(mockReq({ params: { id: "user-1" } }), res);

			expect(Post.find).toHaveBeenCalledWith({ _id: { $in: ["post-1"] } });
			expect(res.body).toBe(posts);
		});

		it("returns 500 when the query throws", async () => {
			User.findById.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await getLikedPosts(mockReq({ params: { id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("getFollowingPosts", () => {
		it("returns posts authored by the accounts the user follows", async () => {
			const posts = [{ _id: "post-1" }];
			User.findById.mockResolvedValue({ following: ["user-2"] });
			Post.find.mockReturnValue(populatingQuery(posts, { sorted: true }));
			const res = mockRes();

			await getFollowingPosts(mockReq({ user: { _id: "user-1" } }), res);

			expect(Post.find).toHaveBeenCalledWith({ user: { $in: ["user-2"] } });
			expect(res.body).toBe(posts);
		});

		it("returns 500 when the query throws", async () => {
			User.findById.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await getFollowingPosts(mockReq({ user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("getUserPosts", () => {
		it("returns the posts of the requested username", async () => {
			const posts = [{ _id: "post-1" }];
			User.findOne.mockResolvedValue({ _id: "user-1" });
			Post.find.mockReturnValue(populatingQuery(posts, { sorted: true }));
			const res = mockRes();

			await getUserPosts(mockReq({ params: { username: "adama" } }), res);

			expect(Post.find).toHaveBeenCalledWith({ user: "user-1" });
			expect(res.body).toBe(posts);
		});

		it("returns 500 when the lookup throws", async () => {
			User.findOne.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await getUserPosts(mockReq({ params: { username: "adama" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});
});
