import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("mongoose", () => ({
	default: { connect: vi.fn() },
}));

const { default: mongoose } = await import("mongoose");
const { default: connectMongoDB } = await import("../../backend/db/connect.js");

describe("connectMongoDB", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.spyOn(console, "log").mockImplementation(() => {});
		vi.spyOn(console, "error").mockImplementation(() => {});
		process.env.MONGODB_URI = "mongodb://localhost:27017/test";
	});

	it("connects using MONGODB_URI", async () => {
		mongoose.connect.mockResolvedValue({ connection: { host: "localhost" } });

		await connectMongoDB();

		expect(mongoose.connect).toHaveBeenCalledWith("mongodb://localhost:27017/test");
	});

	it("exits the process when the connection fails", async () => {
		mongoose.connect.mockRejectedValue(new Error("unreachable"));
		const exit = vi.spyOn(process, "exit").mockImplementation(() => {});

		await connectMongoDB();

		expect(exit).toHaveBeenCalledWith(1);
		exit.mockRestore();
	});
});
