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
          background: "#161411",
          borderRadius: 6,
        }}
      >
        <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
          <path
            d="M16 7c-4.97 0-9 4.03-9 9 0 3.1 1.58 5.83 3.97 7.43L16 25l5.03-1.57C23.42 21.83 25 19.1 25 16c0-4.97-4.03-9-9-9Z"
            stroke="#d4bc8a"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path d="M16 11v5l3.5 2" stroke="#f4efe6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
