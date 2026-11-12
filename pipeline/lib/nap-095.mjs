// nap-095.mjs — cho test và phép đo chạy trong BEGIN … ROLLBACK (DV4 tang-tren-tin-s03): nạp migration 095 (tầng của tin)
// trong giao dịch, giữ khoá 33033 như mọi bộ nạp migration (tránh deadlock với test nạp song song).
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { co095 } from "./assert.mjs";

export const MIG_095 = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../db/migrations/095_tang_tren_tin.sql"), "utf8");
/** Phần vá hàm phân xử của 095 (§4): vá lại sau khi bộ nạp 045/059/061 đè resolve_offer_fields bằng bản cũ. */
const VA_095 = MIG_095.slice(MIG_095.indexOf("-- 4. Bộ phân xử"), MIG_095.indexOf("-- 5. Sổ từ vựng"));

/** Nạp 095 trong giao dịch đang mở (áp lại an toàn — 095 idempotent). `sql` cho ca đột biến. */
export async function napTang(client, { sql = MIG_095 } = {}) {
  await client.query("SELECT pg_advisory_xact_lock(33033)");
  await client.query(sql);
}

/** Gọi ngay sau mọi lần nạp lại 045/059/061 trong giao dịch: DB đã có trục 095 → vá lại hàm phân xử mà các bản trước vừa đè. */
export async function napLai095(client) {
  if (await co095(client)) await client.query(VA_095);
}
