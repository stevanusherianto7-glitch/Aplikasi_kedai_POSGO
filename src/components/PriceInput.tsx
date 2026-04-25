import { Input } from "./ui/input";
import { formatNumber, parseNumber } from "@/lib/utils";

interface PriceInputProps {
  value: any;
  onChange: (val: any) => void;
  className?: string;
  placeholder?: string;
}

export function PriceInput({ value, onChange, className, placeholder }: PriceInputProps) {
  const displayValue = formatNumber(value);

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={displayValue}
      onChange={(e) => onChange(parseNumber(e.target.value))}
      className={className}
      placeholder={placeholder}
    />
  );
}
