"use client";

import { PageError } from "@/components/states/page-error";

/**
 * Lỗi khi dựng trang đăng nhập/đăng ký: cảnh báo lỗi chuẩn + Thử lại, trong layout toàn màn hình của (auth) (không vỏ cổng).
 * «Thử lại» gọi `retry()` (Next 16: tải lại phần trang từ server), không phải `reset()` (chỉ vẽ lại từ client, lỗi dữ liệu sẽ lặp lại).
 */
export default function AuthGroupError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center px-6">
      <PageError error={error} reset={retry} />
    </div>
  );
}
