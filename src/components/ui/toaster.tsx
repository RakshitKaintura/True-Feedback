'use client';

import * as React from 'react';

import { Toast } from '@/components/ui/toast';
import { dismissToast, useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-3 px-4 sm:px-0">
      {toasts.map((entry) => (
        <Toast
          key={entry.id}
          {...entry}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}