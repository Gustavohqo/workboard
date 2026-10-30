import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'sm';
};

const BASE =
  'inline-flex cursor-pointer items-center justify-center gap-1 whitespace-nowrap rounded-md text-body font-medium transition-[background-color,filter] duration-[120ms] disabled:cursor-default disabled:opacity-50';

const VARIANTS = {
  primary: 'bg-accent text-on-accent hover:brightness-[.92]',
  secondary: 'border border-line-strong bg-surface-raised text-ink hover:bg-surface-sunken',
  ghost: 'text-ink-muted hover:bg-surface-sunken',
};

const SIZES = {
  md: 'h-9 px-4',
  sm: 'h-7 px-2',
};

/** Button from the design system. Defaults to type="button" so it never submits a form by accident. */
export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    />
  );
}
