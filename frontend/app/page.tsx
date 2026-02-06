import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-surface-base relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-action-primary/8 rounded-full filter blur-3xl animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-state-info/8 rounded-full filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-state-success/8 rounded-full filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Nav */}
        <nav className="w-full py-6 px-4 sm:px-6 lg:px-8">
          <div className="max-w-container mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Fehrist Logo"
                width={44}
                height={44}
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain"
                priority
              />
              <div className="flex flex-col -space-y-0.5">
                <span className="text-h4 font-semibold text-content-primary">Fehrist</span>
                <span className="text-[11px] text-content-tertiary font-medium">فہرست</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/sign-in" className="btn-ghost btn-sm">
                Sign In
              </Link>
              <Link href="/auth/sign-up" className="btn-primary btn-sm hidden sm:flex">
                Get Started
              </Link>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-3xl w-full text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-action-secondary mb-8 animate-slide-up">
              <Sparkles className="w-4 h-4 text-action-primary" />
              <span className="text-caption font-medium text-action-primary">
                Simple. Powerful. Beautiful.
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-hero font-bold text-content-primary mb-6 animate-slide-up animation-delay-100">
              Organize your life,{" "}
              <span className="text-gradient">one task at a time</span>
            </h1>

            {/* Subheading */}
            <p className="text-body-lg text-content-secondary max-w-2xl mx-auto mb-10 animate-slide-up animation-delay-200">
              Fehrist helps you capture, organize, and accomplish your tasks with
              an intuitive interface designed for the way you work.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-slide-up animation-delay-300">
              <Link href="/auth/sign-up" className="btn-primary w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/sign-in" className="btn-secondary w-full sm:w-auto">
                Sign In
              </Link>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 animate-slide-up animation-delay-500">
              <div className="card text-center">
                <div className="w-12 h-12 rounded-xl bg-state-info-light flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-6 h-6 text-state-info" />
                </div>
                <h3 className="text-body font-semibold text-content-primary mb-2">
                  Lightning Fast
                </h3>
                <p className="text-body-sm text-content-secondary">
                  Create and manage tasks in seconds with our streamlined interface
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 rounded-xl bg-state-success-light flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-state-success" />
                </div>
                <h3 className="text-body font-semibold text-content-primary mb-2">
                  Secure & Private
                </h3>
                <p className="text-body-sm text-content-secondary">
                  Your data is encrypted and secure. We never sell your information
                </p>
              </div>

              <div className="card text-center">
                <div className="w-12 h-12 rounded-xl bg-action-secondary flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-action-primary" />
                </div>
                <h3 className="text-body font-semibold text-content-primary mb-2">
                  Beautiful Design
                </h3>
                <p className="text-body-sm text-content-secondary">
                  A clean, modern interface that makes task management enjoyable
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border-subtle">
          <div className="max-w-container mx-auto text-center">
            <p className="text-caption text-content-tertiary">
              Built with care. Designed for productivity.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
