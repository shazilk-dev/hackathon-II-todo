"use client";

import { useState, FormEvent, useCallback, useEffect } from "react";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import PasswordStrength from "@/components/ui/PasswordStrength";
import { 
  validateEmail, 
  validatePassword, 
  validateName, 
  debounce 
} from "@/lib/validation";
import { Loader2, UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Field-level validation states
  const [nameError, setNameError] = useState<string | undefined>();
  const [nameSuccess, setNameSuccess] = useState<string | undefined>();
  const [emailError, setEmailError] = useState<string | undefined>();
  const [emailSuccess, setEmailSuccess] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  
  // Show password strength
  const [showPasswordStrength, setShowPasswordStrength] = useState(false);
  
  const router = useRouter();

  // Clear form-level error when user starts typing
  useEffect(() => {
    if (error && (name || email || password)) {
      setError(null);
    }
  }, [name, email, password, error]);

  // Debounced name validation
  const validateNameDebounced = useCallback(
    debounce((value: string) => {
      const result = validateName(value);
      setNameError(result.isValid ? undefined : result.message);
      setNameSuccess(result.isValid && value ? "Looks good!" : undefined);
    }, 500),
    []
  );

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
    setShowPasswordStrength(value.length > 0);
    
    if (!value) {
      setPasswordError(undefined);
      return;
    }
    
    const result = validatePassword(value, true);
    setPasswordError(result.isValid ? undefined : result.message);
  }, []);

  const handleNameChange = (value: string) => {
    setName(value);
    validateNameDebounced(value);
  };

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
    const nameValidation = validateName(name);
    const emailValidation = validateEmail(email);
    const passwordValidation = validatePassword(password, true);

    if (!nameValidation.isValid) {
      setNameError(nameValidation.message);
      return;
    }

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
      console.log("Starting sign-up process...");

      const response = await signUp.email({
        name: name.trim(),
        email: email.trim(),
        password
      });

      console.log("Sign-up response:", response);

      // Check for errors in the response
      if (response?.error) {
        console.error("Sign-up error:", response.error);
        throw new Error(response.error.message || "Failed to create account");
      }

      // Success - redirect immediately
      console.log("Sign-up successful, redirecting to dashboard");
      router.replace("/dashboard");
    } catch (err) {
      console.error("Sign-up exception:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to create account";

      // Provide user-friendly error messages
      if (errorMessage.includes("already exists") || errorMessage.includes("duplicate") || errorMessage.includes("unique")) {
        setError("An account with this email already exists. Please sign in instead.");
      } else if (errorMessage.includes("network") || errorMessage.includes("Network") || errorMessage.includes("fetch")) {
        setError("Network error. Please check your connection and try again.");
      } else if (errorMessage.includes("connect") || errorMessage.includes("ECONNREFUSED")) {
        setError("Cannot connect to authentication server. Please ensure the server is running.");
      } else {
        setError(`Account creation failed: ${errorMessage}`);
      }
      setIsLoading(false);
    }
  };

  const isFormValid = name && email && password && !nameError && !emailError && !passwordError;

  return (
    <>
      {/* Fullscreen Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-surface-base/80 backdrop-blur-md z-50 flex items-center justify-center">
          <div className="bg-surface-raised rounded-xl p-5 border border-border-subtle shadow-sm flex flex-col items-center gap-3 animate-scale-in">
            <div className="w-10 h-10 rounded-xl bg-action-primary flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-content-inverse animate-spin" />
            </div>
            <p className="text-sm font-semibold text-content-primary">
              Creating your account...
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
              <UserPlus className="w-5 h-5 text-content-inverse" />
            </div>
            <h1 className="text-xl font-bold text-content-primary mb-1">
              Create account
            </h1>
            <p className="text-sm text-content-secondary">
              Start your journey with us today
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
            {/* Name Input */}
            <Input
              id="name"
              name="name"
              type="text"
              label="Full name"
              placeholder="John Doe"
              autoComplete="name"
              required
              value={name}
              onChangeValidation={handleNameChange}
              error={nameError}
              success={nameSuccess}
              showValidation
              disabled={isLoading}
            />

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

            {/* Password Input with Strength Indicator */}
            <div>
              <Input
                id="new-password"
                name="password"
                label="Password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                required
                isPassword
                value={password}
                onChangeValidation={handlePasswordChange}
                error={passwordError}
                disabled={isLoading}
                hint="Must be at least 8 characters with mixed case, numbers, and symbols"
              />
              
              <PasswordStrength 
                password={password} 
                show={showPasswordStrength} 
              />
            </div>

            {/* Terms and Privacy */}
            <div className="text-[10px] text-content-tertiary text-center">
              By signing up, you agree to our{" "}
              <Link href="/terms" className="text-action-primary hover:text-action-primary-hover font-medium">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-action-primary hover:text-action-primary-hover font-medium">
                Privacy Policy
              </Link>
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
                  <span>Creating account...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create account</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Sign In Link */}
        <p className="text-center text-xs text-content-secondary animate-slide-up animation-delay-200">
          Already have an account?{" "}
          <Link
            href="/auth/sign-in"
            className="font-semibold text-action-primary hover:text-action-primary-hover transition-colors"
          >
            Sign in here
          </Link>
        </p>
      </div>
    </div>
    </>
  );
}
