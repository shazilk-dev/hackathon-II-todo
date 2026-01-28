/**
 * Modern form validation utilities
 * Following 2025+ best practices for user-friendly validation
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
}

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string;
  color: string;
}

/**
 * Email validation with comprehensive checks
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, message: "Email is required" };
  }

  // Basic email pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(email)) {
    return { isValid: false, message: "Please enter a valid email address" };
  }

  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
  const domain = email.split('@')[1]?.toLowerCase();
  
  if (domain && domain.length > 3) {
    const suggestions = commonDomains.filter(d => 
      d.substring(0, 3) === domain.substring(0, 3) && d !== domain
    );
    
    if (suggestions.length > 0 && domain !== suggestions[0]) {
      return { 
        isValid: true, 
        message: `Did you mean ${email.split('@')[0]}@${suggestions[0]}?` 
      };
    }
  }

  return { isValid: true };
};

/**
 * Password validation with detailed feedback
 */
export const validatePassword = (password: string, isSignUp: boolean = false): ValidationResult => {
  if (!password) {
    return { isValid: false, message: "Password is required" };
  }

  if (isSignUp) {
    if (password.length < 8) {
      return { isValid: false, message: "Password must be at least 8 characters" };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (!hasUpperCase || !hasLowerCase) {
      return { isValid: false, message: "Use both uppercase and lowercase letters" };
    }

    if (!hasNumber) {
      return { isValid: false, message: "Include at least one number" };
    }

    if (!hasSpecialChar) {
      return { isValid: false, message: "Include at least one special character" };
    }
  }

  return { isValid: true };
};

/**
 * Calculate password strength with modern scoring
 */
export const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (!password) {
    return { score: 0, feedback: "Enter a password", color: "bg-gray-300" };
  }

  let score = 0;
  const feedback: string[] = [];

  // Length check
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score++;
    feedback.push("mixed case");
  }
  
  if (/[0-9]/.test(password)) {
    score++;
    feedback.push("numbers");
  }
  
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score++;
    feedback.push("special chars");
  }

  // Common patterns (reduce score)
  if (/^[0-9]+$/.test(password) || /^[a-zA-Z]+$/.test(password)) {
    score = Math.max(0, score - 2);
  }

  // Normalize score to 0-4
  const normalizedScore = Math.min(4, Math.floor(score / 1.5));

  const strengthMap = {
    0: { feedback: "Very weak", color: "bg-red-500" },
    1: { feedback: "Weak", color: "bg-orange-500" },
    2: { feedback: "Fair", color: "bg-yellow-500" },
    3: { feedback: "Good", color: "bg-blue-500" },
    4: { feedback: "Strong", color: "bg-green-500" },
  };

  return {
    score: normalizedScore,
    ...strengthMap[normalizedScore as keyof typeof strengthMap],
  };
};

/**
 * Name validation
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, message: "Name is required" };
  }

  if (name.trim().length < 2) {
    return { isValid: false, message: "Name must be at least 2 characters" };
  }

  if (name.trim().length > 50) {
    return { isValid: false, message: "Name is too long" };
  }

  // Check for invalid characters
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return { isValid: false, message: "Name contains invalid characters" };
  }

  return { isValid: true };
};

/**
 * Debounce utility for real-time validation
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
