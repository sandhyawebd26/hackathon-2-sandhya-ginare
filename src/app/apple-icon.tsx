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
          background: "#161411",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 7c-4.97 0-9 4.03-9 9 0 3.1 1.58 5.83 3.97 7.43L16 25l5.03-1.57C23.42 21.83 25 19.1 25 16c0-4.97-4.03-9-9-9Z"
            stroke="#d4bc8a"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M16 11v5l3.5 2" stroke="#f4efe6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="16" r="1.25" fill="#d4bc8a" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
