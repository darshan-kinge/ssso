import jwt from "jsonwebtoken";
export function extractBearerToken(authorization) {
    if (!authorization?.startsWith("Bearer "))
        return null;
    const token = authorization.slice(7).trim();
    return token || null;
}
export function verifyAccessToken(token, options) {
    const decoded = jwt.verify(token, options.jwtSecret, {
        algorithms: ["HS256"],
    });
    if (!decoded.sub || !decoded.email) {
        throw new Error("Invalid token payload");
    }
    if (options.clientId && decoded.client_id !== options.clientId) {
        throw new Error("Token client_id mismatch");
    }
    return decoded;
}
