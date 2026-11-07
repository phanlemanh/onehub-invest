// ten-nguon.mjs — E10 (AC-10): không lần xuất hiện MỚI nào của tên nguồn thật hay tên miền trong mọi tệp đổi so với nhánh chính, cộng
// 079, 080, .patch extension và _acceptance/link-nguoi-ban-s03/**. Sổ tên đọc từ source_registry local (real_name, source_ids, tên miền
// trong note) — KHÔNG in tên; báo bằng mã S0x + tệp. Bắt cả dạng tách chuỗi rồi nối («ab" + "cd»). Kho không giữ mẫu link hồ sơ.
// Đối chứng: một tên của sổ chép vào tệp tạm thì phép quét phải đỏ.
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findSourceNames } from "../../pipeline/lib/mask-source-names.mjs";
import { ROOT, boKiem, noiDbThu } from "./chung.mjs";

const HO_SO = "_acceptance/link-nguoi-ban-s03";
const PATCH = `${HO_SO}/extension.patch`;
const LUON_QUET = ["db/migrations/079_lien_lac_nguoi.sql", "db/migrations/080_ho_so_s03.sql", PATCH];
const TEN_MIEN = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:vn|com|net|org|io|me|asia|app|co)\b/gi;
// Mẫu link hồ sơ: một URL ghép với username (biến, chỗ thế hay phép cộng chuỗi).
const MAU_LINK = /https?:\/\/[^\s'"`]*(?:\$\{[^}]*user|\{user|%s)|https?:\/\/[^\s'"`]*["'`]\s*\+\s*\w*user/i;

const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] });

/** Bản gộp chuỗi: «"ab" + "cd"» → «abcd», để tên tách đôi vẫn bị bắt. */
const noiChuoi = (s) => s.replace(/(["'`])\s*\+\s*\n?\s*\1/g, "");

/**
 * Miễn có tên (giám sát quyết 07/11, Notes hợp đồng): thư mục extension trong cây upstream OpenClaw không do kho đặt tên. Chỉ trong
 * extension.patch, chỉ trên dòng đầu khối diff (`diff --git`, `---`, `+++`), chỉ tiền tố `extensions/<thư mục>/` mà dòng `diff --git`
 * khai — thay bằng `extensions/_/`. Dòng nội dung của .patch vẫn bị quét như mọi tệp.
 */
export function boDuongExtension(text) {
  const thuMuc = new Set([...text.matchAll(/^diff --git a\/extensions\/([^/\s]+)\//gm)].map((m) => m[1]));
  return text.split("\n").map((l) => {
    if (!/^(diff --git |--- a\/|\+\+\+ b\/)/.test(l)) return l;
    let ra = l;
    for (const d of thuMuc) ra = ra.split(`extensions/${d}/`).join("extensions/_/");
    return ra;
  }).join("\n");
}

const HOP_DONG = `${HO_SO}/contract.md`;
const VUNG_DINH_DANH = (f) => f === PATCH || f.startsWith("collector/openclaw/");

/** Danh sách định danh upstream miễn có tên, đọc từ dòng Notes «Định danh upstream miễn có tên» của hợp đồng (một nguồn). */
export function dinhDanhUpstream(hopDong) {
  const dong = hopDong.split("\n").find((l) => l.startsWith("- Định danh upstream miễn có tên"));
  if (!dong) return [];
  const dau = dong.indexOf("Danh sách:");
  const cuoi = dong.indexOf("Chỉ áp", dau);
  if (dau < 0 || cuoi < 0) return [];
  // Mỗi định danh phải có chữ ngoài chỗ thế: chỗ thế đứng riêng sẽ miễn chính tên kênh.
  return [...dong.slice(dau, cuoi).matchAll(/`([^`]+)`/g)].map((m) => m[1]).filter((d) => d.replace(/\{S\d\d\}/g, "").length >= 2);
}

/** Dòng chú thích (kể cả dòng nội dung của .patch mở đầu bằng +, -, khoảng trắng). */
const laChuThich = (l) => /^[+\- ]?\s*(\/\/|\/\*|\*|#)/.test(l);

/**
 * Thay mọi định danh upstream đã khai (chỗ thế {Sxx} → tên thật của mã đó trong sổ, không phân hoa thường) bằng «_ID_», khớp nguyên
 * từ, chỉ trên dòng mã. Dòng chú thích giữ nguyên nên vẫn bị quét.
 */
export function boDinhDanhUpstream(text, dinhDanh, tenTheoMa) {
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const res = dinhDanh.map((d) => new RegExp(`(?<![A-Za-z0-9_$])${d.split(/(\{S\d\d\})/).map((p) => {
    const m = p.match(/^\{(S\d\d)\}$/);
    return m ? `(?:${(tenTheoMa.get(m[1]) ?? ["\\u0000"]).map(esc).join("|")})` : esc(p);
  }).join("")}(?![A-Za-z0-9_$])`, "gi"));
  return text.split("\n").map((l) => (laChuThich(l) ? l : res.reduce((x, re) => x.replace(re, "_ID_"), l))).join("\n");
}

function dem(text, entries) {
  const m = new Map();
  for (const t of [text, noiChuoi(text)]) {
    const theo = new Map();
    for (const h of findSourceNames(t, entries)) theo.set(h.code, (theo.get(h.code) ?? 0) + 1);
    for (const [k, v] of theo) m.set(k, Math.max(m.get(k) ?? 0, v));
  }
  return m;
}

function tepHoSo(dir) {
  const out = [];
  if (!existsSync(join(ROOT, dir))) return out;
  for (const n of readdirSync(join(ROOT, dir))) {
    const p = `${dir}/${n}`;
    if (statSync(join(ROOT, p)).isDirectory()) out.push(...tepHoSo(p));
    else out.push(p);
  }
  return out;
}

export async function chay(argv) {
  const k = boKiem("ten-nguon");
  const c = await noiDbThu();
  let entries;
  try {
    const rows = (await c.query("SELECT code, real_name, source_ids, note FROM source_registry")).rows;
    entries = rows.flatMap((r) => [
      ...(r.real_name ? [{ code: r.code, realName: r.real_name }] : []),
      ...(r.source_ids ?? []).map((s) => ({ code: r.code, realName: s })),
      ...[...String(r.note ?? "").matchAll(TEN_MIEN)].map((m) => ({ code: r.code, realName: m[0] })),
    ]);
  } finally {
    await c.end();
  }
  k.kiem("sổ tên đọc được từ source_registry", entries.length > 0);

  const tenTheoMa = new Map();
  for (const e of entries) tenTheoMa.set(e.code, [...(tenTheoMa.get(e.code) ?? []), e.realName]);
  const dinhDanh = dinhDanhUpstream(readFileSync(join(ROOT, HOP_DONG), "utf8"));
  const base = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : git("merge-base", "HEAD", "origin/main").trim();
  const doi = [...git("diff", "--name-only", "--diff-filter=AMR", base, "--").split("\n"),
    ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean);
  const tep = [...new Set([...doi, ...LUON_QUET, ...tepHoSo(HO_SO)])]
    .filter((f) => existsSync(join(ROOT, f)) && !/\.(png|jpe?g|gz|webp)$/i.test(f));
  const moi = [];
  const link = [];
  for (const f of tep) {
    const mien = (x) => {
      const a = f === PATCH ? boDuongExtension(x) : x;
      return VUNG_DINH_DANH(f) ? boDinhDanhUpstream(a, dinhDanh, tenTheoMa) : a;
    };
    // Tệp chưa theo dõi có thể biến mất giữa lúc liệt kê và lúc đọc (bộ test chạy song song tạo rồi xoá tệp tạm): không còn thì
    // không có gì để quét — bỏ qua tệp ấy, không dừng cả phép quét. Lỗi đọc khác vẫn ném.
    let noiDung;
    try { noiDung = readFileSync(join(ROOT, f), "utf8"); } catch (e) { if (e?.code === "ENOENT") continue; throw e; }
    const sau = mien(noiDung);
    let truoc = "";
    try { truoc = mien(git("show", `${base}:${f}`)); } catch { /* tệp mới */ }
    const a = dem(truoc, entries);
    for (const [code, n] of dem(sau, entries)) if (n > (a.get(code) ?? 0)) moi.push(`${code} +${n - (a.get(code) ?? 0)} ${f}`);
    if (MAU_LINK.test(sau) && !MAU_LINK.test(truoc)) link.push(f);
  }
  for (const m of moi) console.log(`MỚI ${m}`);
  for (const f of link) console.log(`MẪU LINK ${f}`);
  console.log(`ten-nguon: quét ${tep.length} tệp so với ${base.slice(0, 8)}`);
  k.kiem(`0 lần xuất hiện mới của tên nguồn (${moi.length})`, moi.length === 0);
  k.kiem(`không có mẫu link hồ sơ trong kho (${link.length})`, link.length === 0);

  // Đối chứng: tên của sổ (tách đôi bằng phép cộng chuỗi) trong tệp tạm → phải bắt được.
  const tam = mkdtempSync(join(tmpdir(), "lnb-tn-"));
  try {
    const ten = entries.find((e) => e.realName.length >= 6)?.realName ?? entries[0].realName;
    const giua = Math.floor(ten.length / 2);
    writeFileSync(join(tam, "x.mjs"), `const a = "${ten.slice(0, giua)}" + "${ten.slice(giua)}";\n`);
    k.kiem("đối chứng: tên tách chuỗi trong tệp tạm bị bắt", dem(readFileSync(join(tam, "x.mjs"), "utf8"), entries).size > 0);
    const ten2 = entries.find((e) => e.realName.length >= 4)?.realName ?? "";
    const mau = `diff --git a/extensions/${ten2}/x.ts b/extensions/${ten2}/x.ts\n+++ b/extensions/${ten2}/x.ts\n+// ${ten2}\n`;
    k.kiem("đối chứng: miễn chỉ đường đầu khối diff, dòng nội dung .patch vẫn bị bắt",
      dem(boDuongExtension(mau), entries).size > 0 && dem(boDuongExtension(mau.split("\n").slice(0, 2).join("\n")), entries).size === 0);
    k.kiem("danh sách định danh upstream đọc được từ Notes hợp đồng", dinhDanh.length > 0);
    const s03 = tenTheoMa.get("S03")?.[0] ?? "";
    const ma = `+const api = getConnected${s03}Api();\n`;
    const chu = `+// gọi getConnected${s03}Api của kênh ${s03}\n`;
    k.kiem("đối chứng: định danh upstream trên dòng mã được miễn", dem(boDinhDanhUpstream(ma, dinhDanh, tenTheoMa), entries).size === 0);
    k.kiem("đối chứng: chú thích mang tên kênh (kể cả định danh upstream) vẫn bị bắt", dem(boDinhDanhUpstream(chu, dinhDanh, tenTheoMa), entries).size > 0);
    k.kiem("đối chứng: tên kênh đứng riêng trên dòng mã vẫn bị bắt",
      dem(boDinhDanhUpstream(`+const nguon = "${s03}";\n`, dinhDanh, tenTheoMa), entries).size > 0);
    k.kiem("đối chứng: mẫu link ghép username bị bắt", MAU_LINK.test("const u = `http" + "s://x.example/$" + "{username}`"));  // tách chuỗi: tệp này không tự mang mẫu link
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  return k.ketThuc();
}
