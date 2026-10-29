import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Shell } from "@/components/Shell";
import { Providers } from "./providers";
import "./portal.css";
import "./billing.css";

const body = Manrope({ variable: "--font-body", subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });
const disp = Unbounded({ variable: "--font-disp", subsets: ["latin", "latin-ext"], weight: ["300", "400"] });

export const metadata: Metadata = {
  title: { default: "Planary Portal", template: "%s · Planary Portal" },
  description: "Turniere, Wunschlisten, Abrechnung, Team und Support für eure Organisation.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#0b0b0f",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="de" className={`${body.variable} ${disp.variable}`} suppressHydrationWarning>
      <body>
        <Providers>
          <AuthProvider>
            <Shell>{children}</Shell>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}
