import { ImageResponse } from "next/og";

// Force dynamic rendering to avoid prerendering issues
export const dynamic = "force-dynamic";

// Image metadata for Open Graph
export const alt = "Zip - Logic Puzzle Game";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

// Open Graph image for social sharing
export default async function OpenGraphImage() {
  // Make it dynamic to avoid prerendering issues
  const params = new URLSearchParams();
  params.set("t", Date.now().toString());

  return new ImageResponse(
    (
      <div
        style={{
          background:
            "linear-gradient(135deg, #fff7ed 0%, #fae8ff 50%, #eff6ff 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Subtle grid pattern */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: 0.05,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23f97316' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%' height='100%' fill='url(%23grid)'/%3E%3C/svg%3E")`,
          }}
        />

        {/* Logo container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 40,
          }}
        >
          {/* Icon */}
          <div
            style={{
              background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
              width: 160,
              height: 160,
              borderRadius: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 32,
              boxShadow: "0 8px 32px rgba(249, 115, 22, 0.3)",
            }}
          >
            <svg width="100" height="100" viewBox="0 0 24 24" fill="none">
              <path 
                d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" 
                fill="white" 
                stroke="white" 
                strokeWidth="0.3"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Title */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                fontSize: 120,
                fontWeight: 900,
                background: "linear-gradient(135deg, #f97316 0%, #fb923c 100%)",
                backgroundClip: "text",
                color: "transparent",
                fontFamily: "system-ui, -apple-system, sans-serif",
                letterSpacing: "-0.03em",
              }}
            >
              Zip
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 36,
            color: "#0a0a0a",
            opacity: 0.7,
            fontFamily: "system-ui, -apple-system, sans-serif",
            fontWeight: 500,
          }}
        >
          Connect the numbers in sequence
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
