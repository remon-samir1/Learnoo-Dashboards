import Link from "next/link";
import { FileText, Shield } from "lucide-react";
import { getTranslations } from "next-intl/server";

type LegalPageProps = {
  searchParams?: Promise<{
    tab?: string;
  }>;
};

export default async function LegalPage({ searchParams }: LegalPageProps) {
  const t = await getTranslations("studentHelp.legal");

  const params = await searchParams;
  const activeTab = params?.tab === "privacy" ? "privacy" : "terms";

  const tabs = [
    {
      key: "terms",
      label: t("tabs.terms"),
      icon: FileText,
      href: "?tab=terms",
    },
    {
      key: "privacy",
      label: t("tabs.privacy"),
      icon: Shield,
      href: "?tab=privacy",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("subtitle")}</p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <Link
                key={tab.key}
                href={tab.href}
                className={`flex items-center justify-center gap-2 border-b-2 pb-3 text-sm font-medium transition ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-blue-600"
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </Link>
            );
          })}
        </div>

        <div className="pt-8">
          {activeTab === "terms" ? <TermsContent /> : <PrivacyContent />}
        </div>
      </div>
    </div>
  );
}

async function TermsContent() {
  const t = await getTranslations("studentHelp.legal.terms");

  return (
    <div className="max-w-5xl space-y-6 text-sm text-gray-700">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-xs text-gray-500">{t("lastUpdated")}</p>
      </div>

      <Section title={t("acceptance.title")}>
        {t("acceptance.content")}
      </Section>

      <Section title={t("accounts.title")}>{t("accounts.content")}</Section>

      <Section title={t("courseAccess.title")}>
        {t("courseAccess.content")}
      </Section>

      <Section title={t("examIntegrity.title")}>
        {t("examIntegrity.content")}
      </Section>

      <Section title={t("payments.title")}>{t("payments.content")}</Section>

      <Section title={t("termination.title")}>
        {t("termination.content")}
      </Section>
    </div>
  );
}

async function PrivacyContent() {
  const t = await getTranslations("studentHelp.legal.privacy");

  return (
    <div className="max-w-5xl space-y-6 text-sm text-gray-700">
      <div>
        <h2 className="text-xl font-bold text-gray-900">{t("title")}</h2>
        <p className="mt-2 text-xs text-gray-500">{t("lastUpdated")}</p>
      </div>

      <Section title={t("collect.title")}>
        <p>{t("collect.content")}</p>

        <ul className="mt-3 list-disc space-y-1 pl-6">
          {t.raw("collect.items").map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("use.title")}>
        <p>{t("use.content")}</p>

        <ul className="mt-3 list-disc space-y-1 pl-6">
          {t.raw("use.items").map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("sharing.title")}>
        <p>{t("sharing.content")}</p>

        <ul className="mt-3 list-disc space-y-1 pl-6">
          {t.raw("sharing.items").map((item: string) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section title={t("security.title")}>{t("security.content")}</Section>

      <Section title={t("rights.title")}>{t("rights.content")}</Section>

      <Section title={t("contact.title")}>{t("contact.content")}</Section>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-2 font-bold text-gray-900">{title}</h3>
      <div className="leading-6 text-gray-700">{children}</div>
    </section>
  );
}