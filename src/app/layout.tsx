import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wareflow — Manajemen Inventaris",
  description: "Aplikasi manajemen stok dan inventaris",
};

const themeScript = `try{var t=localStorage.getItem("wd-theme");if(t==="dark"||t==="light"){document.documentElement.dataset.theme=t}}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${manrope.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <div className="wd-backdrop" aria-hidden="true">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wd-backdrop.jpg" alt="" fetchPriority="high" />
        </div>
        {children}
      </body>
    </html>
  );
}
