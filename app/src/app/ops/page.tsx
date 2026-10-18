import { redirect } from "next/navigation";

/** Chưa có trang tổng quan vận hành (G0-e+) — tạm đưa về chất lượng dữ liệu. */
export default function OpsIndex() {
  redirect("/ops/quality");
}
