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
  async redirects() {
    return [
      {
        source: '/exams/edit/:id',
        destination: '/exams/:id/edit',
        permanent: true,
      },
      {
        source: '/doctor/exams/edit/:id',
        destination: '/doctor/exams/:id/edit',
        permanent: true,
      },
      {
        source: '/:locale/exams/edit/:id',
        destination: '/:locale/exams/:id/edit',
        permanent: true,
      },
      {
        source: '/:locale/doctor/exams/edit/:id',
        destination: '/:locale/doctor/exams/:id/edit',
        permanent: true,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin(
  // Specify a custom path here
  "./i18n.ts"
);
export default withNextIntl(nextConfig);;
