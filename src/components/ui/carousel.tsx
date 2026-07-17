'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type CarouselContextValue = {
  viewportRef: React.RefObject<HTMLDivElement | null>;
  scrollPrev: () => void;
  scrollNext: () => void;
};

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarouselContext() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error('Carousel components must be used within Carousel.');
  }

  return context;
}

type CarouselProps = React.HTMLAttributes<HTMLDivElement> & {
  opts?: unknown;
  plugins?: unknown[];
};

const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, children, ...props }, ref) => {
    const viewportRef = React.useRef<HTMLDivElement>(null);

    const scrollPrev = React.useCallback(() => {
      viewportRef.current?.scrollBy({
        left: -viewportRef.current.clientWidth,
        behavior: 'smooth',
      });
    }, []);

    const scrollNext = React.useCallback(() => {
      viewportRef.current?.scrollBy({
        left: viewportRef.current.clientWidth,
        behavior: 'smooth',
      });
    }, []);

    return (
      <CarouselContext.Provider value={{ viewportRef, scrollPrev, scrollNext }}>
        <div ref={ref} className={cn('relative', className)} {...props}>
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = 'Carousel';

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { viewportRef } = useCarouselContext();

  return (
    <div
      ref={(node) => {
        viewportRef.current = node;

        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      className={cn('overflow-hidden', className)}
    >
      <div className="flex touch-pan-y gap-4" {...props} />
    </div>
  );
});
CarouselContent.displayName = 'CarouselContent';

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('min-w-0 shrink-0 basis-full', className)}
    {...props}
  />
));
CarouselItem.displayName = 'CarouselItem';

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollPrev } = useCarouselContext();

  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="icon"
      className={cn('absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full', className)}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = 'CarouselPrevious';

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { scrollNext } = useCarouselContext();

  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="icon"
      className={cn('absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full', className)}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = 'CarouselNext';

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
};