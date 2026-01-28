/**
 * Database connection for Neon PostgreSQL using Drizzle ORM
 * Uses Neon's HTTP driver which is optimized for serverless/edge environments
 * Includes retry logic for cold start handling
 */

import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

/**
 * Creates a Neon SQL client with custom timeout
 * Using 60 second timeout for cold starts and cross-region latency
 */
function createNeonClient(timeoutMs: number = 60000): NeonQueryFunction<false, false> {
  return neon(process.env.DATABASE_URL!, {
    fetchOptions: {
      signal: AbortSignal.timeout(timeoutMs),
    },
  });
}

// Create initial Neon HTTP client with extended timeout for cold starts
// Neon free tier databases sleep after inactivity and can take 5-10s to wake
// Using 60 second timeout to handle worst-case cold starts
const sql = createNeonClient(60000);

// Create Drizzle instance (pass sql client directly)
export const db: NeonHttpDatabase = drizzle(sql);

/**
 * Check if an error (or its nested cause) is a retryable timeout/connection error
 */
function isRetryableError(error: unknown): boolean {
  if (!error) return false;

  // Convert to string for checking
  const errorStr = String(error).toLowerCase();
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

  // Keywords that indicate retryable errors
  const retryableKeywords = [
    'timeout',
    'timeouterror',
    'timeout_err',
    'aborted',
    'connecting to database',
    'connection',
    'econnreset',
    'econnrefused',
    'enotfound',
    'network',
    'fetch failed',
    'failed query', // Neon wraps errors with "Failed query"
  ];

  // Check main error string and message
  for (const keyword of retryableKeywords) {
    if (errorStr.includes(keyword) || errorMessage.includes(keyword)) {
      return true;
    }
  }

  // Check nested cause recursively
  if (error instanceof Error && 'cause' in error && error.cause) {
    return isRetryableError(error.cause);
  }

  return false;
}

/**
 * Execute a database operation with retry logic for Neon cold starts.
 * Retries with exponential backoff on timeout errors.
 *
 * @param operation - Async function that performs the database operation
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param initialDelayMs - Initial delay before first retry in ms (default: 2000)
 * @returns Result of the database operation
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  initialDelayMs: number = 2000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 0) {
        console.log(`✅ Database operation succeeded on attempt ${attempt + 1}`);
      }
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if it's a retryable error (including nested causes)
      const retryable = isRetryableError(error);

      console.log(`❌ Database operation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
        lastError.message.substring(0, 100));

      if (!retryable || attempt === maxRetries) {
        console.log(`🚫 Not retrying: retryable=${retryable}, attempt=${attempt}, maxRetries=${maxRetries}`);
        throw lastError;
      }

      // Exponential backoff: 2s, 4s, 8s...
      const delayMs = initialDelayMs * Math.pow(2, attempt);
      console.log(`⏳ Retrying database operation in ${delayMs}ms (attempt ${attempt + 2}/${maxRetries + 1})...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}

/**
 * Test database connectivity - useful for debugging
 */
export async function testConnection(): Promise<boolean> {
  try {
    console.log('🔍 Testing database connection...');
    const start = Date.now();
    await sql`SELECT 1 as test`;
    const elapsed = Date.now() - start;
    console.log(`✅ Database connection successful (${elapsed}ms)`);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
