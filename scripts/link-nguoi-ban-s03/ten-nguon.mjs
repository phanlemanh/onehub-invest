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
const LUON_QUET = ["db/migrations/079_lien_lac_nguoi.sql", "db/migrations/080_ho_so_s03.sql", `${HO_SO}/extension.patch`];
const TEN_MIEN = /\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:vn|com|net|org|io|me|asia|app|co)\b/gi;
// Mẫu link hồ sơ: một URL ghép với username (biến, chỗ thế hay phép cộng chuỗi).
const MAU_LINK = /https?:\/\/[^\s'"`]*(?:\$\{[^}]*user|\{user|%s)|https?:\/\/[^\s'"`]*["'`]\s*\+\s*\w*user/i;

const git = (...a) => execFileSync("git", ["-C", ROOT, ...a], { encoding: "utf8", maxBuffer: 1 << 28, stdio: ["ignore", "pipe", "ignore"] });

/** Bản gộp chuỗi: «"ab" + "cd"» → «abcd», để tên tách đôi vẫn bị bắt. */
const noiChuoi = (s) => s.replace(/(["'`])\s*\+\s*\n?\s*\1/g, "");

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

  const base = argv.includes("--base") ? argv[argv.indexOf("--base") + 1] : git("merge-base", "HEAD", "origin/main").trim();
  const doi = [...git("diff", "--name-only", "--diff-filter=AMR", base, "--").split("\n"),
    ...git("ls-files", "--others", "--exclude-standard").split("\n")].filter(Boolean);
  const tep = [...new Set([...doi, ...LUON_QUET, ...tepHoSo(HO_SO)])]
    .filter((f) => existsSync(join(ROOT, f)) && !/\.(png|jpe?g|gz|webp)$/i.test(f));
  const moi = [];
  const link = [];
  for (const f of tep) {
    const sau = readFileSync(join(ROOT, f), "utf8");
    let truoc = "";
    try { truoc = git("show", `${base}:${f}`); } catch { /* tệp mới */ }
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
    k.kiem("đối chứng: mẫu link ghép username bị bắt", MAU_LINK.test("const u = `http" + "s://x.example/$" + "{username}`"));  // tách chuỗi: tệp này không tự mang mẫu link
  } finally {
    rmSync(tam, { recursive: true, force: true });
  }
  return k.ketThuc();
}
