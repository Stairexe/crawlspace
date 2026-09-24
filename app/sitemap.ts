import type { MetadataRoute } from "next";
import { MODEL_REVISED } from "@/lib/scoring/weights";

const BASE = "https://crawlspace-geo.vercel.app";

// lastModified is only ever a real change date: the home page carries a live specimen
// regenerated at most daily; the methodology changes when the model does.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/methodology`, lastModified: MODEL_REVISED, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
