import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "LazyTrip — International Travel Planner",
  description: "Create a personalized international trip without spending hours planning it."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
