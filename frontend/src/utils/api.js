export class ApiError extends Error {
    constructor(message, status, data) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.data = data;
    }
}

// The server can answer with an empty body (204) or with HTML (proxy/gateway
// errors). Never let a JSON parse failure mask the real status.
const parseBody = async (res) => {
    const text = await res.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
};

/**
 * Performs a request against the API and returns the parsed body.
 * Throws an ApiError carrying the status and the server-provided message,
 * so callers (and react-query) always receive a meaningful Error instance.
 */
export const apiRequest = async (url, { method = "GET", body, headers, ...rest } = {}) => {
    const hasJsonBody = body !== undefined && body !== null;

    let res;
    try {
        res = await fetch(url, {
            method,
            headers: hasJsonBody ? { "Content-Type": "application/json", ...headers } : headers,
            body: hasJsonBody ? JSON.stringify(body) : undefined,
            ...rest,
        });
    } catch (error) {
        throw new ApiError("Network error: could not reach the server", 0, { cause: error });
    }

    const data = await parseBody(res);

    if (!res.ok) {
        throw new ApiError(
            data?.error || `Request failed (${res.status} ${res.statusText})`,
            res.status,
            data
        );
    }

    return data;
};
