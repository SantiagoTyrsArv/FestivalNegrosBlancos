import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Outfit } from "next/font/google";
import { es } from "@/shared/i18n/es";
import { SiteFooter } from "@/shared/ui/layout/SiteFooter";
import { SiteHeader } from "@/shared/ui/layout/SiteHeader";
import { SITE_URL } from "@/shared/config/constants";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit", display: "swap" });
const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { template: `%s · ${es.sitio.nombreCorto}`, default: es.sitio.nombre },
  description: es.sitio.descripcion,
  applicationName: es.sitio.nombre,
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: es.sitio.nombre,
    title: es.sitio.nombre,
    description: es.sitio.descripcion,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0b09" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${outfit.variable} ${bricolage.variable} ${jetbrains.variable}`}>
      <body className="flex min-h-dvh flex-col">
        <a href="#contenido" className="skip-link">
          {es.sitio.saltarContenido}
        </a>
        <SiteHeader />
        <main id="contenido" tabIndex={-1} className="flex-1 outline-none">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
