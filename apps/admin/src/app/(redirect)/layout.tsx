import type { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  description: "Private Payload CMS workspace for Montelar.",
  title: "Montelar Admin",
};

export default function RedirectLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
