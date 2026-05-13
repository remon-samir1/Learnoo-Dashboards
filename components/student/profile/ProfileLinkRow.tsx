import { ReactNode } from "react";

type Props = {
  icon: ReactNode;
  title: string;
  status: string;
  connected?: boolean;
};

export default function ProfileLinkRow({
  icon,
  title,
  status,
  connected = false,
}: Props) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
      <div className="flex items-center gap-3">
        <span className="text-[var(--primary)]">{icon}</span>

        <span className="text-sm font-medium text-[var(--text-dark)]">
          {title}
        </span>
      </div>

      <span
        className={`text-xs font-semibold ${
          connected ? "text-green-600" : "text-[var(--primary)]"
        }`}
      >
        {status}
      </span>
    </div>
  );
}