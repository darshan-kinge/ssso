import { extractBearerToken, verifyAccessToken } from "./verify.js";
export function auth(options) {
    return (req, res, next) => {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
            res.status(401).json({ error: "Missing access token", code: "unauthorized" });
            return;
        }
        try {
            req.sssoUser = verifyAccessToken(token, options);
            next();
        }
        catch {
            res.status(401).json({ error: "Invalid or expired token", code: "invalid_token" });
        }
    };
}
