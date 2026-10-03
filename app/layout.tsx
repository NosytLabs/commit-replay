import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Commit Replay — your GitHub story",
  description: "Explore your GitHub history, discover your biggest days, and make a shareable recap. A free community tool.",
  icons: {
    icon: "/assets/commit-cat.png",
    shortcut: "/assets/commit-cat.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><a className="skip-link" href="#main-content">Skip to content</a>{children}</body>
    </html>
  );
}
