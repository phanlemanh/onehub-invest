import { toast } from "sonner"

import { TOAST_ERROR_ICON, TOAST_SUCCESS_ICON } from "./icons"

/** Tải một tệp dựng trong trình duyệt (CSV của biểu đồ). */
export function downloadFile(name: string, body: string, type: string) {
  const url = URL.createObjectURL(new Blob([body], { type }))
  const link = document.createElement("a")
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

/** Sao chép rồi báo bằng toast; trình duyệt chặn clipboard thì báo lỗi, không ném. */
export async function copyText(text: string, title: string, description: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(title, { icon: TOAST_SUCCESS_ICON, description })
  } catch {
    toast.error("Không sao chép được", {
      icon: TOAST_ERROR_ICON,
      description: "Trình duyệt chặn quyền truy cập clipboard.",
    })
  }
}

/** Toast "đã tải" dùng chung cho mọi nút Tải CSV. */
export const toastDownloaded = (description: string) =>
  toast.success("Đã tải CSV", { icon: TOAST_SUCCESS_ICON, description })
