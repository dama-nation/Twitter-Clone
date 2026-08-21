export const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
