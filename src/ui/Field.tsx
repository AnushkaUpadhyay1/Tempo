import { useId } from 'react';
import type { InputHTMLAttributes, Ref } from 'react';
import { Icon } from './Icon';
import { cx } from '../lib/cx';
import f from './field.module.css';

export interface FieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'size'
> {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  /** Show the "optional" marker. Off for filters and search boxes, which are never required. */
  showOptional?: boolean;
  multiline?: boolean;
  /** Hide the label visually (it is still announced). For search boxes with an icon. */
  hideLabel?: boolean;
  onChange?: (value: string) => void;
  ref?: Ref<HTMLInputElement>;
}

export function Field({
  label,
  hint,
  error,
  optional,
  showOptional = true,
  multiline,
  hideLabel,
  id,
  className,
  onChange,
  ref,
  ...rest
}: FieldProps) {
  const auto = useId();
  const fieldId = id ?? `f-${auto}`;
  const describedBy =
    [hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(' ') || undefined;
  const common = {
    id: fieldId,
    className: f.control,
    'aria-describedby': describedBy,
    'aria-invalid': error ? true : undefined,
    'aria-required': optional ? undefined : true,
  };
  return (
    <div className={cx(f.field, className)}>
      <label htmlFor={fieldId} className={cx(f.label, hideLabel && 't-sr-only')}>
        {label}
        {optional && showOptional && <span className={f.optional}> · optional</span>}
      </label>
      {hint && (
        <span id={`${fieldId}-hint`} className={f.hint}>
          {hint}
        </span>
      )}
      {multiline ? (
        <textarea
          {...common}
          value={rest.value as string | undefined}
          placeholder={rest.placeholder}
          rows={4}
          onChange={(e) => onChange?.(e.target.value)}
        />
      ) : (
        <input {...rest} {...common} ref={ref} onChange={(e) => onChange?.(e.target.value)} />
      )}
      {error && (
        <span id={`${fieldId}-error`} className={f.error}>
          <Icon name="error" size="sm" />
          {error}
        </span>
      )}
    </div>
  );
}
