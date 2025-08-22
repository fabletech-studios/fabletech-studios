// Simple in-memory rate limiter for security endpoints
const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  identifier: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remainingAttempts: number; resetIn: number } {
  const now = Date.now();
  const record = attempts.get(identifier);

  // Clean up old entries
  if (record && now > record.resetAt) {
    attempts.delete(identifier);
  }

  const current = attempts.get(identifier);
  
  if (!current) {
    // First attempt
    attempts.set(identifier, {
      count: 1,
      resetAt: now + windowMs
    });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetIn: windowMs
    };
  }

  if (current.count >= maxAttempts) {
    // Rate limit exceeded
    const resetIn = current.resetAt - now;
    return {
      allowed: false,
      remainingAttempts: 0,
      resetIn: resetIn > 0 ? resetIn : 0
    };
  }

  // Increment attempt count
  current.count++;
  attempts.set(identifier, current);
  
  return {
    allowed: true,
    remainingAttempts: maxAttempts - current.count,
    resetIn: current.resetAt - now
  };
}

// Clean up old entries periodically (every hour)
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of attempts.entries()) {
    if (now > value.resetAt) {
      attempts.delete(key);
    }
  }
}, 60 * 60 * 1000);