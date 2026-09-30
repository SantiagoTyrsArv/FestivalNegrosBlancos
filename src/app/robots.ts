import type { MetadataRoute } from "next";
import { SITE_URL } from "@/shared/config/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/checkout", "/mi-agenda", "/buscar", "/login", "/registro", "/api/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
