import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChoiceCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  children: ReactNode;
};

export const ChoiceCard = ({ selected, className = "", children, ...props }: ChoiceCardProps) => (
  <button
    type="button"
    className={`min-h-14 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-coral-500 ${
      selected
        ? "border-coast-700 bg-coast-50 text-coast-700 shadow-sm"
        : "border-coast-100 bg-white/90 text-ink hover:border-coast-500"
    } ${className}`}
    aria-pressed={selected}
    {...props}
  >
    {children}
  </button>
);
