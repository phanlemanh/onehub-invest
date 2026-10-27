#!/usr/bin/env node
// con-ten-cu.mjs — răng của hồ sơ wanted-thanh-inquiry (AC-2, AC-4, AC-5, AC-6; E2b, E4, E5, E6b). Đo trạng thái cây:
//   «đích sinh»   bốn đích của sổ mang `inquiry` (app kèm nhãn «Yêu cầu»), không còn tên cũ;
//   «docs sống»   CONTEXT.md, ADR-0013, reso-khung, ROADMAP mang mô hình và tên mới;
//   «catchup»     câu UPDATE của migration 050 có nguyên văn trong khối «-- ÁP» của tệp catchup cloud;
//   «tên cũ»      sáu dạng viết tên cũ chỉ còn ở bảng lịch sử của AC-4 (chép nguyên văn dưới) hoặc trên dòng đổi tên.
// Cuối lượt tự chạy đối chứng trên bản sao ở thư mục tạm; đối chứng sai kỳ vọng → «răng hỏng», thoát 1.
// Đường tính từ vị trí tệp này, không hardcode gốc kho.
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

/** Bảng lịch sử — nguyên văn AC-4 của contract (12 mục, theo thứ tự). */
export const LICH_SU = [
  "db/migrations/043_ref_vocabulary.sql",
  "docs/ops/cloud-schema-catchup-2026-10-26-043.sql",
  "_acceptance/so-tu-vung-mot-nguon/**",
  "docs/superpowers/specs/2026-10-26-so-tu-vung-mot-nguon-design.md",
  "docs/superpowers/plans/2026-10-26-so-tu-vung-mot-nguon.md",
  "docs/architecture/classification-enrich-review.md",
  "docs/audit/2026-10-27-tu-ngu-tin-listing.md",
  "docs/superpowers/specs/2026-10-27-wanted-thanh-inquiry-design.md",
  "docs/superpowers/plans/2026-10-27-wanted-thanh-inquiry.md",
  "db/migrations/050_wanted_thanh_inquiry.sql",
  "docs/ops/cloud-schema-catchup-2026-10-27-050.sql",
  "_acceptance/wanted-thanh-inquiry/**",
];

/** Ma trận sáu dạng tên cũ — AC-4. */
export const DANG = [
  ["nháy kép", /"wanted"/],
  ["nháy đơn", /'wanted'/],
  ["backtick", /`wanted`/],
  ["sau code:", /\bcode:\s*wanted\b/],
  ["chuỗi liệt kê", /[|/]\s*wanted\b|\bwanted\s*[|/]/],
  ["nhãn cũ", /Tin tìm mua, tìm thuê/],
];
const DOI_TEN = /→\s*`?inquiry/;

const khopMuc = (tep, muc) => (muc.endsWith("/**") ? tep.startsWith(muc.slice(0, -2)) : tep === muc);
const docText = (p) => { const b = readFileSync(p); return b.includes(0) ? null : b.toString("utf8"); };

/** Quét tên cũ trên danh sách tệp (đường tương đối `goc`). */
export function quet(goc, tep) {
  const res = { do: [], lichSu: new Map(LICH_SU.map((m) => [m, 0])), doiTen: 0 };
  for (const t of tep) {
    let text;
    try { text = docText(path.join(goc, t)); } catch { continue; }
    if (text == null) continue;
    text.split("\n").forEach((dong, i) => {
      // tên hồ sơ `wanted-thanh-inquiry` (đường, khoá config, chú thích) không phải tên cũ của giá trị
      const sach = dong.replaceAll("wanted-thanh-inquiry", "");
      if (!DANG.some(([, re]) => re.test(sach))) return;
      const muc = LICH_SU.find((m) => khopMuc(t, m));
      if (muc) { res.lichSu.set(muc, res.lichSu.get(muc) + 1); return; }
      if (DOI_TEN.test(sach)) { res.doiTen++; return; }
      res.do.push(`${t}:${i + 1}`);
    });
  }
  return res;
}

const cau = (sql) => sql.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n")
  .split(";").map((s) => s.replace(/\s+/g, " ").trim()).filter(Boolean);

/** Câu UPDATE của migration có nguyên văn trong khối «-- ÁP» của catchup không. */
export function soCatchup(migration, catchup) {
  const ap = catchup.slice(catchup.search(/^-- ÁP/m));
  const coTrongAp = new Set(cau(ap));
  const update = cau(migration).filter((s) => /^UPDATE\b/i.test(s));
  const thieu = update.filter((s) => !coTrongAp.has(s));
  return { khop: update.length - thieu.length, tong: update.length, thieu, delete: cau(migration).filter((s) => /^DELETE\b/i.test(s)).every((s) => coTrongAp.has(s)) };
}

const doc = (t) => readFileSync(path.join(ROOT, t), "utf8");
/** Khối CONTEXT.md bắt đầu bằng `**<tên>**:` tới dòng trống. */
const khoi = (text, ten) => { const i = text.indexOf(`**${ten}**:`); return i < 0 ? "" : text.slice(i, text.indexOf("\n\n", i)); };

function main() {
  const loi = [];
  const ok = (dk, msg) => { if (dk) console.log(`ok ${msg}`); else { loi.push(msg); console.error(`ĐỎ ${msg}`); } };
  const coTenCu = (text) => DANG.some(([, re]) => re.test(text));

  console.log("— đích sinh");
  const app = doc("app/src/lib/vocab.generated.ts");
  ok(app.includes('inquiry: "inquiry"') && app.includes('inquiry: "Yêu cầu"') && !coTenCu(app), "app/src/lib/vocab.generated.ts: code 'inquiry' + nhãn 'Yêu cầu'");
  for (const t of ["pipeline/lib/vocab.generated.mjs", "agent/src/vocab.generated.ts"]) {
    const s = doc(t); ok(s.includes('"inquiry"') && !coTenCu(s), `${t}: code 'inquiry'`);
  }
  const ctx = doc("CONTEXT.md");
  ok(/^\| Ý định tin .*`inquiry` «Yêu cầu»/m.test(ctx), "CONTEXT.md: bảng VOCAB có '`inquiry` «Yêu cầu»'");

  console.log("— docs sống");
  const yc = khoi(ctx, "Yêu cầu");
  ok(["**Yêu cầu**:", "**Yêu cầu mua**:", "**Yêu cầu thuê**:"].every((k) => ctx.includes(k)) && ["bên mua", "`kind`", "SavedSearch"].every((k) => yc.includes(k)),
    "CONTEXT.md: ba khối Yêu cầu, khối Yêu cầu nói bên mua · `kind` · SavedSearch");
  ok(khoi(ctx, "Listing").includes("bên bán") && !ctx.includes("vòng U1 đang làm"), "CONTEXT.md: Listing là bên bán, hết khối tạm «vòng U1 đang làm»");
  for (const t of ["docs/adr/0013-kien-truc-du-lieu-tin-can-reso.md", "docs/architecture/reso-khung-phan-loai.md"]) {
    ok(doc(t).includes("`ListingIntent` (offer · inquiry · not_listing)"), `${t}: ListingIntent (offer · inquiry · not_listing)`);
  }
  ok(doc("docs/ROADMAP.md").includes("`inquiry` «Yêu cầu»"), "docs/ROADMAP.md: §3 #21 '`inquiry` «Yêu cầu»'");

  console.log("— catchup");
  const mig = doc("db/migrations/050_wanted_thanh_inquiry.sql");
  const cu = soCatchup(mig, doc("docs/ops/cloud-schema-catchup-2026-10-27-050.sql"));
  ok(cu.tong === 1 && cu.khop === 1 && cu.delete, `catchup: ${cu.khop}/${cu.tong} UPDATE khớp migration 050${cu.delete ? " · câu gỡ trùng có mặt" : ""}`);

  console.log("— tên cũ");
  const tep = execFileSync("git", ["-C", ROOT, "ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" }).split("\n").filter(Boolean);
  const q = quet(ROOT, tep);
  for (const d of q.do) console.error(`ĐỎ tên cũ: ${d}`);
  console.log(`tên cũ: ${q.do.length} chỗ ngoài bảng lịch sử`);
  console.log("— bảng lịch sử");
  for (const [m, n] of q.lichSu) console.log(`${m} · ${n} chỗ`);
  console.log(`dòng đổi tên: ${q.doiTen}`);
  if (q.do.length) loi.push("tên cũ ngoài bảng lịch sử");

  // ── đối chứng trên bản sao ──
  const tmp = mkdtempSync(path.join(tmpdir(), "con-ten-cu-"));
  let hong = 0;
  try {
    const cay = (tep, cay) => {
      const d = mkdtempSync(path.join(tmp, "ca-"));
      mkdirSync(path.join(d, path.dirname(tep)), { recursive: true });
      writeFileSync(path.join(d, tep), doc(tep) + "\n" + cay + "\n");
      return quet(d, [tep]);
    };
    const CA = [
      ["pipeline/mappings.yaml", '      - { code: "wanted" }'],
      ["pipeline/lib/vocab.generated.mjs", "const W = 'wanted';"],
      ["docs/adr/0013-kien-truc-du-lieu-tin-can-reso.md", "Giá trị `wanted` của trục."],
      ["docs/architecture/reso-khung-phan-loai.md", "  - code: wanted"],
      ["agent/src/agents/enrich-text.ts", "// listing_intent: offer|wanted|not_listing"],
      ["app/src/lib/vocab.generated.ts", "// Tin tìm mua, tìm thuê"],
    ];
    CA.forEach(([t, s], i) => {
      const r = cay(t, s);
      if (r.do.length !== 1 || !r.do[0].startsWith(`${t}:`)) { hong++; console.error(`răng hỏng: ca ${i + 1} (${DANG[i][0]}) → ${JSON.stringify(r.do)}`); }
    });
    for (const [t, s, ten] of [["app/src/lib/format.ts", "const wanted = 1", "biến"], ["docs/ROADMAP.md", "`wanted` → `inquiry`", "dòng đổi tên"]]) {
      const r = cay(t, s);
      if (r.do.length) { hong++; console.error(`răng hỏng: ca ${ten} đỏ ${JSON.stringify(r.do)}`); }
    }
    const boUpdate = doc("docs/ops/cloud-schema-catchup-2026-10-27-050.sql").replace(/^UPDATE ref_lookup.*$/m, "");
    const c2 = soCatchup(mig, boUpdate);
    if (c2.khop !== 0 || c2.thieu.length !== 1) { hong++; console.error("răng hỏng: catchup bỏ UPDATE không thiếu"); }
    else console.log(`đối chứng: 6/6 dạng cấy → 1 đỏ mỗi ca · biến và dòng đổi tên → 0 · catchup bỏ UPDATE → thiếu ${c2.thieu.length}/${c2.tong}`);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  if (hong) { console.error("răng hỏng"); return 1; }
  return loi.length ? 1 : 0;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main());
