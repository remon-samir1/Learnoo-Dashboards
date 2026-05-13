type Props = {
  title: string;
  description: string;
};

export default function ProfileHeader({ title, description }: Props) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-[var(--text-dark)]">
        {title}
      </h1>

      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {description}
      </p>
    </header>
  );
}