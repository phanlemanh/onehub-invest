// enrich-call-sites.mjs — PL15 AC-6 (E22): mọi chỗ gọi hàm SQL áp/hoàn tác/quyết đề xuất enrich, kèm vai (người | máy).
// 045 xếp phát biểu vào lớp sự thật khi actor bắt đầu 'hitl:' — chỗ gọi của người phải truyền 'hitl:', chỗ của máy không.
// Ma trận viết trước; chỗ gọi mới ngoài ma trận làm test đỏ.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

export const CALL_SITES = [
  { file: "app/src/app/api/v1/ops/review/[id]/decide/route.ts", fn: "apply_enrichment", vai: "nguoi" },
  { file: "app/src/app/api/v1/ops/review/[id]/decide/route.ts", fn: "decide_enrichment_review", vai: "nguoi" },
  { file: "agent/src/enrich/run.ts", fn: "apply_enrichment", vai: "may" },
  { file: "agent/scripts/enrich-revert.ts", fn: "revert_enrichment", vai: "nguoi" },
];

const FN = /\b(apply_enrichment|revert_enrichment|decide_enrichment_review)\s*\(/g;

/** Mọi chỗ gọi trong cây (bỏ test, node_modules, migration SQL): [{file, fn, line}]. */
export function findCallSites(root, dirs = ["app/src", "agent", "pipeline", "scripts"]) {
  const out = [];
  const walk = (d) => {
    for (const e of readdirSync(join(root, d))) {
      if (["node_modules", ".next", "dist", "tests", "traces"].includes(e)) continue;
      const p = join(d, e);
      if (statSync(join(root, p)).isDirectory()) walk(p);
      else if (/\.(mjs|js|ts|tsx)$/.test(e) && !/\.(test|itest)\./.test(e)) {
        const text = readFileSync(join(root, p), "utf8");
        for (const m of text.matchAll(FN)) {
          const lineStart = text.lastIndexOf("\n", m.index) + 1;
          if (/^\s*(\/\/|\*|\/\*)/.test(text.slice(lineStart, m.index))) continue;   // chú thích
          out.push({ file: p, fn: m[1], line: text.slice(0, m.index).split("\n").length });
        }
      }
    }
  };
  for (const d of dirs) walk(d);
  return out;
}

/**
 * Tiền tố literal của actor ở một chỗ gọi, đọc từ chính tệp: tham số actor của câu gọi (đối số cuối của mảng tham số
 * `[…]` theo sau chuỗi SQL); là biểu thức `.x`/biến thì tìm câu gán hay chốt `/^hitl:…/.test(x)` của tên ấy trong tệp.
 * @returns {string|null} vd 'hitl:', 'enrich-run:'; null khi không đọc được
 */
export function readActorPrefix(text, line) {
  const tail = text.split("\n").slice(line - 1).join("\n");
  const m = /\[\s*([^\]]*?)\s*\]\s*\)/.exec(tail);
  if (!m) return null;
  const args = m[1].split(",").map((s) => s.trim()).filter(Boolean);
  const actor = args.find((a) => /actor/i.test(a) || /^[`'"]/.test(a) && /:/.test(a)) ?? args[args.length - 1];
  const lit = /^[`'"]([a-z0-9_-]+:)/i.exec(actor);
  if (lit) return lit[1];
  const ten = actor.split(".").pop();
  const gan = new RegExp(`\\b(?:const|let|var)\\s+${ten}\\s*=\\s*[\`'"]([a-z0-9_-]+:)`, "i").exec(text);
  if (gan) return gan[1];
  const chot = new RegExp(`/\\^([a-z0-9_-]+:)[^/]*/\\.test\\(\\s*(?:\\w+\\.)?${ten}\\s*\\)`, "i").exec(text);
  if (chot) return chot[1];
  return null;
}

/**
 * Kiểm vai của mọi chỗ gọi thấy trong cây so với ma trận: chỗ ngoài ma trận, actor không đọc được, người không truyền
 * 'hitl:', máy truyền 'hitl:'. Trả danh sách lỗi '<tệp>:<dòng> <lý do>' (rỗng = đạt).
 * @param {string} root
 * @param {typeof CALL_SITES} maTran
 */
export function kiemVai(root, maTran = CALL_SITES, readText = (f) => readFileSync(join(root, f), "utf8")) {
  const loi = [];
  const khoa = (x) => `${x.file}|${x.fn}`;
  for (const s of findCallSites(root)) {
    const m = maTran.find((x) => khoa(x) === khoa(s));
    if (!m) { loi.push(`${s.file}:${s.line} chỗ gọi ${s.fn} ngoài ma trận`); continue; }
    const tienTo = readActorPrefix(readText(s.file), s.line);
    if (!tienTo) loi.push(`${s.file}:${s.line} không đọc được actor`);
    else if (m.vai === "nguoi" && tienTo !== "hitl:") loi.push(`${s.file}:${s.line} chỗ của người phải truyền 'hitl:' (thấy '${tienTo}')`);
    else if (m.vai === "may" && tienTo === "hitl:") loi.push(`${s.file}:${s.line} chỗ của máy không được truyền 'hitl:'`);
  }
  for (const m of maTran) if (!findCallSites(root).some((s) => khoa(s) === khoa(m))) loi.push(`${m.file} ma trận khai ${m.fn} mà cây không còn`);
  return loi;
}
