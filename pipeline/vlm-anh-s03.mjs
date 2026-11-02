// vlm-anh-s03.mjs — KC3 `vlm-anh-tin-s03`: đếm nhãn ảnh và rút phiếu gắn tay trên DB local. Không gọi model; lệnh chạy lô ở
// agent/scripts/vlm-anh-run.ts. Không in chữ bài; chữ bài đại diện chỉ nằm trong phiếu ở research-local/.
//
// Chạy:
//   node pipeline/vlm-anh-s03.mjs --dem [--kiem-lo-that]
//   node pipeline/vlm-anh-s03.mjs --rut-mau --n 60 --seed s03-02-11 --out research-local/vlm-anh/phieu.jsonl
//   Phiếu đã có thì nối đuôi ảnh mới, không đè đáp án đã gắn. Gốc ảnh: $SNAPSHOTS_DIR.
// Mã thoát: 0 xong · 1 lô thật chưa đạt hoặc hỏng · 2 cờ sai.
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { demNhan, dichPhieu, docPhieu, ghiPhieu, kiemLoThat, napTapDoc, rutMau } from "./lib/vlm-anh.mjs";

const DB_URL = process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest";

/** Dòng silver_labels nguồn ảnh — đầu vào của demNhan. */
export async function docDongAnh(client) {
  const { rows } = await client.query(
    `SELECT post_id, text_hash, model, prompt_version, probabilities, error_kind, json_ok, latency_ms
     FROM silver_labels WHERE source_code = 'S03' AND probabilities->>'nguon' = 'anh'`);
  return rows;
}

/** Bảng đếm dạng dòng chữ — chỉ số, không chữ bài. */
export function inDem(d) {
  const out = [`tập đọc ${d.tapDoc} · theo lý do ${JSON.stringify(d.theoLyDo)} · ${d.luotAnh} lượt ảnh · ${d.anhKhacNhau} ảnh khác nhau`];
  for (const m of d.models) {
    out.push(`${m.model} ${m.prompt_version}: tốt ${m.tot} · rỗng ${m.rong} · lỗi ${m.loi} · chưa đọc ${m.chuaDoc} · lấp đúng lý do ${m.lapDung} ${JSON.stringify(m.lapTheoLyDo)}`);
    out.push(`  nhóm bài chỉ có ảnh dùng từ 10 bài: ${JSON.stringify(m.dungChung10)} · tập ảnh đã đổi ${m.tapAnhDoi} · xung đột ${m.xungDot}`);
    out.push(`  ảnh đã đọc ${m.anhDaDoc} · chưa đọc ${m.shaChuaDoc} · theo loại ${JSON.stringify(m.anhTheoLoai)} · lộ nguồn ${m.anhLoNguon} ảnh, ${m.baiLoNguon} bài`);
    out.push(`  có trường ${JSON.stringify(m.coTruong)} · JSON hỏng ${m.jsonHong} · lo-url ${m.loUrl} · lỗi ${JSON.stringify(m.loiTheoLop)} · ${m.soAnhGoi} lần gọi, ${m.tongMs} ms`);
  }
  return out.join("\n");
}

async function main() {
  const argv = process.argv.slice(2);
  const lay = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : undefined; };
  const dem = argv.includes("--dem");
  const rut = argv.includes("--rut-mau");
  if (dem === rut) { console.error("vlm-anh-s03: chọn đúng một trong --dem | --rut-mau"); return 2; }
  const n = Number(lay("n") ?? 60);
  const seed = lay("seed");
  const out = lay("out");
  if (rut) {
    if (!Number.isInteger(n) || n <= 0 || !seed || !out) { console.error("vlm-anh-s03: --rut-mau cần --n, --seed, --out"); return 2; }
    try { dichPhieu(out); } catch (e) { console.error(e.message); return 2; }
  }
  const c = new pg.Client({ connectionString: DB_URL, application_name: "vlm-anh-s03" });
  await c.connect();
  try {
    const { tap } = await napTapDoc(c);
    if (rut) {
      const cu = new Set(docPhieu(dichPhieu(out)).map((h) => h.sha256));
      const hang = rutMau(tap, { n, seed, boQua: cu });
      const dich = ghiPhieu(out, hang);
      const tang = {};
      for (const h of hang) tang[h.tang] = (tang[h.tang] ?? 0) + 1;
      console.log(`rút thêm ${hang.length} ảnh, phiếu có ${cu.size + hang.length} ảnh · theo tầng ${JSON.stringify(tang)} · ${dich}`);
      return 0;
    }
    const d = demNhan(tap, await docDongAnh(c));
    console.log(inDem(d));
    if (!argv.includes("--kiem-lo-that")) return 0;
    const sai = kiemLoThat(d);
    if (sai.length) { console.error(`lô thật chưa đạt: ${sai.join("; ")}`); return 1; }
    console.log("lô thật đạt");
    return 0;
  } finally {
    await c.end();
  }
}

const isMain = process.argv[1] && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().then((m) => { process.exitCode = m; }).catch((e) => { console.error(e instanceof Error ? e.name : e); process.exit(1); });
