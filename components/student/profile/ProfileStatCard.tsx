type Props = {
  value: number | string;
  label: string;
  className: string;
};

export default function ProfileStatCard({
  value,
  label,
  className,
}: Props) {
  return (
    <div className={`rounded-xl p-5 ${className}`}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm opacity-75">{label}</p>
    </div>
  );
}