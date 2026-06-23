import type { ReactNode, InputHTMLAttributes } from "react";

/** Carte sur fond soft, rayon et bordure repris du design S'investir. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[--radius-base] border border-border bg-surface-soft/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

/** Libellé + champ, pour aligner les inputs du formulaire. */
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="flex flex-col gap-2">
      <span className="text-sm font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}

const fieldClasses =
  "w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text " +
  "outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/30";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${fieldClasses} ${props.className ?? ""}`} />;
}

/** Groupe de boutons segmentés (pour la fréquence). */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-surface p-1">
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={
              "rounded-md px-3 py-2 text-sm font-medium transition " +
              (isActive
                ? "bg-brand text-white shadow"
                : "text-text-muted hover:text-text")
            }
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
