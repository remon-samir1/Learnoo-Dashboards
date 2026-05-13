import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.learnoo.app',
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin(
  // Specify a custom path here
  "./i18n.ts"
);
export default withNextIntl(nextConfig);;

