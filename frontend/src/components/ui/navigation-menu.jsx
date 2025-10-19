import { forwardRef } from 'react';
import * as NavigationMenuPrimitive from '@radix-ui/react-navigation-menu';
import { cn } from '../../lib/utils';

export const NavigationMenu = forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Root
    ref={ref}
    className={cn('relative flex max-w-full items-center justify-center', className)}
    {...props}
  />
));

NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName;

export const NavigationMenuList = forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.List
    ref={ref}
    className={cn(
      'flex flex-wrap items-center gap-1 rounded-full border border-transparent bg-transparent p-1 text-sm font-medium',
      className
    )}
    {...props}
  />
));

NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName;

export const NavigationMenuItem = NavigationMenuPrimitive.Item;

export const NavigationMenuTrigger = forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Trigger
    ref={ref}
    className={cn(
      'group inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 data-[state=open]:bg-white data-[state=open]:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-950 data-[state=open]:dark:bg-slate-800 data-[state=open]:dark:text-white',
      className
    )}
    {...props}
  />
));

NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName;

export const NavigationMenuContent = forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Content
    ref={ref}
    className={cn(
      'left-0 top-full min-w-[16rem] rounded-3xl border border-slate-200 bg-white p-6 text-slate-600 shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
      className
    )}
    {...props}
  />
));

NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName;

export const NavigationMenuLink = forwardRef(({ className, active, ...props }, ref) => (
  <NavigationMenuPrimitive.Link
    ref={ref}
    data-active={active ? '' : undefined}
    className={cn(navigationMenuTriggerStyle(), active && 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white', className)}
    {...props}
  />
));

NavigationMenuLink.displayName = NavigationMenuPrimitive.Link.displayName;

export const NavigationMenuViewport = forwardRef(({ className, ...props }, ref) => (
  <NavigationMenuPrimitive.Viewport
    ref={ref}
    className={cn(
      'absolute left-1/2 top-full z-10 -translate-x-1/2 overflow-hidden rounded-3xl border border-slate-200 bg-white text-slate-600 shadow-2xl shadow-slate-950/10 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
      className
    )}
    {...props}
  />
));

NavigationMenuViewport.displayName = NavigationMenuPrimitive.Viewport.displayName;

export const navigationMenuTriggerStyle = ({ className } = {}) =>
  cn(
    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-white hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:ring-offset-slate-950',
    className
  );
