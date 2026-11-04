const requests = new Map();

function rateLimit({ windowMs, maxRequests, message }) {
  return (req, res, next) => {
    const userId = req.user?.id;
    if (userId === undefined || userId === null) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const key = `${req.baseUrl}:${userId}:${message}`;
    const now = Date.now();
    const active = (requests.get(key) || []).filter((timestamp) => now - timestamp < windowMs);
    if (active.length >= maxRequests) {
      requests.set(key, active);
      return res.status(429).json({ error: message, code: 'RATE_LIMITED' });
    }
    active.push(now);
    requests.set(key, active);
    return next();
  };
}

module.exports = {
  chat: rateLimit({
    windowMs: 60 * 1000,
    maxRequests: 20,
    message: 'Too many tutor requests. Please wait a minute and try again.',
  }),
  upload: rateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
    message: 'Too many document uploads. Please try again later.',
  }),
};
