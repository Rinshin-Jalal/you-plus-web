'use client';

import Link from 'next/link';

interface LegalFooterProps {
  className?: string;
  variant?: 'light' | 'dark' | 'auto';
}

export function LegalFooter({ className = '', variant = 'auto' }: LegalFooterProps) {
  const currentYear = new Date().getFullYear();

  const textColorClass = 
    variant === 'light' 
      ? 'text-gray-500 hover:text-gray-700' 
      : variant === 'dark' 
        ? 'text-gray-400 hover:text-gray-200'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200';

  return (
    <footer className={`py-6 px-4 ${className}`}>
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
        <p className={textColorClass.replace('hover:', '')}>
          © {currentYear} You+. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <Link 
            href="/legal/privacy" 
            className={`transition-colors ${textColorClass}`}
          >
            Privacy Policy
          </Link>
          <Link 
            href="/legal/terms" 
            className={`transition-colors ${textColorClass}`}
          >
            Terms of Service
          </Link>
          <a 
            href="mailto:support@youplus.app" 
            className={`transition-colors ${textColorClass}`}
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}

export default LegalFooter;
