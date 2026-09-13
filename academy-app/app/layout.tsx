import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VedhaNet Academy",
  description: "F5 BIG-IP training videos, shorts and documents for students",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
