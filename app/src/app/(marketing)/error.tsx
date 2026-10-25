"use client";

import { PageError } from "@/components/states/page-error";

/**
 * Lỗi của trang chủ / Phương pháp: nằm TRONG layout marketing nên navbar và chân trang vẫn đứng,
 * chỉ vùng nội dung báo lỗi. «Thử lại» gọi `retry()` (Next 16: tải lại phần trang từ server),
 * không phải `reset()` (chỉ vẽ lại từ client, lỗi dữ liệu sẽ lặp lại).
 */
export default function MarketingError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <PageError error={error} reset={retry} />
    </div>
  );
}
