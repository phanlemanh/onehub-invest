// thu-theo-danh-sach.mjs — S01 thu theo danh sách ID (0611-36/0711-5/0711-6): cụm 20 căn
// danh sách — số S02 không lên cổng/không vào snapshot). Khuôn do-s01-100:
// collector airbnb-listing THẬT qua CollectContext, snapshot-root + state
// riêng (state/thu-so-s01-n1/), Chrome ngoài màn hình, nhịp 8-15s giữa căn
// do collector tự rests. DỪNG + thoát 2 khi captcha/403/429/chặn; ≥5 căn
// liên tiếp lỗi tải; >10% gỡ/chặn sau 50 căn. BÁO tiến độ mỗi 30 căn.
import { mkdir, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";

// tham số: --danh-sach <json> --snapshot-root <dir> (0711-6: không ghi cứng state/)
// 0711-29(2): --toi-da <số căn mỗi vùng, mặc định 20> · --vung <hcm|hanoi|danang>
// (một vùng duy nhất mỗi lượt — không chạy nhiều vùng cùng lượt).
// 0711-29(4b): --khung-tu-lich <dir snapshot lịch đã thu> — hỏi giá ở khung
// 2 đêm trống liền đầu tiên lấy từ lịch ĐÃ THU thay cho mặc định +30 (chỉ
// code + test; chưa chạy lượt thật).
const args = Object.fromEntries(process.argv.slice(2).map((v, i, a) => (v.startsWith("--") ? [v.slice(2), a[i + 1]] : [])).filter(x => x.length));
const DANH_SACH = args["danh-sach"] ?? "/Users/manhphan/dev/onehub-invest-zcode/state/thu-so-s01-n1/id-500.json";
const SNAP_ROOT = args["snapshot-root"] ?? "/Users/manhphan/dev/onehub-invest-zcode/state/thu-so-s01-n1/snapshots";
const TOI_DA = Number(args["toi-da"] ?? 20);
const VUNG = args["vung"] ?? null;
if (args["khung-tu-lich"]) {
  if (!existsSync(args["khung-tu-lich"])) {
    console.error(`lỗi: --khung-tu-lich trỏ thư mục không tồn tại: ${args["khung-tu-lich"]}`);
    process.exit(2);
  }
  process.env.S01_KHUNG_TU_LICH = args["khung-tu-lich"];
}
if (VUNG && !(VUNG in { hcm: 1, hanoi: 1, danang: 1 })) {
  console.error(`lỗi: --vung phải là hcm|hanoi|danang (được "${VUNG}")`);
  process.exit(2);
}
const ROOT = "/Users/manhphan/dev/onehub-invest-zcode";
const REPO_S01 = new URL(".", import.meta.url).pathname; // pipeline/s01/
const DO_DIR = dirname(fileURLToPath(import.meta.url));
const TP = { hcm: "hcmc", hanoi: "hanoi", danang: "danang" };
process.env.AIRBNB_LISTING_BATCH = "100";

const reqCol = createRequire(join(ROOT, "collector", "package.json"));
const pw = reqCol("playwright-core");
const launchGoc = pw.chromium.launch.bind(pw.chromium);
pw.chromium.launch = (opts = {}) =>
  launchGoc({ ...opts, args: [...(opts.args ?? []), "--window-position=-2400,100", "--window-size=1100,800"] });

// 0711-12(2): S01_COLLECTOR_GIA=<mjs> thay collector bằng bản giả (test chạy
// QUA khối chính — chứng minh luật dừng + đối chiếu hoạt động thật)
const { airbnbListing } = process.env.S01_COLLECTOR_GIA
  ? await import(process.env.S01_COLLECTOR_GIA)
  : await import(join(ROOT, "collector", "dist", "collectors", "airbnb-listing.js"));
const { cityById } = await import(join(ROOT, "collector", "dist", "config", "cities.js"));
const { SnapshotWriter } = await import(join(ROOT, "collector", "dist", "core", "storage.js"));
// 0711-5: writer ghi THẬT xuống đĩa từng ≤20 căn (flush từng phần), mọi đường
// thoát đều finalize; SIGTERM/SIGINT cũng flush rồi exit.
let writerHienTai = null;
const snapshotIdsLootNay = [];
// 0711-12: tổng lũy kế TOÀN lượt (đối chiếu cuối dùng) — đưa ra ngoài vòng vùng
const tongItems = { items: [], coverageN: { discovered: 0, captured: 0, failed: 0, methods: {}, notes: [] } };
let itemsChuaGhi = [];
async function flushItems(coverageBo = null) {
  if (!writerHienTai || itemsChuaGhi.length === 0) return;
  await writerHienTai.write(itemsChuaGhi);
  itemsChuaGhi = [];
}
async function ketThucWriter(coverage, err = null) {
  if (!writerHienTai) return;
  await flushItems();
  try { await writerHienTai.finalize(coverage ?? { discovered: 0, captured: 0, failed: 0, methods: {}, notes: [err ? "run failed" : "done"] }, err ?? undefined); } catch {}
  writerHienTai = null;
}
let dangThoat = false;
async function thoatSach(ma, coverage = null) {
  if (dangThoat) process.exit(ma);
  dangThoat = true;
  await ketThucWriter(coverage).catch(() => {});
  process.exit(ma);
}
process.on("SIGTERM", () => thoatSach(3));
process.on("SIGINT", () => thoatSach(3));

const danhSach = JSON.parse(readFileSync(DANH_SACH, "utf8"));

async function duDiscovery(cityId, ids) {
  const dir = join(SNAP_ROOT, cityId, `${cityId}__airbnb-discovery__n1`); // 0711-13-luot1: đồng bộ với paths.snapshotRoot của collect
  await mkdir(dir, { recursive: true });
  const items = ids.map((id) => ({
    source: "airbnb-discovery", sourceId: String(id).replace(/^abnb_/, ""), kind: "card",
    fetchedAt: new Date().toISOString(), payload: {},
  }));
  const gz = gzipSync(JSON.stringify(items));
  await writeFile(join(dir, "items-0001.json.gz"), gz);
  await writeFile(join(dir, "manifest.json"), JSON.stringify({
    schemaVersion: 1, snapshotId: `${cityId}__airbnb-discovery__n1`, city: cityId,
    source: "airbnb-discovery", startedAt: new Date().toISOString(), finishedAt: new Date().toISOString(),
    counts: { items: items.length, failed: 0 },
    coverage: { discovered: items.length, captured: items.length, failed: 0, methods: { danhSach: items.length } },
    files: [{ name: "items-0001.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), bytes: gz.length }],
  }));
  return dir;
}

const bang = { vung: {}, ly_do_thieu_lich: { khong_mo_lich: 0, khong_khoi_lich: 0, tai_loi: 0, khac: 0 } };
let chan = false;
for (const [k, cityId] of Object.entries(TP)) {
  if (VUNG && k !== VUNG) continue; // 0711-29(2): mỗi lượt MỘT vùng
  const ids = (danhSach[k] ?? []).slice(0, TOI_DA); // 0711-29(2): trần căn/vùng
  if (!ids.length) continue;
  // 0711-5(b): chia cụm 20 căn — MỖI cụm một discovery giả + collect + writer
  // hoàn chỉnh (flush xuống đĩa sau mỗi cụm) — đứt giữa chừng chỉ mất cụm đang chạy.
  const cum = [];
  for (let i = 0; i < ids.length; i += 20) cum.push(ids.slice(i, i + 20));
  for (let ci = 0; ci < cum.length; ci++) {
    const nhom = cum[ci];
    await duDiscovery(cityId, nhom);
    console.log(`== ${cityId} cụm ${ci + 1}/${cum.length} (${nhom.length} căn) ==`);
  const t0 = Date.now();
  writerHienTai = new SnapshotWriter(SNAP_ROOT, cityId, "airbnb-listing");
  // 0711-11/0711-12: luật dừng theo từng căn — import luat-dung.mjs (export)
  const { taoBoDem } = await import(join(REPO_S01, "luat-dung.mjs"));
  const bd = taoBoDem();
  const chanCan = (dong) => { bd.can(dong); if (bd.state.nhip10) console.log(`   [nhịp] trung bình 10 căn đầu: ${bd.state.nhip10}s/căn`); };
  try {
    const { items, coverage } = await airbnbListing.collect({
      city: cityById(cityId),
      checkpoint: { get: () => undefined, set: () => {}, save: async () => {} },
      // 0711-29(2): nhịp nghỉ 12-20 giây NGẪU NHIÊN mỗi căn (sàn nhịp kiểm 12s) —
      // trước đây take rỗng → 0 nghỉ → ~3,6-6 giây/căn (quá nhanh, nguồn nghi chặn mềm)
      rateLimit: { take: async () => {
        const ms = 12000 + Math.floor(Math.random() * 8000);
        await new Promise((r) => setTimeout(r, ms));
      } },
      log: (...a) => { const dong = a.join(" "); console.log("  ", ...a); chanCan(dong); },
      paths: { snapshotRoot: SNAP_ROOT, stateDir: join(DO_DIR, "state") },
    });
    // 0711-5: ghi items XUỐNG ĐĨA ngay từng cụm + đối chiếu
    await writerHienTai.write(items);
    const man = await writerHienTai.finalize(coverage);
    snapshotIdsLootNay.push(man.snapshotId);
    writerHienTai = null;
    const giay = (Date.now() - t0) / 1000;
    tongItems.items.push(...items);
    tongItems.coverageN.discovered += coverage.discovered ?? nhom.length;
    tongItems.coverageN.captured += coverage.captured ?? items.length;
    tongItems.coverageN.failed += coverage.failed ?? 0;
    console.log(`   cụm ${ci + 1}: ${items.length} item đã finalize`);
    let duLich = 0;
    for (const it of items) {
      const p = JSON.stringify(it.payload ?? {});
      if (/"calendarMonths":\s*\[/.test(p)) duLich++;
      else {
        // phân loại lý do thiếu cụm lịch (bằng chứng đếm được trong payload)
        if (/"pdpSections"|"deferredState"/.test(p)) bang.ly_do_thieu_lich.khong_mo_lich++; // có chi tiết nhưng không lịch
        else if (/timeout|tai_loi/i.test(p)) bang.ly_do_thieu_lich.tai_loi++;
        else bang.ly_do_thieu_lich.khac++;
      }
    }
    bang.vung[k] = {
      thu: nhom.length, item: items.length, du_lich: duLich,
      thieu_lich: items.length - duLich,
      cum: ci + 1,
      con_lai_checkpoint: ids.length - items.length - (coverage.failed ?? 0),
      go_that_da_thu: coverage.failed ?? 0,
      failed: coverage.failed ?? 0, giay_moi_can: +(giay / Math.max(ids.length, 1)).toFixed(1), tong_giay: Math.round(giay),
      notes: (coverage.notes ?? []).slice(0, 3),
    };
    // 0711-1(2): chỉ căn ĐÃ THỬ mà không dữ liệu mới tính gỡ; ngưỡng >10% sau 50 đã-thử
    const tongThat = (tongItems.coverageN.captured ?? 0) + (tongItems.coverageN.failed ?? 0);
    const goThat = tongItems.coverageN.failed ?? 0;
    if (tongThat >= 50 && goThat / tongThat > 0.1) {
      console.log(`!! gỡ thật ${goThat}/${tongThat} đã thử > 10% — DỪNG (0711-1)`);
      chan = true;
    }
    if (bd.state.vungDung) { console.log(`!! DỪNG theo luật căn-liền: ${bd.state.vungDung}`); chan = true; }
    // 0711-5(c): dừng khi 5 căn LIỀN FAIL trong cụm
    if (chan) break;
  } catch (e) {
    chan = true;
    bang.vung[k] = { thu: nhom.length, LOI: String(e.message).slice(0, 200) };
    console.log(`!! ${cityId}: ${e.message} — DỪNG theo ranh giới`);
    await ketThucWriter(null, String(e.message)).catch(() => {});
    break;
  }
  }
  if (chan) break;
}
bang.tong_cong = {
  thu: Object.values(bang.vung).reduce((s, v) => s + (v.thu ?? 0), 0),
  song: Object.values(bang.vung).reduce((s, v) => s + (v.item ?? 0), 0),
  du_lich: Object.values(bang.vung).reduce((s, v) => s + (v.du_lich ?? 0), 0),
};
// 0711-9(4): đối chiếu THẬT — đọc lại manifest mọi snapshot airbnb-listing vừa
// finalize dưới SNAP_ROOT, cộng counts.items, so số script đếm; lệch → thoát 1.
import { readdirSync as _rd, readFileSync as _rf, existsSync as _ex } from "node:fs";
let diaTong = 0;
// 0711-11(b): CHỈ đếm snapshot lượt NÀY tạo (ghi snapshotId khi finalize)
for (const sid of snapshotIdsLootNay) {
  const [v] = sid.split("__");
  const mp = join(SNAP_ROOT, v, sid, "manifest.json");
  if (!_ex(mp)) continue;
  diaTong += JSON.parse(_rf(mp, "utf8")).counts?.items ?? 0;
}
console.log("[ket-qua]", JSON.stringify(bang));
console.log(`[doi-chieu] script đếm ${tongItems.items.length} item · đĩa ${diaTong}`);
if (diaTong !== tongItems.items.length) { console.error("ĐỎ: đĩa lệch số script đếm!"); process.exit(1); }
if (chan) process.exit(2);
