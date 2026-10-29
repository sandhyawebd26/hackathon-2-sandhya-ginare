import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #221e19 0%, #0f0d0b 100%)",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4.5a11.5 11.5 0 0 1 9.2 18.6"
            stroke="#ecd09a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M16 27.5a11.5 11.5 0 0 1-9.2-18.6"
            stroke="#ecd09a"
            strokeWidth="1.8"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path d="M16 10.25V8.5" stroke="#ecd09a" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="7.75" r="0.9" fill="#ecd09a" />
          <path
            d="M10.5 19.25c0-3.85 2.15-6.75 5.5-6.75s5.5 2.9 5.5 6.75"
            stroke="#f6f0e6"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M9 19.25h14" stroke="#f6f0e6" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M13.25 21.25h5.5" stroke="#f6f0e6" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
