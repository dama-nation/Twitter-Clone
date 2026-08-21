export const apiRequest = async (
    path,
    { method, body, fallback = "Something went wrong", ignoreError = false } = {}
) => {
    const options = {};
    if (method) options.method = method;
    if (body !== undefined) {
        options.headers = {
            "Content-Type": "application/json",
        };
        options.body = JSON.stringify(body);
    }

    const res = await fetch(path, options);
    const data = await res.json();
    if (!res.ok && !ignoreError) {
        throw new Error(data.error || fallback);
    }
    return data;
};
