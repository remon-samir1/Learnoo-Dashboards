import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  label: string;
  value: string;
};

export default function ProfileInfoRow({
  icon,
  label,
  value,
}: Props) {
  return (
    <div className="flex items-center gap-4 rounded-xl bg-gray-50 p-4">
      <div className="text-[var(--text-muted)]">{icon}</div>

      <div>
        <p className="text-xs text-[var(--text-muted)]">{label}</p>

        <p className="mt-0.5 text-sm font-medium text-[var(--text-dark)]">
          {value}
        </p>
      </div>
    </div>
  );
}