'use client';

import * as React from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type ToastVariant = 'default' | 'destructive';

export type ToastProps = {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
};

type ToastComponentProps = ToastProps & {
  className?: string;
  onDismiss: (id: string) => void;
};

const Toast = React.forwardRef<HTMLDivElement, ToastComponentProps>(
  ({ className, title, description, variant = 'default', id, onDismiss }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'pointer-events-auto w-full rounded-lg border bg-white p-4 shadow-lg',
          variant === 'destructive' && 'border-red-200 bg-red-50 text-red-900',
          className
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="grid gap-1">
            {title ? <div className="text-sm font-semibold">{title}</div> : null}
            {description ? (
              <div className="text-sm text-slate-500">{description}</div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 rounded-full"
            onClick={() => onDismiss(id)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </div>
    );
  }
);
Toast.displayName = 'Toast';

export { Toast };