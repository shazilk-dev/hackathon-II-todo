import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Better Auth provides its own Next.js App Router integration
export const { GET, POST } = toNextJsHandler(auth);

// Force API route to run in Node.js runtime to avoid Edge Runtime issues with Better Auth telemetry
export const runtime = "nodejs";