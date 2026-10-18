import { redirect } from "next/navigation";

/** Chưa có trang tổng quan vận hành (G0-e+) — tạm đưa về thư viện thiết kế. */
export default function OpsIndex() {
  redirect("/ops/design");
}
