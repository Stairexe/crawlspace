import { ImageResponse } from "next/og";

export const alt = "Crawlspace — see your site the way AI engines do";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ENGINES = ["ChatGPT", "Claude", "Perplexity", "Copilot", "AI Overviews"];

export default function OpengraphImage() {
  const grid = Array.from({ length: 13 }, (_, i) => i * 100);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#f9f9f9", position: "relative", fontFamily: "sans-serif" }}>
        {grid.map((x) => (
          <div key={`v${x}`} style={{ position: "absolute", left: x, top: 0, width: 1, height: 630, background: "#ececec" }} />
        ))}
        {grid.slice(0, 7).map((y) => (
          <div key={`h${y}`} style={{ position: "absolute", top: y, left: 0, height: 1, width: 1200, background: "#ececec" }} />
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "56px 72px 0", position: "relative" }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path d="M4.5 14.5a7.5 7.5 0 0 1 15 0v.75h-15z" fill="#FF4C00" />
            <circle cx="12" cy="11.6" r="1.9" fill="#fff" />
            <path d="M8.6 7.9 7 4.6M15.4 7.9 17 4.6M6.4 15.6 3.6 19.6M10 15.6 9.2 20.4M14 15.6l.8 4.8M17.6 15.6l2.8 4" stroke="#FF4C00" strokeWidth="1.9" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#262626", letterSpacing: -1 }}>Crawlspace</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", padding: "70px 72px 0", position: "relative" }}>
          <div style={{ fontSize: 76, fontWeight: 600, color: "#262626", letterSpacing: -3, lineHeight: 1.05 }}>See your site the way</div>
          <div style={{ fontSize: 76, fontWeight: 600, color: "#FF4C00", letterSpacing: -3, lineHeight: 1.05 }}>AI engines do</div>
          <div style={{ marginTop: 26, fontSize: 28, color: "#616161" }}>Free GEO audit · five engine scores · no account, no key</div>
        </div>
        <div style={{ display: "flex", gap: 12, position: "absolute", left: 72, bottom: 56 }}>
          {ENGINES.map((e) => (
            <div key={e} style={{ display: "flex", padding: "10px 18px", borderRadius: 12, border: "1px solid #e3e3e3", background: "#fff", fontSize: 22, color: "#525252" }}>
              {e}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
