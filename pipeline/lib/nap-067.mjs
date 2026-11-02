// nap-067.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (SV2): nạp migration 067 (tầng, hướng của tin) trong giao
// dịch, giữ khoá 33033 như mọi bộ nạp migration (tránh deadlock với test nạp song song).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { co067 } from "./assert.mjs";

export const MIG_067 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/067_tang_huong_tin.sql"), "utf8");
/** Phần hàm phân xử của 067: nạp lại sau khi bộ nạp 045/059/061 đè resolve_offer_fields bằng bản cũ. */
const HAM_067 = MIG_067.slice(MIG_067.indexOf("-- 5. Bộ phân xử"));

/** Nạp 067 trong giao dịch đang mở (áp lại an toàn — 067 idempotent). */
export async function napTangHuong(client, { sql = MIG_067 } = {}) {
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(sql);
}

/** Gọi ngay sau mọi lần nạp lại 045/059/061 trong giao dịch: DB đã có cột 067 → nạp lại hàm 067 mà các bản trước vừa đè. */
export async function napLai067(client) {
  if (await co067(client)) await client.query(HAM_067);
}
