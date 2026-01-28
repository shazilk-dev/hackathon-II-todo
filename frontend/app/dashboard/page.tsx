"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { TaskList } from "@/components/tasks/TaskList";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  // Client-side redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !session) {
      router.push("/auth/sign-in");
    }
  }, [session, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="text-center animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-action-secondary flex items-center justify-center mx-auto mb-3">
            <Loader2 className="w-5 h-5 text-action-primary animate-spin" />
          </div>
          <p className="text-xs text-content-secondary">Loading your tasks...</p>
        </div>
      </div>
    );
  }

  // Don't render dashboard if not authenticated
  // (will redirect via useEffect above)
  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-surface-base">
      <Header />

      <main className="max-w-2xl mx-auto py-5 px-3 sm:px-4">
        {/* Page Header */}
        <div className="mb-5 animate-slide-up">
          <h1 className="text-lg font-semibold text-content-primary mb-1">
            My Tasks
          </h1>
          <p className="text-sm text-content-secondary">
            Organize your day, track your progress, get things done.
          </p>
        </div>

        {/* Task List */}
        <TaskList />
      </main>
    </div>
  );
}
