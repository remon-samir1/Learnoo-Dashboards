import React, { useState } from "react";
import { useTranslations } from "next-intl";
import type { ChapterAttributes } from "@/src/types";

interface ChapterPreviewProps {
  chapter: ChapterAttributes;
}

export function ChapterPreview({ chapter }: ChapterPreviewProps) {
  const t = useTranslations("courses.detailPanel");
  const [videoError, setVideoError] = useState(false);

  // Step 1: Determine if a valid video URL exists
  const getValidVideoUrl = (): string | null => {
    const candidates = [
      chapter.video_mp4_url,
      chapter.video_hls_url,
      chapter.video,
      chapter.playlist,
    ];

    for (const url of candidates) {
      if (!url || typeof url !== "string") continue;
      
      const trimmed = url.trim();
      if (trimmed.length === 0) continue;
      
      // Exclude literal "null"
      if (trimmed === "null") continue;
      
      // Exclude URLs ending in "/storage" or "/storage/" (fake placeholder)
      if (trimmed.endsWith("/storage") || trimmed.endsWith("/storage/")) continue;
      
      return trimmed;
    }
    
    return null;
  };

  // Step 2: Determine if URL is an embed link or direct video
  const isEmbedUrl = (url: string): boolean => {
    const lowerUrl = url.toLowerCase();
    return (
      lowerUrl.includes("youtube.com/embed") ||
      lowerUrl.includes("youtube.com/watch") ||
      lowerUrl.includes("youtu.be") ||
      lowerUrl.includes("player.vimeo.com") ||
      lowerUrl.includes("vimeo.com") ||
      lowerUrl.includes("facebook.com/plugins") ||
      lowerUrl.includes("instagram.com/p") ||
      lowerUrl.includes("drive.google.com") ||
      lowerUrl.includes("player.vdocipher.com") ||
      lowerUrl.includes("vdocipher.com")
    );
  };

  // Step 3: Find first PDF attachment
  const getPdfAttachment = () => {
    return chapter.attachments?.find(
      (att) => att.attributes?.extension?.toLowerCase() === "pdf"
    );
  };

  const videoUrl = getValidVideoUrl();
  const pdfAttachment = getPdfAttachment();

  // Render video if valid URL exists
  if (videoUrl && !videoError) {
    const isEmbed = isEmbedUrl(videoUrl);

    return (
      <div>
        <label className="text-[10px] font-bold text-gray-400 max-w-[300px] uppercase tracking-wider block mb-1">
          {t("videoPreview")}
        </label>
        <div className="aspect-video w-full rounded-lg overflow-hidden border border-gray-200 bg-black">
          {isEmbed ? (
            <iframe
              src={videoUrl}
              className="w-full h-full"
              allowFullScreen
              allow="encrypted-media; accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              frameBorder="0"
            />
          ) : (
            <video
              src={videoUrl}
              className="w-[200px] h-[200px]"
              controls
              preload="metadata"
              onError={() => {
                console.error("Video load error:", videoUrl);
                setVideoError(true);
              }}
            >
              {t("videoNotSupported")}
            </video>
          )}
        </div>
      </div>
    );
  }

  // Step 4: If video failed or doesn't exist, show PDF
  if (pdfAttachment) {
    return (
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
          {t("pdfPreview")}
        </label>
        <div className="w-full h-64 rounded-lg overflow-hidden border border-gray-200">
          <iframe
            src={pdfAttachment.attributes?.path}
            className="w-full h-full"
            title={pdfAttachment.attributes?.name || t("pdfPreview")}
          />
        </div>
      </div>
    );
  }

  // Step 5: If no video and no PDF, show thumbnail
  if (chapter.thumbnail) {
    return (
      <div>
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
          {t("thumbnail")}
        </label>
        <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200">
          <img
            src={chapter.thumbnail}
            alt={t("thumbnail")}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  // Step 6: If none exist, render nothing
  return null;
}
