import { fieldClass } from "@/features/profiles/components/field";
import { CONTEST_SORTS, type ContestSortKey } from "../types";

export function ContestSort({
  value,
  onChange,
}: {
  value: ContestSortKey;
  onChange: (value: ContestSortKey) => void;
}) {
  return (
    <select
      className={`${fieldClass} sm:w-52`}
      value={value}
      onChange={(e) => onChange(e.target.value as ContestSortKey)}
      aria-label="Sort contests"
    >
      {CONTEST_SORTS.map((sort) => (
        <option key={sort.key} value={sort.key}>
          {sort.label}
        </option>
      ))}
    </select>
  );
}
