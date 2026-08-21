export const asyncHandler = (handler, errorContext = "") => (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch((error) => {
        if (errorContext) {
            error.message = `${errorContext} ${error.message}`;
        }
        next(error);
    });
};
