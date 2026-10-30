import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: ReactNode;
  error?: string;
  /** Extra classes for the input only, e.g. to size it apart from the label and hint. */
  inputClassName?: string;
};

/** Labelled input from the design system. The label is always visible; the placeholder never replaces it. */
export function TextField({ label, hint, error, id, inputClassName = '', ...props }: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={inputId} className="text-label text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={`h-9 rounded-md border bg-surface-raised px-3 text-body text-ink ${
          error ? 'border-danger' : 'border-line-strong'
        } ${inputClassName}`}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-caption text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
