import { vi } from "vitest";

export const mockRes = () => {
	const res = {
		statusCode: null,
		body: null,
		cookies: {},
	};
	res.status = vi.fn((code) => {
		res.statusCode = code;
		return res;
	});
	res.json = vi.fn((payload) => {
		res.body = payload;
		return res;
	});
	res.cookie = vi.fn((name, value, options) => {
		res.cookies[name] = { value, options };
		return res;
	});
	return res;
};

export const mockReq = (overrides = {}) => ({
	body: {},
	params: {},
	cookies: {},
	...overrides,
});
