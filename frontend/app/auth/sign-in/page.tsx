"use client";

import { useState, FormEvent, useCallback, useEffect, Suspense } from "react";
import { signIn, useSession } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import { validateEmail, validatePassword, debounce } from "@/lib/validation";
import { Loader2, LogIn, AlertCircle, CheckSquare, CheckCircle2 } from "lucide-react";

function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { data: sessionData, isPending } = useSession();
  const session = sessionData?.session; // Extract session from the returned data
  const status = session ? "authenticated" : isPending ? "loading" : "unauthenticated";
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check for success message from sign-up
  useEffect(() => {
    const success = searchParams.get("success");
    if (success === "account_created") {
      setSuccessMessage("Account created successfully! Please sign in with your credentials.");
      // Clear the URL parameter after showing message
      window.history.replaceState({}, "", "/auth/sign-in");
    }
  }, [searchParams]);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated" && session) {
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
    // Clear error and success message if user starts typing
    if ((error || successMessage) && (email !== prevEmail || password !== prevPassword)) {
      setError(null);
      setSuccessMessage(null);
    }
    setPrevEmail(email);
    setPrevPassword(password);
  }, [email, password, error, successMessage, prevEmail, prevPassword]);

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

    setIsSubmitting(true);
    setError(null);

    try {
      // Better Auth client returns { data, error } format
      const { data, error } = await signIn.email({
        email: email.trim(),
        password,
      });

      if (error) {
        // Better Auth error format: { message, status, statusText, code }
        console.error("Sign-in error:", error);

        const errorMessage = error.message || "Failed to sign in";
        const errorCode = (error as any).code || "";

        // Provide user-friendly error messages based on error code or message
        if (errorCode === "INVALID_CREDENTIALS" || errorMessage.includes("Invalid") || errorMessage.includes("credentials")) {
          setError("Invalid email or password. Please try again.");
        } else if (errorCode === "USER_NOT_FOUND" || errorMessage.includes("not found") || errorMessage.includes("Credential account not found")) {
          setError("No account found with this email. Please sign up first.");
        } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
          setError("Network error. Please check your connection and try again.");
        } else if (errorMessage.includes("Rate limit")) {
          setError(errorMessage);
        } else {
          setError(errorMessage);
        }
        setIsSubmitting(false);
        return;
      }

      // Success - manually redirect to dashboard
      console.log("Sign-in successful! Redirecting to dashboard...");

      // Use router.push for immediate redirect (no loading stuck)
      router.push("/dashboard");
    } catch (err) {
      console.error("Sign-in exception:", err);
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const isFormValid = email && password && !emailError && !passwordError;

  // Show loading while checking session
  if (isPending) {
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
      {isSubmitting && (
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
            {successMessage && (
              <div className="rounded-lg bg-state-success-light p-2.5 border border-state-success/20 mb-4 animate-slide-down">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-state-success mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-state-success">{successMessage}</p>
                </div>
              </div>
            )}

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
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                disabled={isSubmitting || !isFormValid}
                className="flex items-center justify-center gap-1.5 w-full h-9 text-xs font-medium text-content-inverse bg-action-primary hover:bg-action-primary-hover rounded-full disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
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

// Wrapper component with Suspense boundary for useSearchParams
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-surface-base">
        <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
