import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "HomeBase — The API for Home Services";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #0A1628 0%, #1A2B4A 50%, #0F172A 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#FFFFFF",
              letterSpacing: "-1px",
            }}
          >
            Home
          </span>
          <span
            style={{
              fontSize: "72px",
              fontWeight: 700,
              color: "#F5A623",
              letterSpacing: "-1px",
            }}
          >
            Base
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "32px",
            color: "#94A3B8",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          The API for Home Services
        </div>

        {/* Subtle divider */}
        <div
          style={{
            width: "80px",
            height: "3px",
            background: "#F5A623",
            borderRadius: "2px",
            marginTop: "32px",
            marginBottom: "32px",
          }}
        />

        {/* Sub-tagline */}
        <div
          style={{
            fontSize: "20px",
            color: "#64748B",
            textAlign: "center",
          }}
        >
          Scope. Price. Book. Programmatically.
        </div>
      </div>
    ),
    { ...size }
  );
}
