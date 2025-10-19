import { forwardRef } from 'react';
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';

export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export const DropdownMenuGroup = DropdownMenuPrimitive.Group;
export const DropdownMenuPortal = DropdownMenuPrimitive.Portal;
export const DropdownMenuSub = DropdownMenuPrimitive.Sub;
export const DropdownMenuRadioGroup = DropdownMenuPrimitive.RadioGroup;

export const DropdownMenuSubTrigger = forwardRef(({ className, inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:text-slate-900 data-[state=open]:bg-slate-100 data-[state=open]:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800 dark:focus-visible:text-white',
      inset && 'pl-8',
      className
    )}
    {...props}
  >
    {children}
  </DropdownMenuPrimitive.SubTrigger>
));

DropdownMenuSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

export const DropdownMenuSubContent = forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={cn(
      'z-50 min-w-[10rem] rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-xl shadow-slate-950/5 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
      className
    )}
    {...props}
  />
));

DropdownMenuSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

export const DropdownMenuContent = forwardRef(({ className, sideOffset = 8, align = 'end', ...props }, ref) => (
  <DropdownMenuPrimitive.Content
    ref={ref}
    align={align}
    sideOffset={sideOffset}
    className={cn(
      'z-50 min-w-[12rem] rounded-2xl border border-slate-200 bg-white p-2 text-slate-600 shadow-2xl shadow-slate-950/5 will-change-[opacity,transform] animate-in fade-in-0 zoom-in-95 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200',
      className
    )}
    {...props}
  />
));

DropdownMenuContent.displayName = DropdownMenuPrimitive.Content.displayName;

export const DropdownMenuItem = forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={cn(
      'flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800 dark:focus-visible:text-white',
      inset && 'pl-8',
      className
    )}
    {...props}
  />
));

DropdownMenuItem.displayName = DropdownMenuPrimitive.Item.displayName;

export const DropdownMenuCheckboxItem = forwardRef(({ className, children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800 dark:focus-visible:text-white',
      className
    )}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span className="h-2 w-2 rounded-full bg-sky-500" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="pl-4">{children}</span>
  </DropdownMenuPrimitive.CheckboxItem>
));

DropdownMenuCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

export const DropdownMenuRadioItem = forwardRef(({ className, children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={cn(
      'relative flex cursor-pointer select-none items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-100 hover:text-slate-900 focus-visible:bg-slate-100 focus-visible:text-slate-900 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:bg-slate-800 dark:focus-visible:text-white',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <span className="h-2 w-2 rounded-full bg-sky-500" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    <span className="pl-4">{children}</span>
  </DropdownMenuPrimitive.RadioItem>
));

DropdownMenuRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

export const DropdownMenuLabel = forwardRef(({ className, inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={cn('px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500', inset && 'pl-8', className)}
    {...props}
  />
));

DropdownMenuLabel.displayName = DropdownMenuPrimitive.Label.displayName;

export const DropdownMenuSeparator = forwardRef(({ className, ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={cn('my-2 h-px bg-slate-200 dark:bg-slate-700', className)}
    {...props}
  />
));

DropdownMenuSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

export const DropdownMenuShortcut = ({ className, ...props }) => {
  return <span className={cn('ml-auto text-xs text-slate-400 dark:text-slate-500', className)} {...props} />;
};
