import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = ({ className = "", ...props }: InputProps) => (
  <input
    className={`min-h-12 w-full rounded-2xl border border-coast-100 bg-white px-4 py-3 text-base text-ink shadow-sm transition placeholder:text-slate-400 focus:border-coast-500 focus:outline-none focus:ring-4 focus:ring-coast-100 ${className}`}
    {...props}
  />
);
