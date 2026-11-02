// vlm-anh.test.mjs — hồ sơ _acceptance/vlm-anh-tin-s03: chọn bài (VLM-AC-1), lọc ảnh (VLM-AC-2), phiếu và đếm phần không cần DB.
// Chữ bài viết tay theo dạng tin thật, không chép bài thật. Tệp ảnh ghi vào thư mục tạm, không có ảnh thật trong kho.
import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { chonTapDoc, danhSachAnh, demNhan, dichPhieu, kiemLoThat, luotTuDong, lyDoThieu, MAX_BYTES, rutMau, thongKeSha } from "../lib/vlm-anh.mjs";
import { localFile } from "../media-rows.mjs";

const SNAP = "hanoi__zalo-agent__2099-04-04T000000";
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 16, 0x4a, 0x46, 0x49, 0x46, 0, 1]);
const sha = (b) => createHash("sha256").update(b).digest("hex");

/** Thư mục ảnh tạm + ghi tệp đúng đường mà localFile đọc được. */
function gocTam(t) {
  const goc = mkdtempSync(join(tmpdir(), "vlm-anh-"));
  t.after(() => rmSync(goc, { recursive: true, force: true }));
  const ghi = (ten, noiDung) => {
    const file = `media/${ten}`;
    const local = localFile({ file }, SNAP);
    assert.ok(local, `VLM-AC-2 fixture: localFile không đọc được ${file}`);
    const tep = join(goc, "hanoi", local);
    mkdirSync(dirname(tep), { recursive: true });
    writeFileSync(tep, noiDung);
    return { file, sha256: sha(noiDung) };
  };
  return { goc, ghi };
}

const anhSo = (i) => Buffer.concat([JPEG, Buffer.from(`anh-${i}`)]);
const NGUOI = { sender_id: "u1", conversation_id: "c1" };
const luc = (giay) => new Date(Date.UTC(2099, 3, 4, 8, 0, giay)).toISOString();

// Mọi bài cùng người gửi thì ganBaiAnh gán theo thời gian; mỗi bài ở phút riêng, cách xa cửa sổ 120 giây.
const MA_TRAN_8 = [
  { ten: "thieu-gia", text: "Bán căn hộ 2PN 70m2 đẹp", chon: true, ly_do: ["thieu_gia"], rieng: true },
  { ten: "thieu-dau-hieu", text: "Liên hệ em giá 3,2 tỷ", chon: true, ly_do: ["thieu_dau_hieu", "thieu_loai_hinh"], ghep: true },
  { ten: "thieu-loai-hinh", text: "Giá 3,2 tỷ 70m2 sổ đỏ", chon: true, ly_do: ["thieu_loai_hinh"], rieng: true },
  { ten: "du-ca-ba", text: "Bán căn hộ 2PN 70m2 giá 3,2 tỷ", chon: false, loai: "du-ca-ba", rieng: true },
  { ten: "khong-anh", text: "Bán căn hộ 2PN 70m2 đẹp lắm", chon: false, loai: "khong-anh" },
  { ten: "yeu-cau", text: "Khách em cần mua căn hộ 2PN", chon: false, loai: "yeu-cau", rieng: true },
  { ten: "chi-anh", text: "https://example.test/a.jpg", chon: false, loai: "chi-anh-khong-gan", rieng: true, nguoiKhac: true },
  { ten: "bai-thu", text: "Bán căn hộ 2PN 70m2", chon: false, loai: "bai-thu", rieng: true, thu: true },
];

function dungMaTran(t, maTran) {
  const { goc, ghi } = gocTam(t);
  const posts = [];
  const media = new Map();
  maTran.forEach((m, i) => {
    const phut = i * 10;
    const post = { post_id: m.ten, text: m.text, snapshot_id: m.thu ? "hanoi__mock__2099" : SNAP, posted_at: luc(phut * 60), ...NGUOI, ...(m.nguoiKhac ? { sender_id: "u-khac" } : {}) };
    posts.push(post);
    if (m.rieng) media.set(m.ten, { snapshot_id: SNAP, media_files: [ghi(`${m.ten}.jpg`, anhSo(i))] });
    if (m.ghep) {
      const pid = `${m.ten}-anh`;
      posts.push({ post_id: pid, text: "https://example.test/g.jpg", snapshot_id: SNAP, posted_at: luc(phut * 60 + 30), ...NGUOI });
      media.set(pid, { snapshot_id: SNAP, media_files: [ghi(`${pid}.jpg`, anhSo(100 + i))] });
    }
  });
  return { ...chonTapDoc(posts, media, { goc }), goc };
}

test("VLM-AC-1 ma trận 8 bài: chọn đúng ba bài, đúng lý do, đúng ảnh; năm bài còn lại bị loại kèm tên", (t) => {
  assert.equal(MA_TRAN_8.length, 8);
  const { tap, loai } = dungMaTran(t, MA_TRAN_8);
  assert.deepEqual(tap.map((b) => b.post_id).sort(), ["thieu-dau-hieu", "thieu-gia", "thieu-loai-hinh"], "VLM-AC-1 danh sách chọn sai");
  for (const m of MA_TRAN_8.filter((x) => x.chon)) {
    const b = tap.find((x) => x.post_id === m.ten);
    assert.deepEqual(b.ly_do, m.ly_do, `VLM-AC-1 lý do sai ở ${m.ten}`);
    assert.equal(b.anh.length, 1, `VLM-AC-1 số ảnh sai ở ${m.ten}`);
    assert.equal(b.anh[0].nguon, m.ghep ? "ghep" : "rieng", `VLM-AC-1 nguồn ảnh sai ở ${m.ten}`);
  }
  for (const m of MA_TRAN_8.filter((x) => !x.chon)) {
    const l = loai.find((x) => x.post_id === m.ten);
    assert.equal(l?.ly_do, m.loai, `VLM-AC-1 bài ${m.ten} không bị loại đúng lý do`);
  }
});

test("đối chứng VLM-AC-1: đổi bài đủ cả ba thành thiếu giá thì danh sách chọn đổi đúng một phần tử", (t) => {
  const doi = MA_TRAN_8.map((m) => (m.ten === "du-ca-ba" ? { ...m, text: "Bán căn hộ 2PN 70m2" } : m));
  const { tap } = dungMaTran(t, doi);
  assert.deepEqual(tap.map((b) => b.post_id).sort(), ["du-ca-ba", "thieu-dau-hieu", "thieu-gia", "thieu-loai-hinh"]);
});

test("VLM-AC-1 lý do thiếu đọc từ chữ bài", () => {
  assert.deepEqual(lyDoThieu("Bán căn hộ 2PN 70m2 giá 3,2 tỷ"), []);
  assert.deepEqual(lyDoThieu("Bán căn hộ 2PN 70m2"), ["thieu_gia"]);
});

test("VLM-AC-2 ma trận 9 loại entry: chỉ tệp thật được giữ, đếm bỏ theo lý do, gộp sha trước khi tính trần", (t) => {
  const { goc, ghi } = gocTam(t);
  const that = ghi("that.jpg", anhSo(1));
  const quaCo = ghi("qua-co.jpg", Buffer.concat([JPEG, Buffer.alloc(MAX_BYTES)]));
  const saiDang = ghi("sai-dang.jpg", Buffer.from("<html>khong phai anh</html>"));
  const thieuSha = ghi("thieu-sha.jpg", anhSo(2));
  const cungSha = ghi("cung-sha.jpg", anhSo(3));
  const nhieu = [4, 5, 6, 7, 8].map((i) => ghi(`nhieu-${i}.jpg`, anhSo(i)));
  const dong = (media_files) => ({ snapshot_id: SNAP, media_files });
  const ds = (media_files) => danhSachAnh(luotTuDong(dong(media_files), "rieng"), { goc });

  const a = ds([
    that,
    { ...that, file: "media/loi.jpg", error: "download-failed" },
    { file: "media/khong-co.jpg", sha256: "a".repeat(64) },
    { file: "media/../../bi-mat.jpg", sha256: "b".repeat(64) },
    quaCo, saiDang,
    { file: thieuSha.file },
  ]);
  assert.deepEqual(a.anh.map((x) => x.sha256), [that.sha256, sha(anhSo(2))], "VLM-AC-2 ảnh giữ sai, entry thiếu sha phải mang băm đúng byte");
  assert.deepEqual(a.bo, { "entry-loi": 1, "thieu-tep": 1, "duong-xau": 1, "qua-co": 1, "sai-dinh-dang": 1 }, "VLM-AC-2 đếm bỏ sai");

  const b = ds([cungSha, cungSha, cungSha, cungSha, cungSha]);
  assert.equal(b.anh.length, 1, "VLM-AC-2 năm entry cùng sha phải là một ảnh");
  assert.equal(b.bo["trung-sha"], 4);

  // Gộp TRƯỚC khi tính trần: 5 entry cùng sha + 3 ảnh khác là 4 ảnh, không vượt trần.
  const c = ds([cungSha, cungSha, cungSha, cungSha, cungSha, ...nhieu.slice(0, 3)]);
  assert.equal(c.anh.length, 4, "VLM-AC-2 gộp sha sau trần làm mất ảnh");
  assert.equal(c.bo["qua-tran"], undefined);

  const d = ds(nhieu);
  assert.equal(d.anh.length, 4, "VLM-AC-2 trần 4 ảnh khác nhau");
  assert.equal(d.bo["qua-tran"], 1);
});

test("đối chứng VLM-AC-2: cùng tệp, byte đầu đúng thì giữ, đổi byte đầu thì bỏ với lý do sai-dinh-dang", (t) => {
  const { goc, ghi } = gocTam(t);
  const e = ghi("doi.jpg", anhSo(9));
  const tep = join(goc, "hanoi", SNAP, e.file);
  const ds = () => danhSachAnh(luotTuDong({ snapshot_id: SNAP, media_files: [e] }, "rieng"), { goc });
  assert.equal(ds().anh.length, 1);
  writeFileSync(tep, Buffer.from("GIF89a-khong-nhan"));
  const sau = ds();
  assert.equal(sau.anh.length, 0);
  assert.equal(sau.bo["sai-dinh-dang"], 1);
});

test("VLM-AC-2 ảnh riêng đứng trước ảnh ghép khi vượt trần; cùng sha ở hai phía tính là riêng", (t) => {
  const { goc, ghi } = gocTam(t);
  const moi = [1, 2, 3, 4, 5, 6].map((i) => ghi(`p${i}.jpg`, anhSo(i)));
  const luot = [
    ...luotTuDong({ snapshot_id: SNAP, media_files: moi.slice(4) }, "ghep"),
    ...luotTuDong({ snapshot_id: SNAP, media_files: moi.slice(0, 4) }, "rieng"),
  ];
  const { anh } = danhSachAnh(luot, { goc });
  assert.deepEqual(anh.map((a) => a.nguon), ["rieng", "rieng", "rieng", "rieng"]);
  const hai = danhSachAnh([...luotTuDong({ snapshot_id: SNAP, media_files: [moi[0]] }, "ghep"), ...luotTuDong({ snapshot_id: SNAP, media_files: [moi[0]] }, "rieng")], { goc });
  assert.equal(hai.anh[0].nguon, "rieng");
});

// ---------- phiếu và đếm: fixture không cần tệp ----------
const anhGia = (s, nguon = "rieng") => ({ sha256: s, tep: `/tmp/${s}.jpg`, local: `x/${s}.jpg`, mime: "image/jpeg", nguon });
const baiGia = (post_id, ly_do, shas, text = `chu canh ${post_id}`) => ({ post_id, text, text_hash: `h-${post_id}`, ly_do, anh: shas.map((s) => (Array.isArray(s) ? anhGia(s[0], s[1]) : anhGia(s))) });
const tapPhieu = () => {
  const tap = [];
  for (let i = 0; i < 10; i++) tap.push(baiGia(`d${i}`, ["thieu_gia"], ["sha-chung"]));
  for (let i = 0; i < 6; i++) tap.push(baiGia(`g${i}`, ["thieu_gia"], [[`sha-ghep-${i}`, "ghep"]]));
  for (let i = 0; i < 6; i++) tap.push(baiGia(`r${i}`, ["thieu_gia"], [`sha-rieng-${i}`]));
  return tap;
};

test("VLM-AC-8 rút mẫu: mỗi sha một lần, đủ ba tầng, tái lập theo seed, khác seed khác danh sách, không có khoá dự đoán", () => {
  const a = rutMau(tapPhieu(), { n: 7, seed: "s1" });
  const b = rutMau(tapPhieu(), { n: 7, seed: "s1" });
  const c = rutMau(tapPhieu(), { n: 13, seed: "khac" });
  assert.deepEqual(a, b, "VLM-AC-8 cùng seed phải cùng phiếu");
  assert.notDeepEqual(a.map((h) => h.sha256), rutMau(tapPhieu(), { n: 7, seed: "khac" }).map((h) => h.sha256), "VLM-AC-8 khác seed phải khác phiếu");
  assert.equal(new Set(c.map((h) => h.sha256)).size, c.length, "VLM-AC-8 sha lặp trong phiếu");
  assert.deepEqual([...new Set(a.map((h) => h.tang))].sort(), ["co-luot-ghep", "con-lai", "dung-tu-10-bai"], "VLM-AC-8 thiếu tầng");
  for (const h of a) {
    for (const k of ["tep", "so_luot_rieng", "so_luot_ghep", "so_bai_dung_chung", "bai_dai_dien"]) assert.ok(h[k] !== undefined, `VLM-AC-8 thiếu khoá ${k}`);
    assert.ok(!JSON.stringify(h).includes("du_doan"), "VLM-AC-8 phiếu có dự đoán");
  }
  const chung = a.find((h) => h.sha256 === "sha-chung");
  assert.equal(chung.so_bai_dung_chung, 10);
});

test("VLM-AC-8 bài đại diện ưu tiên bài có ảnh qua ghép; tập có boQua thì không rút lại", () => {
  const tap = [baiGia("a1", ["thieu_gia"], ["x"]), baiGia("a2", ["thieu_gia"], ["x"]), baiGia("a3", ["thieu_gia"], [["x", "ghep"]]), baiGia("a4", ["thieu_gia"], ["y"])];
  for (const seed of ["1", "2", "3", "4"]) assert.equal(rutMau(tap, { n: 2, seed }).find((h) => h.sha256 === "x").bai_dai_dien.post_id, "a3");
  assert.deepEqual(rutMau(tap, { n: 2, seed: "1", boQua: new Set(["x"]) }).map((h) => h.sha256), ["y"]);
});

test("VLM-AC-8 đích phiếu ngoài research-local bị từ chối", () => {
  assert.throws(() => dichPhieu("/tmp/phieu.jsonl"), /research-local/);
  assert.throws(() => dichPhieu("research-local/../phieu.jsonl"), /research-local/);
  assert.throws(() => dichPhieu("research-local-gia/phieu.jsonl"), /research-local/);
  assert.ok(dichPhieu("research-local/vlm/phieu.jsonl").endsWith("research-local/vlm/phieu.jsonl"));
});

const dongNhan = (post_id, model, p, error_kind = null) => ({ post_id, text_hash: `h-${post_id}`, model, prompt_version: "v1", probabilities: { nguon: "anh", ...p }, error_kind, json_ok: error_kind !== "json-hong", latency_ms: 100 });

test("VLM-AC-8 đếm: bốn nhóm cộng bằng tập đọc; thiếu giá chỉ có loại hình thì tốt mà không lấp đúng; ảnh lộ nguồn dùng 10 bài là 1 ảnh, 10 bài", () => {
  const M = "mtplx:qwen";
  const tap = [
    baiGia("tot", ["thieu_gia"], ["a1"]),
    baiGia("loai", ["thieu_gia"], ["a2"]),
    baiGia("rong", ["thieu_gia"], ["a3"]),
    baiGia("loi", ["thieu_gia"], ["a4"]),
    baiGia("chua", ["thieu_loai_hinh"], ["a5"]),
    baiGia("doi", ["thieu_gia"], ["a6", "a7"]),
  ];
  for (let i = 0; i < 10; i++) tap.push(baiGia(`lo${i}`, ["thieu_gia"], ["lo"]));
  const anh = (s, x = {}) => ({ sha256: s, loai_anh: "bang-gia", lo_nguon: false, ...x });
  const rows = [
    dongNhan("tot", M, { price_vnd: 3e9, anh: [anh("a1")], so_anh_goi: 1 }),
    dongNhan("loai", M, { property_type: "apartment", anh: [anh("a2", { loai_anh: "so-do" })], so_anh_goi: 1 }),
    dongNhan("rong", M, { anh: [anh("a3", { loai_anh: "noi-that" })], so_anh_goi: 1 }),
    dongNhan("loi", M, { anh: [{ sha256: "a4", error_kind: "GatewayError" }], so_anh_goi: 1 }, "GatewayError"),
    dongNhan("doi", M, { price_vnd: 1e9, anh: [anh("a6")], so_anh_goi: 1 }),
    ...Array.from({ length: 10 }, (_, i) => dongNhan(`lo${i}`, M, { anh: [anh("lo", { lo_nguon: true, loai_anh: "qr-quang-cao" })], so_anh_lo_nguon: 1, so_anh_goi: i === 0 ? 1 : 0 })),
  ];
  const d = demNhan(tap, rows);
  assert.equal(d.tapDoc, 16);
  assert.deepEqual(d.theoLyDo, { thieu_gia: 15, thieu_loai_hinh: 1 });
  assert.equal(d.luotAnh, 17);
  assert.equal(d.anhKhacNhau, 8);
  const m = d.models[0];
  assert.deepEqual([m.tot, m.rong, m.loi, m.chuaDoc], [3, 11, 1, 1], "VLM-AC-8 bốn nhóm sai");
  assert.equal(m.tot + m.rong + m.loi + m.chuaDoc, d.tapDoc);
  assert.equal(m.lapDung, 2, "VLM-AC-8 bài thiếu giá chỉ có loại hình không được tính lấp đúng");
  assert.deepEqual(m.lapTheoLyDo, { thieu_gia: 2 });
  assert.equal(m.anhLoNguon, 1, "VLM-AC-8 ảnh lộ nguồn đếm theo sha");
  assert.equal(m.baiLoNguon, 10);
  assert.equal(m.tapAnhDoi, 1, "VLM-AC-8 bài thêm ảnh sau lần đọc phải tính tập ảnh đã đổi");
  assert.equal(m.dungChung10.bai, 10);
  assert.equal(m.dungChung10.rong, 10);
  assert.deepEqual(m.anhTheoLoai, { "bang-gia": 2, "so-do": 1, "noi-that": 1, "qr-quang-cao": 1 });
  assert.equal(m.shaChuaDoc, 3, "VLM-AC-8 chưa đọc đếm theo sha (a4 lỗi, a5, a7)");
});

test("VLM-AC-8 hai model đếm riêng; toàn lô lỗi 401 không làm tăng nhãn tốt", () => {
  const tap = [baiGia("a", ["thieu_gia"], ["s"])];
  const d = demNhan(tap, [dongNhan("a", "gateway:x", { price_vnd: 1, anh: [{ sha256: "s" }] }), dongNhan("a", "mtplx:y", { anh: [{ sha256: "s", error_kind: "GatewayAuthenticationError" }] }, "GatewayAuthenticationError")]);
  const theo = Object.fromEntries(d.models.map((m) => [m.model, m]));
  assert.equal(theo["gateway:x"].tot, 1);
  assert.equal(theo["mtplx:y"].tot, 0);
  assert.equal(theo["mtplx:y"].loi, 1);
});

test("VLM-AC-9 JSON hỏng chỉ đếm trả lời hỏng thật; lỗi mạng và bài có ảnh hỏng kèm ảnh tốt tách đúng", () => {
  const tap = [baiGia("mang", ["thieu_gia"], ["s1"]), baiGia("hong", ["thieu_gia"], ["s2"]), baiGia("lan", ["thieu_gia"], ["s3", "s4"])];
  const d = demNhan(tap, [
    { ...dongNhan("mang", "mtplx:y", { anh: [{ sha256: "s1", error_kind: "AI_APICallError" }] }, "AI_APICallError"), json_ok: false },
    dongNhan("hong", "mtplx:y", { anh: [{ sha256: "s2", error_kind: "json-hong" }] }, "json-hong"),
    { ...dongNhan("lan", "mtplx:y", { anh: [{ sha256: "s3", error_kind: "AI_APICallError" }, { sha256: "s4", error_kind: "json-hong" }] }, "AI_APICallError"), json_ok: false },
  ]);
  assert.equal(d.models[0].jsonHong, 2, "VLM-AC-9 lỗi mạng bị tính là JSON hỏng");
  assert.deepEqual(d.models[0].loiTheoLop, { AI_APICallError: 2, "json-hong": 1 });
});

test("VLM-AC-9 kiểm lô thật: thiếu dòng Qwen tốt hoặc tập rỗng thì có lý do; đủ thì rỗng", () => {
  const tap = [baiGia("a", ["thieu_gia"], ["s"])];
  assert.deepEqual(kiemLoThat(demNhan(tap, [dongNhan("a", "mtplx:y", { price_vnd: 1, anh: [{ sha256: "s" }] })])), []);
  assert.ok(kiemLoThat(demNhan(tap, [dongNhan("a", "gateway:x", { price_vnd: 1, anh: [{ sha256: "s" }] })])).length > 0, "VLM-AC-9 chỉ có model cloud mà vẫn đạt");
  assert.ok(kiemLoThat(demNhan(tap, [])).length > 0, "VLM-AC-9 chưa có lô mà vẫn đạt");
  assert.ok(kiemLoThat(demNhan([], [])).length > 0);
});

test("VLM-AC-8 lệnh pipeline và thư viện không có mã gọi model", () => {
  for (const tep of ["../vlm-anh-s03.mjs", "../lib/vlm-anh.mjs"]) {
    const ma = readFileSync(new URL(tep, import.meta.url), "utf8");
    assert.ok(!/from\s+["'](ai|@ai-sdk\/[^"']+)["']/.test(ma), `VLM-AC-8 ${tep} import gói model`);
    assert.ok(!/\bfetch\s*\(/.test(ma), `VLM-AC-8 ${tep} gọi fetch`);
  }
});

test("VLM-AC-10 thống kê sha tính trên cả tập đọc", () => {
  const s = thongKeSha([baiGia("a", [], ["x"]), baiGia("b", [], [["x", "ghep"]]), baiGia("c", [], ["x", "y"])]);
  assert.deepEqual([s.get("x").so_bai, s.get("x").so_luot_rieng, s.get("x").so_luot_ghep, s.get("y").so_bai], [3, 2, 1, 1]);
});
