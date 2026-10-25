"use client"

// chuyển thể từ @reui/app-shell-36 (app-header.tsx). Khác bản gốc: breadcrumb nằm
// ở PageHeader của từng trang (một kiểu đầu trang cho hai cổng) nên header chỉ
// còn nút mở thanh bên và Chép liên kết; bỏ nút ghim (không lưu được).
import { useEffect, useState } from "react"
import { CheckIcon, LinkIcon, PanelLeftIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useSidebar } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

import { CAP_BOX } from "./faces"

function CopyLinkButton({ size }: { size: "default" | "icon" }) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 1600)
    return () => window.clearTimeout(timer)
  }, [copied])

  const copy = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => setCopied(true),
      () => toast.error("Không chép được", { description: "Trình duyệt chặn quyền bộ nhớ tạm." })
    )
  }

  return (
    <Button variant="outline" size={size} onClick={copy} aria-label={size === "icon" ? "Chép liên kết" : undefined}>
      {copied ? <CheckIcon data-icon="inline-start" aria-hidden="true" /> : <LinkIcon data-icon="inline-start" aria-hidden="true" />}
      <span className={cn(CAP_BOX, "max-md:sr-only")}>Chép liên kết</span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Đã chép liên kết" : ""}
      </span>
    </Button>
  )
}

/** Nút mở/gập thanh bên. Tự dựng thay `SidebarTrigger` của component đã cài: bản đó ghép cứng chữ đọc màn hình
 *  tiếng Anh, không đè được (ON12, OPS-17); hành vi giữ nguyên (`toggleSidebar`). */
function SidebarToggle() {
  const { toggleSidebar } = useSidebar()
  return (
    <Button
      data-sidebar="trigger"
      data-slot="sidebar-trigger"
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="text-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground -ms-1 rounded-md"
    >
      <PanelLeftIcon aria-hidden="true" />
      <span className="sr-only">Mở hoặc gập thanh bên</span>
    </Button>
  )
}

export function OpsHeader() {
  const { isMobile } = useSidebar()
  return (
    <header className="bg-background border-input/50 flex h-12 shrink-0 items-center gap-2 border-b px-3 lg:px-4">
      <SidebarToggle />
      <div className="ms-auto flex shrink-0 items-center gap-2">
        <CopyLinkButton size={isMobile ? "icon" : "default"} />
      </div>
    </header>
  )
}
