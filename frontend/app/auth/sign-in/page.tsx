"use client";

import { useState, FormEvent, useCallback, useEffect } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import { validateEmail, validatePassword, debounce } from "@/lib/validation";
import { Loader2, LogIn, AlertCircle, CheckSquare } from "lucide-react";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("User already authenticated, redirecting to dashboard");
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  // Field-level validation states
  const [emailError, setEmailError] = useState<string | undefined>();
  const [emailSuccess, setEmailSuccess] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  // Clear form-level error when user starts typing (only on input change, not on error change)
  const [prevEmail, setPrevEmail] = useState(email);
  const [prevPassword, setPrevPassword] = useState(password);

  useEffect(() => {
    // Only clear error if user actually changed the input (not just on mount or error set)
    if (error && (email !== prevEmail || password !== prevPassword)) {
      setError(null);
    }
    setPrevEmail(email);
    setPrevPassword(password);
  }, [email, password, error, prevEmail, prevPassword]);

  // Debounced email validation
  const validateEmailDebounced = useCallback(
    debounce((value: string) => {
      const result = validateEmail(value);
      setEmailError(result.isValid ? undefined : result.message);
      setEmailSuccess(result.isValid && value ? "Valid email" : undefined);
    }, 500),
    []
  );

  // Real-time password validation
  const validatePasswordField = useCallback((value: string) => {
    if (!value) {
      setPasswordError(undefined);
      return;
    }
    const result = validatePassword(value, false);
    setPasswordError(result.isValid ? undefined : result.message);
  }, []);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    validateEmailDebounced(value);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    validatePasswordField(value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Final validation before submit
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password);

    if (!emailValidation.isValid) {
      setEmailError(emailValidation.message);
      return;
    }

    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting sign-in process...");

      const response = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      console.log("Sign-in response:", response);

      // Check for errors in the response
      if (response?.error) {
        console.error("Sign-in error:", response.error);
        throw new Error(response.error || "Failed to sign in");
      }

      // Success - redirect immediately
      console.log("Sign-in successful, redirecting to dashboard");
      router.replace("/dashboard");
    } catch (err) {
      console.error("Sign-in exception:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to sign in";

      // Provide user-friendly error messages
      if (errorMessage.includes("Invalid credentials") || errorMessage.includes("401") || errorMessage.includes("Unauthorized") || errorMessage.includes("CredentialsSignin")) {
        setError("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("network") || errorMessage.includes("Network") || errorMessage.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
        setError("Cannot connect to authentication server. Please ensure the server is running.");
      } else {
        setError(`Authentication failed: ${errorMessage}`);
      }
      setIsLoading(false);
    }
  };

  const isFormValid = email && password && !emailError && !passwordError;

  // Show loading while checking session
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-action-primary animate-spin" />
          <p className="text-sm text-content-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Fullscreen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="card-glass p-5 flex flex-col items-center gap-3 animate-scale-in">
            <div className="w-10 h-10 rounded-xl bg-action-primary flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-content-inverse animate-spin" />
            </div>
            <p className="text-sm font-semibold text-content-primary">
              Signing you in...
            </p>
          </div>
        </div>
      )}

      <div className="min-h-screen flex items-center justify-center bg-surface-base py-8 px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-action-primary/10 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-state-info/10 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        </div>

        <div className="max-w-sm w-full space-y-5 relative z-10">
          {/* Logo/Brand Section */}
          <div className="text-center animate-slide-up">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-action-primary mb-4 shadow-md shadow-action-primary/20">
              <CheckSquare className="w-5 h-5 text-content-inverse" />
            </div>
            <h1 className="text-xl font-bold text-content-primary mb-1">
              Welcome back
            </h1>
            <p className="text-sm text-content-secondary">
              Sign in to continue to TaskFlow
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border-subtle shadow-sm animate-slide-up animation-delay-100">
            {/* Global Error/Success Messages */}
            {error && (
              <div className="rounded-lg bg-state-error-light p-2.5 border border-state-error/20 mb-4 animate-slide-down">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-state-error mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-state-error">{error}</p>
                </div>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit} noValidate>
              {/* Email Input */}
              <Input
                id="email"
                name="email"
                type="email"
                label="Email address"
                placeholder="you@example.com"
                autoComplete="username email"
                required
                value={email}
                onChangeValidation={handleEmailChange}
                error={emailError}
                success={emailSuccess}
                showValidation
                disabled={isLoading}
              />

              {/* Password Input */}
              <Input
                id="current-password"
                name="password"
                label="Password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                isPassword
                value={password}
                onChangeValidation={handlePasswordChange}
                error={passwordError}
                disabled={isLoading}
              />

              {/* Forgot Password Link - disabled until implemented */}
              <div className="flex items-center justify-end">
                <span
                  className="text-[11px] font-medium text-content-tertiary cursor-not-allowed"
                  title="Password reset coming soon"
                >
                  Forgot your password?
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="flex items-center justify-center gap-1.5 w-full h-9 text-xs font-medium text-content-inverse bg-action-primary hover:bg-action-primary-hover rounded-full disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    Sign in
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-xs text-content-secondary animate-slide-up animation-delay-200">
            Don't have an account?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-action-primary hover:text-action-primary-hover transition-colors"
            >
              Create one now
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
