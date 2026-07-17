import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = ({ className = "", ...props }: ButtonProps) => (
  <button
    className={`inline-flex min-h-12 items-center justify-center rounded-full bg-coast-700 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-coast-500 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    {...props}
  />
);
