import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Squirrel!",
    short_name: "Squirrel!",
    description: "One trusted inbox and one humane next move for a brain with too many pages open.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#226f8d",
    icons: [{ src: "/squirrel_logo.png", sizes: "512x512", type: "image/png" }],
    share_target: {
      action: "/capture",
      method: "GET",
      params: { title: "title", text: "text", url: "url" },
    },
  };
}
