import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// Simple in-memory rate limiting (consider using Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.resetTime < now) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

interface RateLimitConfig {
  windowMs?: number;  // Time window in milliseconds
  max?: number;       // Max requests per window
  message?: string;   // Error message
  keyGenerator?: (req: NextRequest) => string;  // Function to generate rate limit key
}

export function rateLimit(config: RateLimitConfig = {}) {
  const {
    windowMs = 60 * 1000,  // 1 minute default
    max = 10,              // 10 requests per window default
    message = 'Too many requests, please try again later.',
    keyGenerator = (req) => {
      // Default: use IP address as key
      const headersList = headers();
      const ip = headersList.get('x-forwarded-for')?.split(',')[0] || 
                 headersList.get('x-real-ip') || 
                 'unknown';
      return ip;
    }
  } = config;

  return async function rateLimitMiddleware(request: NextRequest) {
    const key = keyGenerator(request);
    const now = Date.now();
    
    // Get or create rate limit entry
    let limitEntry = rateLimitMap.get(key);
    
    if (!limitEntry || limitEntry.resetTime < now) {
      // Create new entry
      limitEntry = {
        count: 1,
        resetTime: now + windowMs
      };
      rateLimitMap.set(key, limitEntry);
    } else {
      // Increment count
      limitEntry.count++;
    }
    
    // Check if limit exceeded
    if (limitEntry.count > max) {
      const retryAfter = Math.ceil((limitEntry.resetTime - now) / 1000);
      
      // Log rate limit violation
      console.warn(`[RATE LIMIT] Key: ${key} | Path: ${request.url} | Count: ${limitEntry.count}/${max}`);
      
      return NextResponse.json(
        { 
          success: false, 
          error: message,
          retryAfter: retryAfter
        },
        { 
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': limitEntry.resetTime.toString()
          }
        }
      );
    }
    
    // Add rate limit headers to successful requests
    return {
      rateLimited: false,
      headers: {
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': (max - limitEntry.count).toString(),
        'X-RateLimit-Reset': limitEntry.resetTime.toString()
      }
    };
  };
}

// Pre-configured rate limiters for common use cases
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 requests per 15 minutes
  message: 'Too many attempts. Please try again in 15 minutes.'
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // 10 requests per 15 minutes
  message: 'Too many authentication attempts. Please try again later.'
});

export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000,        // 1 minute
  max: 30,                    // 30 requests per minute
  message: 'API rate limit exceeded. Please slow down your requests.'
});