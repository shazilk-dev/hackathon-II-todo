// Simple in-memory rate limiter for demonstration purposes
// In production, use Redis or similar for distributed rate limiting

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const rateLimitStore: RateLimitStore = {};

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  error?: string;
}

export function rateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitStore[key]) {
    // First request from this key
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: rateLimitStore[key].resetTime
    };
  }
  
  // Check if window has passed, reset counter
  if (now > rateLimitStore[key].resetTime) {
    rateLimitStore[key] = {
      count: 1,
      resetTime: now + windowMs
    };
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: rateLimitStore[key].resetTime
    };
  }
  
  // Increment count if within window
  rateLimitStore[key].count++;
  
  const remaining = maxRequests - rateLimitStore[key].count;
  const allowed = remaining >= 0;
  
  if (!allowed) {
    // Reset time remains the same until window passes
    return {
      allowed: false,
      remaining: 0,
      resetTime: rateLimitStore[key].resetTime,
      error: `Rate limit exceeded. Try again in ${Math.ceil((rateLimitStore[key].resetTime - now) / 1000)} seconds.`
    };
  }
  
  return {
    allowed: true,
    remaining,
    resetTime: rateLimitStore[key].resetTime
  };
}

// Cleanup old entries periodically to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (now > rateLimitStore[key].resetTime) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Clean up every minute