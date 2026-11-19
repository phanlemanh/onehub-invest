// Bảng thử phá che-ten: mỗi đột biến sửa ĐÚNG một chỗ trong bản sao nhánh, chạy bộ ca liên quan, ghi ca nào đỏ. Khôi phục sau mỗi đột biến.
import { execFileSync, spawnSync } from "node:child_process"; import { readFileSync, writeFileSync } from "node:fs"; import path from "node:path";
const W = process.argv[2]; const OUT = process.argv[3];
const T = {
  core: ["node", ["--test", "pipeline/scripts/ops-nhan-ma-nguon.test.mjs", "scripts/ops-nhan-ma-nguon.test.mjs"]],
  soat: ["node", ["--test", "pipeline/scripts/soat-tang-a.test.mjs"]],
  push: ["node", ["--test", "--test-concurrency=1", "pipeline/scripts/push-ops-facts-import.test.mjs"]],
  itest: ["bash", ["db/db-thu.sh", "oneinvest_suite_u1_thu_pha", "--chay", "node", "--test", "--test-concurrency=1", "pipeline/scripts/source-name-entries.itest.mjs"]],
};
const P = "pipeline/lib/mask-source-names.mjs", A = "app/src/lib/mask-source-names.ts", SC = "pipeline/sync-cloud.mjs", PU = "pipeline/push-ops-facts.mjs", G = "pipeline/lib/tier-a-guard.mjs";
const loi = (f, ten) => [
  [`${ten}-1 khớp cụm không thoát ký tự đặc biệt`, f, "(m) => `\\\\${m}`", "(m) => m", ["core"]],
  [`${ten}-2 tắt hẳn khớp cụm`, f, "  if (!wholeOnly) return null", "  return null", ["core"]],
  [`${ten}-3 dấu phân tách chỉ còn sáu loại cũ`, f, '"(?:[^\\\\p{L}\\\\p{N}\\\\p{M}]|%[0-9a-f]{2})+"', '"[\\\\s.\\\\-_/]+"', ["core"]],
  [`${ten}-4 bỏ mã URL khỏi dấu phân tách`, f, '"(?:[^\\\\p{L}\\\\p{N}\\\\p{M}]|%[0-9a-f]{2})+"', '"(?:[^\\\\p{L}\\\\p{N}\\\\p{M}])+"', ["core"]],
  [`${ten}-5 chỉ một dấu phân tách`, f, '"(?:[^\\\\p{L}\\\\p{N}\\\\p{M}]|%[0-9a-f]{2})+"', '"(?:[^\\\\p{L}\\\\p{N}\\\\p{M}]|%[0-9a-f]{2})"', ["core"]],
  [`${ten}-6 không chuẩn hoá NFD`, f, 'if (text === text.normalize("NFC")) return', 'if (true) return', ["core"]],
  [`${ten}-7 bỏ dạng tên miền bỏ nhãn đầu`, f, "if (nhan.length >= 3)", "if (false)", ["core"]],
  [`${ten}-8 bỏ qua cờ, vẫn lấy từ đầu`, f, "if (!wholeOnly && words.length > 1", "if (words.length > 1", ["core"]],
  [`${ten}-9 không gập chữ trước khi khớp`, f, 'return { f: fold(text), dau: null, cuoi: null }', 'return { f: text, dau: null, cuoi: null }', ["core"]],
  [`${ten}-10 vị trí che lệch trên chữ tổ hợp`, f, "end: cuoi[h.end - 1]", "end: dau[h.end - 1]", ["core"]],
];
const DB = [
  ...loi(P, "lõi pipeline"), ...loi(A, "lõi app"),
  ["SQL-1 bỏ nhánh so trên bản bỏ dấu", SC, ".concat(lien.map(", ".concat([].map(", ["itest"]],
  ["SQL-2 lớp ký tự SQL chỉ còn dấu cũ", SC, "'(%[0-9a-f]{2}|[^[:alnum:]])+'", "'[[:space:]._/-]+'", ["itest"]],
  ["SQL-3 bỏ mã URL khỏi lớp ký tự SQL", SC, "'(%[0-9a-f]{2}|[^[:alnum:]])+'", "'([^[:alnum:]])+'", ["itest"]],
  ["SOAT-4 bộ soát bảng soát chuỗi JSON thay giá trị", SC, "if (!guardValues(JSON.parse(j), entriesFromTokens(tokens)).length) continue;", "if (!scanSourceNames(j, tokens)) continue;", ["soat"]],
  ["SQL-4 bỏ qua cờ khi dựng biến thể SQL", SC, "nameVariants(e.realName, { wholeOnly: e.wholeOnly })", "nameVariants(e.realName)", ["itest"]],
  ["SOAT-1 bộ soát sync-cloud luôn cho qua", SC, "  return hit ? hit.code : null;", "  return null;", ["soat", "itest"]],
  ["SOAT-2 mất cờ khi đổi token sang mục", G, "wholeOnly: t.wholeOnly === true", "wholeOnly: false", ["soat", "itest"]],
  ["SOAT-3 bộ soát bỏ qua giá trị chuỗi", G, 'if (typeof v === "string") for', 'if (false) for', ["soat"]],
  ["PUSH-1 gọi main() không chốt", PU, "if (laTepChinh()) main()", "main()", ["push"]],
  ["PUSH-2 so đường không qua realpath", PU, "realpathSync(process.argv[1]) === fileURLToPath", "process.argv[1] === fileURLToPath", ["push"]],
  ["PUSH-3 bỏ nhánh chạy khô", PU, "  if (kho) {\n    for (const l of chan)", "  if (false) {\n    for (const l of chan)", ["push"]],
  ["PUSH-4 chạy khô luôn thoát 1", PU, "    process.exitCode = chan.length ? 1 : 0;\n    return;\n  }\n  if (chan.length)", "    process.exitCode = 1;\n    return;\n  }\n  if (chan.length)", ["push"]],
];
const chay = (keys) => { const r = {}; for (const k of keys) { const [cmd, args] = T[k]; const p = spawnSync(cmd, args, { cwd: W, encoding: "utf8", input: "", maxBuffer: 64e6 }); const out = (p.stdout ?? "") + (p.stderr ?? ""); r[k] = { code: p.status, do: [...new Set(out.split("\n").filter((l) => /^\s*✖ /.test(l) && !/failing tests/.test(l)).map((l) => l.replace(/^\s*✖ /, "").replace(/ \(\d.*$/, "").trim()))] }; } return r; };
const dong = []; const nen = chay(["core", "soat", "push", "itest"]);
dong.push(`| — | không đột biến (nền) | — | ${Object.entries(nen).map(([k, v]) => `${k}=${v.code}`).join(" ")} | ${Object.values(nen).flatMap((v) => v.do).length} | ${Object.values(nen).every((v) => v.code === 0) ? "nền xanh" : "NỀN ĐỎ"} |`);
let song = 0;
for (const [ten, f, a, b, keys] of DB) {
  const fp = path.join(W, f); const goc = readFileSync(fp, "utf8"); const n = goc.split(a).length - 1;
  if (n !== 1) { dong.push(`| ${ten} | \`${f}\` | khuôn khớp ${n} chỗ | — | — | KHÔNG CHẠY |`); continue; }
  writeFileSync(fp, goc.replace(a, b));
  try { const r = chay(keys); const doTong = Object.values(r).flatMap((v) => v.do); const giet = Object.values(r).some((v) => v.code !== 0) && doTong.length > 0; if (!giet) song++;
    dong.push(`| ${ten} | \`${f}\` | ${keys.join(", ")} | ${Object.entries(r).map(([k, v]) => `${k}=${v.code}`).join(" ")} | ${doTong.length}: ${doTong.slice(0, 3).join(" · ").replace(/\|/g, "/").slice(0, 160)} | ${giet ? "chết" : "SỐNG"} |`);
  } finally { writeFileSync(fp, goc); }
  console.error(dong.at(-1).slice(0, 160));
}
const sach = execFileSync("git", ["status", "--short"], { cwd: W, encoding: "utf8" }).trim();
writeFileSync(OUT, `| Đột biến | Tệp | Bộ ca | Mã thoát | Ca đỏ | Kết quả |\n|---|---|---|---|---|---|\n${dong.join("\n")}\n\nĐột biến sống: ${song}/${DB.length}. Cây sau lượt: ${sach ? "BẨN" : "sạch"}.\n`);
console.log(`xong: ${DB.length} đột biến, sống ${song}, cây ${sach ? "BẨN" : "sạch"}`);
