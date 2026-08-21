/**
 * Creates an Error carrying an HTTP status code and a message that is safe to
 * send to the client. Anything thrown without `expose` is reported to the
 * client as a generic message by the error middleware.
 */
export const httpError = (status, message, options) => {
    const error = new Error(message, options);
    error.status = status;
    error.expose = true;
    return error;
};
