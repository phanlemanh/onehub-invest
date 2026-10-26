"use client";

import { PageError } from "@/components/states/page-error";

/** Lỗi khi dựng trang đăng nhập/đăng ký: cảnh báo lỗi chuẩn + Thử lại, trong layout toàn màn hình của (auth) (không vỏ cổng). */
export default function Error(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-md items-center px-6">
      <PageError {...props} />
    </div>
  );
}
