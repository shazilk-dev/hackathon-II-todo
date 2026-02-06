import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? 'SET (length: ' + process.env.DATABASE_URL.length + ')' : 'NOT SET',
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'SET (length: ' + process.env.BETTER_AUTH_SECRET.length + ')' : 'NOT SET',
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'NOT SET',
  });
}
