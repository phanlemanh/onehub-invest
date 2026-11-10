// ma-album-s03 E6 (AC-6): phép đo ảnh rơi — số báo, biên ngưỡng, khoá gom, các ca KHÔNG được tính thiếu, không ghi dữ liệu.
import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { demAnhRoi, demItemSnapshot, demPost202, khoaGom, NGUONG_CANH_BAO, NGUONG_DUNG } from "./do-anh-roi-s03.mjs";

const DEN = "2026-11-07T00:00:00.000Z";
const TU = "2026-11-06T00:00:00.000Z";
const CUA_SO = { tu: TU, den: DEN };
const luc = (phutTruocDen) => new Date(Date.parse(DEN) - phutTruocDen * 60000).toISOString();

/** Một album: tong ảnh, co ảnh đã về, lúc (phút trước DEN). */
function album(id, { tong = 3, co = tong, phut = 120, hoi = "c1", nguoi = "u1", tongMoiBai } = {}) {
  return Array.from({ length: co }, (_, i) => ({
    conversation_id: hoi, sender_id: nguoi, captured_at: luc(phut), posted_at: luc(phut),
    album_meta: { group_layout_id: id, id_in_group: `${id}-${i}`,
      ...(tong === null ? {} : { total_item_in_group: tongMoiBai ? tongMoiBai[i] : tong }) },
  }));
}
const duAlbum = (n, tienTo = "g") => Array.from({ length: n }, (_, i) => album(`${tienTo}${i}`)).flat();

test("đủ số báo trên một tập trộn", () => {
  const rows = [
    ...album("du"), ...album("thieu", { tong: 4, co: 2 }), ...album("khong-tong", { tong: null, co: 2 }),
    ...album("lech", { tong: 3, co: 2, tongMoiBai: [3, 4] }), ...album("don", { tong: 1, co: 1 }),
  ];
  const kq = demAnhRoi(rows, CUA_SO);
  assert.equal(kq.so_nhom, 5);
  assert.equal(kq.nhom_tu_2_bai, 4);
  assert.equal(kq.nhom_khong_tong, 1);
  assert.equal(kq.nhom_tong_khong_thong_nhat, 1);
  assert.equal(kq.nhom_tong_1, 1);
  assert.equal(kq.mau_so, 2, "mẫu số chỉ gồm nhóm có tổng từ 2, thống nhất");
  assert.equal(kq.nhom_thieu, 1);
});

test("biên ngưỡng: đúng 2,0% không cảnh báo, trên 2% cảnh báo, trên 5% dừng mở rộng", () => {
  assert.equal(NGUONG_CANH_BAO, 0.02);
  assert.equal(NGUONG_DUNG, 0.05);
  const voiThieu = (thieu) => demAnhRoi([...duAlbum(50 - thieu), ...Array.from({ length: thieu }, (_, i) =>
    album(`t${i}`, { tong: 3, co: 2 })).flat()], CUA_SO);
  const k1 = voiThieu(1);
  assert.equal(k1.ty_le, 0.02);
  assert.equal(k1.muc, "ok", "đúng 2,0% không cảnh báo");
  assert.equal(voiThieu(2).muc, "canh-bao");
  assert.equal(voiThieu(3).muc, "dung-mo-rong");
  // 5,0% đúng biên vẫn là cảnh báo, chưa dừng
  const k5 = demAnhRoi([...duAlbum(95), ...Array.from({ length: 5 }, (_, i) => album(`n${i}`, { co: 2 })).flat()], CUA_SO);
  assert.equal(k5.ty_le, 0.05);
  assert.equal(k5.muc, "canh-bao");
});

test("khoá gom gồm hội thoại, người gửi, group_layout_id: cùng mã album khác người là hai nhóm", () => {
  const rows = [...album("x", { tong: 2, co: 1, nguoi: "u1" }), ...album("x", { tong: 2, co: 1, nguoi: "u2" })];
  const kq = demAnhRoi(rows, CUA_SO);
  assert.equal(kq.so_nhom, 2);
  assert.equal(kq.nhom_thieu, 2, "gộp nhầm theo mã trần sẽ ra 1 nhóm đủ");
  assert.notEqual(khoaGom(rows[0]), khoaGom({ ...rows[0], conversation_id: "c2" }));
  assert.equal(khoaGom({ conversation_id: "c1", sender_id: "u1", album_meta: null }), null);
});

test("should-NOT-fire: nhóm tổng bằng 1 không vào mẫu số", () => {
  const kq = demAnhRoi([...duAlbum(10), ...Array.from({ length: 30 }, (_, i) => album(`d${i}`, { tong: 1, co: 1 })).flat()], CUA_SO);
  assert.equal(kq.mau_so, 10);
  assert.equal(kq.nhom_tong_1, 30);
  assert.equal(kq.muc, "ok");
});

test("should-NOT-fire: nhóm mới dưới 10 phút chưa tính thiếu, từ 10 phút thì tính", () => {
  const moi = demAnhRoi(album("m", { tong: 3, co: 1, phut: 9 }), CUA_SO);
  assert.equal(moi.nhom_thieu, 0);
  assert.equal(moi.nhom_dang_ve, 1);
  const cu = demAnhRoi(album("c", { tong: 3, co: 1, phut: 10 }), CUA_SO);
  assert.equal(cu.nhom_thieu, 1);
});

test("should-NOT-fire: album vắt qua ranh cửa sổ không tính thiếu; nhóm nằm trọn ngoài cửa sổ không đếm", () => {
  const ngoai = { ...album("v", { tong: 3, co: 1, phut: 24 * 60 + 5 })[0], album_meta: { group_layout_id: "v", id_in_group: "v-a", total_item_in_group: 3 } };
  const trong = { ...album("v", { tong: 3, co: 1, phut: 24 * 60 - 5 })[0], album_meta: { group_layout_id: "v", id_in_group: "v-b", total_item_in_group: 3 } };
  const kq = demAnhRoi([ngoai, trong], CUA_SO);
  assert.equal(kq.nhom_thieu, 0);
  assert.equal(kq.nhom_vat_ranh, 1);
  const chiNgoai = demAnhRoi(album("o", { tong: 3, co: 1, phut: 24 * 60 + 30 }), CUA_SO);
  assert.equal(chiNgoai.so_nhom, 0);
});

test("đếm post 202 trong cửa sổ và item snapshot S03-agent theo finishedAt", () => {
  const log = [
    `${luc(60)} post 202 {"accepted":1} group=g`, `${luc(60)} post 500 lỗi`,
    `${luc(24 * 60 + 1)} post 202 {"accepted":1} group=g`, `${luc(1)} post 202 {"accepted":1}`, "",
  ].join("\n");
  assert.equal(demPost202(log, CUA_SO), 2);
  const goc = mkdtempSync(path.join(tmpdir(), "do-anh-roi-"));
  try {
    const ghi = (ten, finishedAt, items) => {
      mkdirSync(path.join(goc, ten));
      writeFileSync(path.join(goc, ten, "manifest.json"), JSON.stringify({ finishedAt, counts: { items } }));
    };
    ghi("hanoi__s03-agent__a", luc(30), 7);
    ghi("hanoi__s03-agent__b", luc(24 * 60 + 30), 100);
    ghi("hanoi__s06-ads__c", luc(30), 50);
    assert.equal(demItemSnapshot(goc, CUA_SO), 7);
  } finally {
    rmSync(goc, { recursive: true, force: true });
  }
});

test("phép đo không ghi dữ liệu: chỉ SELECT trong giao dịch READ ONLY", () => {
  const ma = readFileSync(fileURLToPath(new URL("./do-anh-roi-s03.mjs", import.meta.url)), "utf8")
    .split("\n").filter((d) => !d.trim().startsWith("//")).join("\n");
  assert.match(ma, /BEGIN READ ONLY/);
  assert.doesNotMatch(ma, /\b(INSERT|UPDATE|DELETE|TRUNCATE|DROP|ALTER|CREATE)\b/);
  assert.doesNotMatch(ma, /writeFile|appendFile|rmSync|unlink/);
});
