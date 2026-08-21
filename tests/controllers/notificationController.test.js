import { beforeEach, describe, expect, it, vi } from "vitest";
import { mockReq, mockRes } from "../helpers/mocks.js";

vi.mock("../../backend/models/notificationModel.js", () => ({
	default: {
		find: vi.fn(),
		findById: vi.fn(),
		findByIdAndDelete: vi.fn(),
		updateMany: vi.fn(),
		deleteMany: vi.fn(),
	},
}));

vi.mock("../../backend/models/userModel.js", () => ({ default: {} }));

const { default: Notification } = await import("../../backend/models/notificationModel.js");
const { getNotifications, deleteNotification, deleteAllNotifications } = await import(
	"../../backend/controllers/notificationController.js"
);

describe("notificationController", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	describe("getNotifications", () => {
		it("returns the notifications and marks them as read", async () => {
			const notifications = [{ _id: "n1" }];
			const populate = vi.fn().mockResolvedValue(notifications);
			Notification.find.mockReturnValue({ populate });
			Notification.updateMany.mockResolvedValue({});
			const res = mockRes();

			await getNotifications(mockReq({ user: { _id: "user-1" } }), res);

			expect(Notification.find).toHaveBeenCalledWith({ to: "user-1" });
			expect(populate).toHaveBeenCalledWith({ path: "from", select: "username profileImg" });
			expect(Notification.updateMany).toHaveBeenCalledWith({ to: "user-1" }, { read: true });
			expect(res.statusCode).toBe(200);
			expect(res.body).toBe(notifications);
		});

		it("returns 500 when the query throws", async () => {
			Notification.find.mockReturnValue({
				populate: vi.fn().mockRejectedValue(new Error("db down")),
			});
			const res = mockRes();

			await getNotifications(mockReq({ user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
			expect(res.body).toEqual({ error: "db down" });
		});
	});

	describe("deleteNotification", () => {
		it("returns 404 when the notification does not exist", async () => {
			Notification.findById.mockResolvedValue(null);
			const res = mockRes();

			await deleteNotification(mockReq({ params: { id: "n1" }, user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(404);
			expect(Notification.findByIdAndDelete).not.toHaveBeenCalled();
		});

		it("returns 403 when the notification belongs to somebody else", async () => {
			Notification.findById.mockResolvedValue({ to: "user-2" });
			const res = mockRes();

			await deleteNotification(mockReq({ params: { id: "n1" }, user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(403);
			expect(res.body).toEqual({ error: "Forbidden" });
			expect(Notification.findByIdAndDelete).not.toHaveBeenCalled();
		});

		it("deletes a notification owned by the caller", async () => {
			Notification.findById.mockResolvedValue({ to: "user-1" });
			Notification.findByIdAndDelete.mockResolvedValue({});
			const res = mockRes();

			await deleteNotification(mockReq({ params: { id: "n1" }, user: { _id: "user-1" } }), res);

			expect(Notification.findByIdAndDelete).toHaveBeenCalledWith("n1");
			expect(res.statusCode).toBe(200);
		});

		it("returns 500 when the lookup throws", async () => {
			Notification.findById.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await deleteNotification(mockReq({ params: { id: "n1" }, user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
		});
	});

	describe("deleteAllNotifications", () => {
		it("deletes every notification addressed to the caller", async () => {
			Notification.deleteMany.mockResolvedValue({});
			const res = mockRes();

			await deleteAllNotifications(mockReq({ user: { _id: "user-1" } }), res);

			expect(Notification.deleteMany).toHaveBeenCalledWith({ to: "user-1" });
			expect(res.statusCode).toBe(200);
		});

		it("returns 500 when the delete throws", async () => {
			Notification.deleteMany.mockRejectedValue(new Error("db down"));
			const res = mockRes();

			await deleteAllNotifications(mockReq({ user: { _id: "user-1" } }), res);

			expect(res.statusCode).toBe(500);
			expect(res.body).toEqual({ error: "db down" });
		});
	});
});
