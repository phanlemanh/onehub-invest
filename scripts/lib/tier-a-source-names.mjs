// tier-a-source-names.mjs — danh sách tên nguồn thật (tầng A) cho các THƯỚC, rút từ câu `INSERT INTO source_registry`
// trong db/migrations/*.sql đã commit — không viết cứng tên (pii-spl.md), chạy được ở CI không có DB. ON7
// `ops-nhan-ma-nguon`. Thước báo vi phạm bằng mã S0x, KHÔNG in tên. Lõi khớp tên dùng chung với bộ che lúc chạy.
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export { findSourceNames, fold, nameVariants } from "../../pipeline/lib/mask-source-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

/** Tách một bộ giá trị SQL «('a', 'b''c', '{x}')» thành mảng chuỗi (bỏ nháy, gộp '' thành '). */
function tuple(src) {
  const out = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'") {
      let s = "";
      i++;
      while (i < src.length) {
        if (src[i] === "'" && src[i + 1] === "'") { s += "'"; i += 2; continue; }
        if (src[i] === "'") { i++; break; }
        s += src[i++];
      }
      out.push(s);
    } else if (/[A-Za-z0-9]/.test(c)) {
      let s = "";
      while (i < src.length && /[^,)\s]/.test(src[i])) s += src[i++];
      out.push(s);
    } else i++;
  }
  return out;
}

/** [{ code, realName, labelVi }] từ mọi câu INSERT INTO source_registry của db/migrations (theo thứ tự tệp). */
export function sourceRegistrySeeds(root = ROOT) {
  const dir = path.join(root, "db", "migrations");
  const seeds = new Map();
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".sql")).sort()) {
    const sql = readFileSync(path.join(dir, f), "utf8");
    const re = /INSERT\s+INTO\s+source_registry\s*\(([^)]*)\)\s*VALUES\s*([\s\S]*?)(?:ON\s+CONFLICT|;)/gi;
    for (const m of sql.matchAll(re)) {
      const cols = m[1].split(",").map((c) => c.trim());
      // mỗi bộ giá trị là một cặp ngoặc cấp ngoài cùng (giá trị mảng '{…}' nằm trong nháy, không chứa ngoặc tròn)
      for (const t of m[2].matchAll(/\(((?:[^()']|'(?:[^']|'')*')*)\)/g)) {
        const v = tuple(t[1]);
        const row = Object.fromEntries(cols.map((c, k) => [c, v[k]]));
        if (row.code && row.real_name) seeds.set(row.code, { code: row.code, realName: row.real_name, labelVi: row.label_vi ?? null });
      }
    }
  }
  if (seeds.size === 0) throw new Error("tier-a-source-names: không rút được tên nào từ db/migrations — thước không được chạy mù");
  return [...seeds.values()];
}
