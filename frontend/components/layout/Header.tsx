"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import { signOut } from "@/lib/auth-client";
import { clearTokenCache } from "@/lib/api";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  LogOut,
  User,
  MessageSquare,
  LayoutDashboard,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

export function Header() {
  const { data: session, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    // Clear cached JWT token
    clearTokenCache();
    // Call Better Auth sign-out
    await signOut();
    // Manually clear auth cookies in case of domain mismatch
    document.cookie = 'better-auth.session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    router.push("/");
    router.refresh();
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <header className="sticky top-3 z-50 mx-3 sm:mx-5 lg:mx-8">
      <nav className="flex items-center justify-between h-14 sm:h-16 max-w-6xl mx-auto px-4 sm:px-6 bg-surface-overlay/80 backdrop-blur-2xl rounded-2xl border border-border-subtle shadow-lg">
        {/* Logo & Brand */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <Image
              src="/logo.png"
              alt="Fehrist Logo"
              width={36}
              height={36}
              className="w-8 h-8 sm:w-9 sm:h-9 object-contain"
              priority
            />
            <div className="flex flex-col -space-y-0.5">
              <span className="text-[15px] sm:text-base font-bold text-content-primary tracking-tight">
                Fehrist
              </span>
              <span className="text-[10px] text-content-tertiary font-medium">
                فہرست
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          {isAuthenticated && (
            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? "bg-action-primary/10 text-action-primary"
                        : "text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* User Section */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 sm:gap-3">
            {/* User Info - Desktop */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-base/80 border border-border-subtle">
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-br from-action-primary to-purple-500 text-white shadow-sm">
                <span className="text-xs font-semibold">
                  {(
                    session?.user?.name?.[0] ||
                    session?.user?.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </span>
              </div>
              <span className="text-[13px] font-medium text-content-secondary max-w-[140px] truncate">
                {session?.user?.name ||
                  session?.user?.email?.split("@")[0] ||
                  "User"}
              </span>
            </div>

            {/* Sign Out Button - Desktop */}
            <button
              onClick={handleSignOut}
              className="hidden sm:flex items-center gap-2 h-9 px-3.5 text-[13px] font-medium text-content-secondary hover:text-state-error hover:bg-state-error-light rounded-xl transition-all duration-200"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-xl text-content-secondary hover:bg-action-ghost-hover transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        )}
      </nav>

      {/* Mobile Dropdown Menu */}
      {isAuthenticated && mobileMenuOpen && (
        <div className="sm:hidden mt-2 max-w-6xl mx-auto p-3 bg-surface-overlay/95 backdrop-blur-2xl rounded-2xl border border-border-subtle shadow-xl animate-slide-down">
          <div className="space-y-1">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 h-11 px-4 text-sm font-medium rounded-xl transition-all ${
                    isActive
                      ? "bg-action-primary/10 text-action-primary"
                      : "text-content-secondary hover:text-content-primary hover:bg-action-ghost-hover"
                  }`}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  <span>{label}</span>
                </Link>
              );
            })}
            <div className="h-px bg-border-subtle my-2" />
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-action-primary to-purple-500 text-white">
                <span className="text-xs font-semibold">
                  {(
                    session?.user?.name?.[0] ||
                    session?.user?.email?.[0] ||
                    "U"
                  ).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-content-primary">
                {session?.user?.name ||
                  session?.user?.email?.split("@")[0] ||
                  "User"}
              </span>
            </div>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                handleSignOut();
              }}
              className="flex items-center gap-3 w-full h-11 px-4 text-sm font-medium text-state-error hover:bg-state-error-light rounded-xl transition-all"
            >
              <LogOut className="w-[18px] h-[18px]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
