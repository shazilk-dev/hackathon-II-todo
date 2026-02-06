"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, CheckSquare, User, MessageSquare, LayoutDashboard } from "lucide-react";

export function Header() {
  const { data: session, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <header className="sticky top-3 z-50 mx-3 sm:mx-4 lg:mx-6">
      <nav className="flex items-center justify-between h-12 max-w-5xl mx-auto px-4 bg-surface-overlay backdrop-blur-xl rounded-xl border border-border-subtle shadow-md">
        {/* Logo & Brand */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-action-primary text-content-inverse">
              <CheckSquare className="w-3.5 h-3.5" />
            </div>
            <h1 className="text-sm font-semibold text-content-primary tracking-tight">
              TaskFlow
            </h1>
          </div>

          {/* Navigation Links */}
          {isAuthenticated && (
            <nav className="hidden sm:flex items-center gap-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/chat"
                className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover rounded-lg transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat</span>
              </Link>
            </nav>
          )}
        </div>

        {/* User Section */}
        {isAuthenticated && (
          <div className="flex items-center gap-2">
            {/* User Info */}
            <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-lg bg-surface-base">
              <div className="flex items-center justify-center w-5 h-5 rounded-full bg-action-secondary">
                <User className="w-3 h-3 text-action-primary" />
              </div>
              <span className="text-xs text-content-secondary max-w-[150px] truncate">
                {session?.user?.name || session?.user?.email?.split('@')[0] || 'User'}
              </span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover rounded-lg transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </nav>
    </header>
  );
}
