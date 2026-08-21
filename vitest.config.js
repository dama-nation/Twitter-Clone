import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.js"],
		setupFiles: ["tests/setup.js"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "lcov"],
			include: ["backend/**/*.js", "frontend/src/utils/date/**/*.js"],
			exclude: ["backend/main.js", "backend/models/**", "backend/routes/**"],
		},
	},
});
