import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
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
          background: "linear-gradient(145deg, #09090b 0%, #18181b 100%)",
          borderRadius: 96,
        }}
      >
        <div
          style={{
            fontSize: 280,
            fontWeight: 900,
            color: "#10b981",
            letterSpacing: -8,
          }}
        >
          P
        </div>
      </div>
    ),
    { ...size }
  );
}
