"use client"

import type { ReactNode } from "react"
import { ThemeProvider } from "next-themes"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

/**
 * Shell ReUI gọi useTheme → bắt buộc ThemeProvider; tooltip cần TooltipProvider;
 * block chart báo "đã tải CSV" qua sonner → Toaster.
 * Mặc định "light" vì trang cũ viết tay còn hardcode màu sáng — đổi sang
 * "system" khi P1–P5 thay hết bằng block ReUI.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      <TooltipProvider>
        {children}
        <Toaster />
      </TooltipProvider>
    </ThemeProvider>
  )
}
