import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Red Eagle Security",
  description: "Applicant intake, staff registration, client sites, and guard deployment scheduling.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
