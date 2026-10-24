"use client";

import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";

import { AppCrash } from "@/components/states/app-crash";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
});

/**
 * Lỗi ở layout gốc hoặc layout một cổng: trang này THAY cả layout gốc nên phải tự có <html>,
 * <body>, CSS và font (Next 16, file-conventions/error.md § Global Error). ThemeProvider giữ
 * sáng/tối như phần còn lại của app (theo hệ thống hoặc lựa chọn đã lưu của người dùng).
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="vi" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="bg-background text-foreground min-h-full">
        <title>Có lỗi · One Invest</title>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AppCrash error={error} retry={retry} />
        </ThemeProvider>
      </body>
    </html>
  );
}
