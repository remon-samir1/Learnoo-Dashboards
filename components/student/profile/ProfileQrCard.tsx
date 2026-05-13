"use client";

import { useRef } from "react";
import { Download, QrCode } from "lucide-react";
import { useTranslations } from "next-intl";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";

type ProfileQrCardProps = {
  student: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    university: string;
    faculty: string;
    status: string;
  };
};

export default function ProfileQrCard({
  student,
}: ProfileQrCardProps) {
  const t = useTranslations("studentProfile");

  const qrRef = useRef<SVGSVGElement | null>(null);

  const qrValue = JSON.stringify({
    studentId: student.id,
    fullName: student.fullName,
    email: student.email,
    phone: student.phone,
    university: student.university,
    faculty: student.faculty,
    status: student.status,
  });

  const handleDownload = () => {
    const svg = qrRef.current;

    if (!svg) {
      toast.error(t("qr.downloadError"));
      return;
    }

    const serializer = new XMLSerializer();
    const svgData = serializer.serializeToString(svg);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx?.drawImage(img, 0, 0);

      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");

      downloadLink.download = `student-qr-${student.id}.png`;
      downloadLink.href = pngFile;

      downloadLink.click();

      toast.success(t("qr.downloadSuccess"));
    };

    img.onerror = () => {
      toast.error(t("qr.downloadError"));
    };

    img.src =
      "data:image/svg+xml;base64," +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="rounded-2xl flex flex-col gap-1 border border-[var(--border-color)] bg-[var(--card-bg)] p-7 text-center shadow-sm">
      <QrCode
        className="mx-auto text-[var(--primary)]"
        size={32}
      />

      <h3 className="text-base font-bold text-[var(--text-dark)]">
        {t("qr.title")}
      </h3>

      <p className="mt-1 text-sm text-[var(--text-muted)]">
        {t("qr.description")}
      </p>

      <div className="mx-auto flex size-44 items-center justify-center rounded-xl bg-white p-3">
        <QRCodeSVG
          ref={qrRef}
          value={qrValue}
          size={150}
          level="H"
          className="rounded-xl border border-gray-200 p-2 shadow-sm"
        />
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary)] transition hover:opacity-80"
      >
        <Download size={16} />
        {t("download")}
      </button>
    </div>
  );
}