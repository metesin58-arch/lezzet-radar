import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { LocationProvider } from "@/hooks/useLocation";
import { BottomNav } from "@/components/BottomNav";

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-jakarta" });

export const metadata: Metadata = {
  title: "Lezzet Radar",
  description: "Yakınındaki en iyi puanlı mekanlar, yorumlarıyla.",
  applicationName: "Lezzet Radar",
  // Opened from the home screen it runs full screen like an app (iOS + Android)
  appleWebApp: { capable: true, title: "Lezzet Radar", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={`${jakarta.variable} font-sans antialiased`}>
        <LocationProvider>
          <div className="relative mx-auto min-h-dvh max-w-md bg-surface pb-28 shadow-[0_0_40px_rgba(0,0,0,0.04)]">
            {children}
            <BottomNav />
          </div>
        </LocationProvider>
      </body>
    </html>
  );
}
