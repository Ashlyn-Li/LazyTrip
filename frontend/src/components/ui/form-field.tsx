import type { ReactNode } from "react";

type FormFieldProps = {
  id: string;
  label: string;
  error?: string;
  children: ReactNode;
};

export const FormField = ({ id, label, error, children }: FormFieldProps) => (
  <div className="space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold text-ink">
      {label}
    </label>
    {children}
    <p id={`${id}-error`} className="min-h-5 text-sm font-medium text-coral-700" aria-live="polite">
      {error}
    </p>
  </div>
);
