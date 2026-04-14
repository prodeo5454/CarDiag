/** @type {import('next').NextConfig} */
const staticExport = process.env.STATIC_EXPORT === '1';

const nextConfig = {
  reactStrictMode: true,
  generateEtags: false,
  trailingSlash: false,

  ...(staticExport
    ? {
        output: 'export',
        images: { unoptimized: true },
      }
    : {
        images: {
          domains: ['localhost'],
          formats: ['image/webp', 'image/avif'],
        },
        async headers() {
          return [
            {
              source: '/sw.js',
              headers: [
                { key: 'Content-Type', value: 'application/javascript' },
                {
                  key: 'Cache-Control',
                  value: 'no-cache, no-store, must-revalidate',
                },
              ],
            },
            {
              source: '/manifest.json',
              headers: [{ key: 'Content-Type', value: 'application/json' }],
            },
          ];
        },
        async rewrites() {
          return [{ source: '/sw.js', destination: '/sw.js' }];
        },
      }),
};

module.exports = nextConfig;
