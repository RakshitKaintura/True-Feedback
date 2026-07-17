import * as React from 'react';

import { cn } from '@/lib/utils';

type SwitchProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  'type'
> & {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
};

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, checked, onCheckedChange, disabled, onChange, ...props }, ref) => {
    return (
      <label
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          checked ? 'bg-slate-900' : 'bg-slate-300',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          className="peer sr-only"
          onChange={(event) => {
            onChange?.(event);
            onCheckedChange?.(event.target.checked);
          }}
          {...props}
        />
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked ? 'translate-x-5' : 'translate-x-1'
          )}
        />
      </label>
    );
  }
);
Switch.displayName = 'Switch';

export { Switch };