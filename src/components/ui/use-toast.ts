'use client';

import * as React from 'react';

import type { ToastProps } from '@/components/ui/toast';

type ToastInput = Omit<ToastProps, 'id'> & {
  duration?: number;
};

type ToastStoreListener = (toasts: ToastProps[]) => void;

const toastStore = new Map<string, ToastProps>();
const listeners = new Set<ToastStoreListener>();
let toastId = 0;

function emit() {
  const nextToasts = Array.from(toastStore.values());

  listeners.forEach((listener) => listener(nextToasts));
}

function dismissToast(id: string) {
  if (toastStore.delete(id)) {
    emit();
  }
}

function scheduleDismiss(id: string, duration: number) {
  window.setTimeout(() => {
    dismissToast(id);
  }, duration);
}

export function toast({ duration = 5000, ...input }: ToastInput) {
  const id = `${++toastId}`;
  const nextToast: ToastProps = {
    id,
    title: input.title,
    description: input.description,
    variant: input.variant,
  };

  toastStore.set(id, nextToast);
  emit();
  scheduleDismiss(id, duration);

  return {
    id,
    dismiss: () => dismissToast(id),
  };
}

export function useToast() {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  React.useEffect(() => {
    const listener: ToastStoreListener = (nextToasts) => setToasts(nextToasts);

    listeners.add(listener);
    setToasts(Array.from(toastStore.values()));

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return {
    toasts,
    toast,
    dismissToast,
  };
}

export { dismissToast };