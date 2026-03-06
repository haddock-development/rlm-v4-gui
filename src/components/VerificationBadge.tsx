'use client';

import { cn } from '@/lib/utils';
import type { VerificationStatus } from '@/lib/types';

interface VerificationBadgeProps {
  status: VerificationStatus;
  className?: string;
}

export function VerificationBadge({ status, className }: VerificationBadgeProps) {
  const styles: Record<VerificationStatus, { bg: string; text: string; label: string }> = {
    verified: {
      bg: 'bg-green-500/15',
      text: 'text-green-500',
      label: 'Verified',
    },
    unverified: {
      bg: 'bg-red-500/15',
      text: 'text-red-500',
      label: 'Unverified',
    },
    pending: {
      bg: 'bg-yellow-500/15',
      text: 'text-yellow-500',
      label: 'Pending',
    },
    skipped: {
      bg: 'bg-gray-500/15',
      text: 'text-gray-500',
      label: 'Skipped',
    },
  };

  const style = styles[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
        style.bg,
        style.text,
        className
      )}
    >
      {status === 'verified' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === 'unverified' && (
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {status === 'pending' && (
        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {style.label}
    </span>
  );
}
