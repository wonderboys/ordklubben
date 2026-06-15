'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

type FeedbackMessageProps = {
  error?: string;
  success?: string;
};

export function FeedbackMessage({ error, success }: FeedbackMessageProps) {
  const [message] = useState(() => {
    if (error) {
      return { kind: 'error' as const, text: error };
    }

    if (success) {
      return { kind: 'success' as const, text: success };
    }

    return null;
  });

  useEffect(() => {
    if (!error && !success) {
      return;
    }

    const url = new URL(window.location.href);
    let changed = false;

    if (url.searchParams.has('error')) {
      url.searchParams.delete('error');
      changed = true;
    }

    if (url.searchParams.has('success')) {
      url.searchParams.delete('success');
      changed = true;
    }

    if (!changed) {
      return;
    }

    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, '', next);
  }, [error, success]);

  if (!message) {
    return null;
  }

  return (
    <div
      className={cn(
        'border px-3 py-2 text-sm',
        message.kind === 'error'
          ? 'border-print-red/30 bg-print-red-soft text-print-red'
          : 'border-print-green/30 bg-print-green-soft text-print-green',
      )}
    >
      {message.text}
    </div>
  );
}
