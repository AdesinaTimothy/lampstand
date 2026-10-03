import type { MetadataRoute } from "next";
import { env } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  const base = env.APP_URL.replace(/\/$/, "");
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/courses", "/instructors/", "/verify"],
        disallow: ["/api/", "/learn/", "/dashboard", "/my-courses", "/certificates", "/bookmarks", "/notifications", "/profile", "/settings", "/instructor", "/admin", "/verify/", "/people/", "/search", "/dev/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
