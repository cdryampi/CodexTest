import { cloneElement, forwardRef, isValidElement } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 dark:focus-visible:ring-offset-slate-950',
  {
    variants: {
      variant: {
        default:
          'bg-sky-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-sky-500 active:translate-y-0 dark:bg-sky-500 dark:hover:bg-sky-400',
        destructive:
          'bg-red-600 text-white shadow-sm hover:-translate-y-0.5 hover:bg-red-500 active:translate-y-0 dark:bg-red-500 dark:hover:bg-red-400',
        outline:
          'border border-slate-300 bg-white text-slate-900 shadow-sm hover:-translate-y-0.5 hover:border-sky-400 hover:text-sky-600 active:translate-y-0 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-sky-500 dark:hover:text-sky-300',
        secondary:
          'bg-slate-100 text-slate-900 shadow-sm hover:-translate-y-0.5 hover:bg-slate-200 active:translate-y-0 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
        ghost:
          'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-sky-500 active:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        link: 'text-sky-600 underline-offset-4 hover:underline dark:text-sky-400'
      },
      size: {
        default: 'h-11 px-5 py-2',
        sm: 'h-9 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-10 w-10 p-0'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export const Button = forwardRef(({ className, variant, size, asChild = false, children, ...props }, ref) => {
  const classes = cn(buttonVariants({ variant, size }), className);

  if (asChild && isValidElement(children)) {
    return cloneElement(children, {
      className: cn(classes, children.props.className),
      ref,
      ...props
    });
  }

  return (
    <button ref={ref} className={classes} {...props}>
      {children}
    </button>
  );
});

Button.displayName = 'Button';
