import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'print-button inline-flex cursor-pointer items-center justify-center rounded-none border border-print-ink text-sm shadow-[var(--print-shadow-strong)] transition-[transform,filter] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-print-green/40 active:translate-x-px active:translate-y-px active:shadow-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-print-ink text-print-surface hover:brightness-95',
        ghost: 'bg-print-surface text-print-ink hover:brightness-95',
        outline: 'bg-print-surface text-print-ink hover:brightness-95',
        accent: 'border-print-green bg-print-green text-white hover:brightness-95',
      },
      size: {
        default: 'h-11 px-5',
        sm: 'h-9 px-4 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  ),
);

Button.displayName = 'Button';

export { Button, buttonVariants };
