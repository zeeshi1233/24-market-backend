export class DbConnectionError extends Error {
    constructor(message = "Failed to connect to MongoDB") {
        super(message);
        this.name = "DbConnectionError";
        this.statusCode = 500;
        Error.captureStackTrace(this, this.constructor);
    }
}
