import { Globe, MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import ProfileLinkRow from "./ProfileLinkRow";

export default function ProfileLinksCard() {
  const t = useTranslations("studentProfile");

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 shadow-sm">
      <h3 className="mb-4 text-base font-bold text-[var(--text-dark)]">
        {t("title")}
      </h3>

      <div className="space-y-3">
        <ProfileLinkRow
          icon={<MessageCircle size={18} />}
          title="WhatsApp"
          status={t("connected")}
          connected
        />

        <ProfileLinkRow
          icon={<Send size={18} />}
          title="Telegram"
          status={t("connected")}
          connected
        />

        <ProfileLinkRow
          icon={<Globe size={18} />}
          title="Website"
          status={t("connected")}
        />
      </div>
    </div>
  );
}
