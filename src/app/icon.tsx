import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 9,
        }}
      >
        <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4.5a11.5 11.5 0 0 1 9.2 18.6"
            stroke="#d4bc8a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
          <path
            d="M16 27.5a11.5 11.5 0 0 1-9.2-18.6"
            stroke="#d4bc8a"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            opacity="0.55"
          />
          <path d="M16 10.25V8.5" stroke="#d4bc8a" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="16" cy="7.75" r="1" fill="#d4bc8a" />
          <path
            d="M10.5 19.25c0-3.85 2.15-6.75 5.5-6.75s5.5 2.9 5.5 6.75"
            stroke="#f6f0e6"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          />
          <path d="M9 19.25h14" stroke="#f6f0e6" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
