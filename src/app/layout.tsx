import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AUSTIN Cat Hotel & Cafe | จัดการสต็อกและเงินสด",
  description: "ระบบจัดการสต็อกสินค้าและเงินสดร้าน AUSTIN Cat Hotel & Cafe",
  icons: {
    icon: [
      { url: "/icon.png?v=2", type: "image/png" },
      { url: "/favicon.ico?v=2" },
    ],
    apple: [
      { url: "/apple-icon.png?v=2" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-[#faf7f2] text-[#2c1a0e] antialiased">
        {children}
      </body>
    </html>
  );
}
