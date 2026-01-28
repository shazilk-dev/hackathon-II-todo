import { NextRequest, NextResponse } from "next/server";
import { db, withRetry } from "@/lib/db";
import { users, accounts } from "@/lib/auth-schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: { message: "Email and password are required" } },
        { status: 400 }
      );
    }

    // Check if user already exists (with retry for Neon cold starts)
    const existingUser = await withRetry(async () => {
      return db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    });

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: { message: "User already exists" } },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique IDs
    const userId = crypto.randomUUID();
    const accountId = crypto.randomUUID();

    // Create user (with retry for Neon cold starts)
    const [newUser] = await withRetry(async () => {
      return db
        .insert(users)
        .values({
          id: userId,
          email,
          name: name || "User",
          emailVerified: false,
        })
        .returning();
    });

    // Create account with password (with retry for Neon cold starts)
    await withRetry(async () => {
      return db.insert(accounts).values({
        id: accountId,
        userId: newUser.id,
        accountId: newUser.id,
        providerId: "credentials",
        password: hashedPassword,
      });
    });

    return NextResponse.json(
      {
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: { message: "Failed to create account" } },
      { status: 500 }
    );
  }
}
