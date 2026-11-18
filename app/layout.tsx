import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DVERSO STUDIO — Independent Creative & Digital Agency",
  description: "We build distinctive identities and digital experiences for ambitious brands.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#080808",
};

// Runs before first paint: flags "already seen this session" and "motion allowed" so the
// preloader/hidden intro states never flash. Reduced motion skips the preloader entirely.
const bootScript = `(function(){try{var d=document.documentElement;var r=matchMedia('(prefers-reduced-motion: reduce)').matches;var s=false;try{s=!!sessionStorage.getItem('dverso-seen')}catch(e){}if(r||s)d.setAttribute('data-seen','1');if(!r)d.setAttribute('data-motion','1')}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
