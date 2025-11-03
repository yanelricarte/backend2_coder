import jwt from 'jsonwebtoken';

export function attachUserFromCookie(req, _res, next) {
  try {
    const name = process.env.COOKIE_NAME || 'currentUser';
    const token = req.signedCookies?.[name] || req.cookies?.[name];
    if (!token) return next();
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch (_) {  }
  next();
}
