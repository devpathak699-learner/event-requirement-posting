"use client";

import { useId, type InputHTMLAttributes, type ReactNode } from "react";

const inputBase =
  "block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition " +
  "placeholder:text-slate-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:bg-slate-50";

function inputClass(error?: string) {
  return `${inputBase} ${error ? "border-rose-400" : "border-slate-300"}`;
}

type FieldProps = {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: (id: string, describedBy: string | undefined) => ReactNode;
  className?: string;
};

export function Field({ label, error, hint, optional, children, className }: FieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-2 text-sm font-medium text-slate-800">
        {label}
        {optional && <span className="text-xs font-normal text-slate-500">Optional</span>}
      </label>
      {children(id, error || hint ? messageId : undefined)}
      {error ? (
        <p id={messageId} role="alert" className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={messageId} className="mt-1.5 text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
};

export function TextField({ label, value, onChange, error, hint, optional, className, ...rest }: TextFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} optional={optional} className={className}>
      {(id, describedBy) => (
        <input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={inputClass(error)}
          {...rest}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  optional?: boolean;
  maxLength?: number;
  placeholder?: string;
};

export function TextAreaField({ label, value, onChange, error, hint, optional, maxLength, placeholder }: TextAreaFieldProps) {
  return (
    <Field
      label={label}
      error={error}
      hint={hint ?? (maxLength ? `${value.length}/${maxLength} characters` : undefined)}
      optional={optional}
    >
      {(id, describedBy) => (
        <textarea
          id={id}
          rows={4}
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={`${inputClass(error)} resize-y`}
        />
      )}
    </Field>
  );
}

type Option = { value: string; label: string };

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  error?: string;
  hint?: string;
  className?: string;
};

export function SelectField({ label, value, onChange, options, placeholder, error, hint, className }: SelectFieldProps) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id, describedBy) => (
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={inputClass(error)}
        >
          <option value="" disabled>
            {placeholder ?? "Select…"}
          </option>
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

type ChoiceGroupProps = {
  legend: string;
  options: Option[];
  error?: string;
  hint?: string;
} & (
  | { multiple: true; value: string[]; onChange: (value: string[]) => void }
  | { multiple?: false; value: string; onChange: (value: string) => void }
);

/** Pill-style radio or checkbox group. */
export function ChoiceGroup(props: ChoiceGroupProps) {
  const { legend, options, error, hint } = props;
  const name = useId();

  const isSelected = (v: string) => (props.multiple ? props.value.includes(v) : props.value === v);
  const toggle = (v: string) => {
    if (props.multiple) {
      props.onChange(props.value.includes(v) ? props.value.filter((x) => x !== v) : [...props.value, v]);
    } else {
      props.onChange(v);
    }
  };

  return (
    <fieldset aria-invalid={!!error}>
      <legend className="mb-2 text-sm font-medium text-slate-800">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = isSelected(o.value);
          return (
            <label
              key={o.value}
              className={`cursor-pointer select-none rounded-full border px-3.5 py-1.5 text-sm transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-violet-500/40 ${
                selected
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:border-violet-400"
              }`}
            >
              <input
                type={props.multiple ? "checkbox" : "radio"}
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => toggle(o.value)}
                className="sr-only"
              />
              {props.multiple && selected && <span aria-hidden>✓ </span>}
              {o.label}
            </label>
          );
        })}
      </div>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </fieldset>
  );
}

type BudgetFieldsProps = {
  label: string;
  min: string;
  max: string;
  onChange: (key: "budgetMin" | "budgetMax", value: string) => void;
  errors: Record<string, string>;
  hint?: string;
};

export function BudgetFields({ label, min, max, onChange, errors, hint }: BudgetFieldsProps) {
  const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 10);
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-slate-800">{label}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Minimum (₹)"
          inputMode="numeric"
          placeholder="e.g. 25000"
          value={min}
          onChange={(v) => onChange("budgetMin", digitsOnly(v))}
          error={errors.budgetMin}
        />
        <TextField
          label="Maximum (₹)"
          inputMode="numeric"
          placeholder="e.g. 75000"
          value={max}
          onChange={(v) => onChange("budgetMax", digitsOnly(v))}
          error={errors.budgetMax}
        />
      </div>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </fieldset>
  );
}

export function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {description && <p className="mt-1 text-sm text-slate-600">{description}</p>}
    </div>
  );
}
