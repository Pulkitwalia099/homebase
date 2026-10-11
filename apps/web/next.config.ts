import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  async redirects() {
    return [
      { source: "/chat", destination: "/demo", permanent: false },
      { source: "/quote/:path*", destination: "/demo", permanent: false },
      { source: "/book/:path*", destination: "/demo", permanent: false },
      { source: "/booking/:path*", destination: "/demo", permanent: false },
      { source: "/confirmation/:path*", destination: "/demo", permanent: false },
      { source: "/pro/:path*", destination: "/register?type=business", permanent: false },
    ];
  },
  async headers() {
    return [{ source: "/(.*)", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ] }];
  },
};
export default nextConfig;
