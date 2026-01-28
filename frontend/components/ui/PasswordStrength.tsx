/**
 * Password Strength Indicator Component
 * Visual feedback for password quality following modern UX patterns
 */

import React from 'react';
import { calculatePasswordStrength } from '@/lib/validation';

interface PasswordStrengthProps {
  password: string;
  show: boolean;
}

const PasswordStrength: React.FC<PasswordStrengthProps> = ({ password, show }) => {
  if (!show || !password) return null;

  const strength = calculatePasswordStrength(password);
  const percentage = (strength.score / 4) * 100;

  return (
    <div className="mt-2 space-y-1.5 animate-slide-down">
      {/* Strength Bar */}
      <div className="relative h-1 bg-border-subtle rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ease-out ${strength.color}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={strength.score}
          aria-valuemin={0}
          aria-valuemax={4}
          aria-label={`Password strength: ${strength.feedback}`}
        />
      </div>

      {/* Strength Label */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-content-secondary">
          Strength: <span className="font-semibold">{strength.feedback}</span>
        </span>
        <span className="text-[10px] text-content-tertiary">
          {strength.score}/4
        </span>
      </div>

      {/* Requirements Checklist */}
      <ul className="text-[10px] space-y-1 text-content-tertiary">
        <li className={`flex items-center gap-1.5 ${password.length >= 8 ? 'text-state-success' : ''}`}>
          <span className={`w-1 h-1 rounded-full ${password.length >= 8 ? 'bg-state-success' : 'bg-border-default'}`} />
          At least 8 characters
        </li>
        <li className={`flex items-center gap-1.5 ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'text-state-success' : ''}`}>
          <span className={`w-1 h-1 rounded-full ${/[A-Z]/.test(password) && /[a-z]/.test(password) ? 'bg-state-success' : 'bg-border-default'}`} />
          Mixed case letters
        </li>
        <li className={`flex items-center gap-1.5 ${/[0-9]/.test(password) ? 'text-state-success' : ''}`}>
          <span className={`w-1 h-1 rounded-full ${/[0-9]/.test(password) ? 'bg-state-success' : 'bg-border-default'}`} />
          At least one number
        </li>
        <li className={`flex items-center gap-1.5 ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-state-success' : ''}`}>
          <span className={`w-1 h-1 rounded-full ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'bg-state-success' : 'bg-border-default'}`} />
          Special character
        </li>
      </ul>
    </div>
  );
};

export default PasswordStrength;
