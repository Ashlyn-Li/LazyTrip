import { ChoiceCard } from "@/components/trip-preferences/choice-card";

type Option<Value extends string> = {
  value: Value;
  label: string;
};

type PreferenceOptionsProps<Value extends string> = {
  options: Option<Value>[];
  selectedValues: Value[];
  onToggle: (value: Value) => void;
  columns?: "two" | "three" | "four";
};

const columnClass = {
  two: "sm:grid-cols-2",
  three: "sm:grid-cols-3",
  four: "sm:grid-cols-4"
};

export const PreferenceOptions = <Value extends string>({
  options,
  selectedValues,
  onToggle,
  columns = "three"
}: PreferenceOptionsProps<Value>) => (
  <div className={`grid gap-3 ${columnClass[columns]}`}>
    {options.map((option) => (
      <ChoiceCard key={option.value} selected={selectedValues.includes(option.value)} onClick={() => onToggle(option.value)}>
        {option.label}
      </ChoiceCard>
    ))}
  </div>
);
