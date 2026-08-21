const GENERIC_MESSAGE = "Internal Server Error";

export const notFoundHandler = (req, res) => {
    res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}` });
};

const classify = (error) => {
    if (error.status || error.statusCode) {
        return { status: error.status || error.statusCode, expose: Boolean(error.expose) };
    }
    // Malformed JSON / urlencoded bodies rejected by body-parser
    if (error.type === "entity.parse.failed") {
        return { status: 400, expose: false, message: "Malformed request body" };
    }
    if (error.type === "entity.too.large") {
        return { status: 413, expose: false, message: "Request body too large" };
    }
    if (error.name === "ValidationError") {
        return { status: 400, expose: true };
    }
    if (error.name === "CastError") {
        return { status: 400, expose: false, message: "Invalid identifier" };
    }
    if (error.code === 11000) {
        return { status: 409, expose: false, message: "Resource already exists" };
    }
    return { status: 500, expose: false };
};

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export const errorHandler = (error, req, res, next) => {
    const { status, expose, message } = classify(error);

    if (status >= 500) {
        console.error(`Unhandled error on ${req.method} ${req.originalUrl}:`, error);
    } else {
        console.warn(`${status} on ${req.method} ${req.originalUrl}: ${error.message}`);
    }

    // The response already started streaming, so the client will see a broken
    // response no matter what; make sure the failure is not lost silently.
    if (res.headersSent) {
        res.destroy(error);
        return;
    }

    const body = message || (expose ? error.message : GENERIC_MESSAGE);
    res.status(status).json({ error: body });
};
