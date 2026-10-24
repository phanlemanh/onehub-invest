// tier-a-guard.mjs — MỘT bộ soát tầng A cho mọi đường dữ liệu rời máy (NT2 `soat-tang-a-moi-duong-len-cloud`):
// sync-cloud (scanSourceNames → payload bảng) và push-ops-facts (bản tin ops_heartbeat). Lõi khớp tên là
// findSourceNames của mask-source-names.mjs (ON7) — bộ che và bộ soát dùng chung một lõi, một bảng ca.
// Báo bằng đường JSON + mã — KHÔNG bao giờ trả tên.
import { findSourceNames } from "./mask-source-names.mjs";

/** Token rời (real_name, source_ids) → entries cho lõi; mã của chỗ trúng là chính token (sync-cloud chỉ cần biết có/không). */
export function entriesFromTokens(tokens) {
  return (tokens ?? []).filter(Boolean).map((t) => ({ code: t, realName: t }));
}

/**
 * Mọi giá trị chuỗi của `value` mang tên nguồn thật: [{ path, code }]. `exempt`: regex đường được miễn (vd tên nhóm S03
 * tầng C). Đi sâu mọi mảng/đối tượng; đường dạng `jobs[0].lastLine`.
 */
export function guardValues(value, entries, { exempt = [] } = {}) {
  const out = [];
  const walk = (v, p) => {
    if (exempt.some((re) => re.test(p))) return;
    if (typeof v === "string") for (const h of findSourceNames(v, entries)) out.push({ path: p, code: h.code });
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`));
    else if (v && typeof v === "object") for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k);
  };
  walk(value, "");
  return out;
}
