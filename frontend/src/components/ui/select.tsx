import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = ({ className = "", children, ...props }: SelectProps) => (
  <select
    className={`min-h-12 w-full rounded-2xl border border-coast-100 bg-white px-4 py-3 text-base text-ink shadow-sm transition focus:border-coast-500 focus:outline-none focus:ring-4 focus:ring-coast-100 ${className}`}
    {...props}
  >
    {children}
  </select>
);
