import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Network Asset Management System – Phillip Securities Hong Kong",
  description: "Network Asset Management System for Phillip Securities (Hong Kong) Limited",
  icons: {
    icon: "/philliplogo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-blue-600 selection:text-white">
        {children}
      </body>
    </html>
  );
}
