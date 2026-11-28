// s02-doc-phien.test.ts — 2511-s02 (cửa API): đọc bản ghi phiên `auth` từ kho localStorage của profile bộ thu
// TRÊN ĐĨA, không mở trình duyệt. Chrome giữ localStorage trong LevelDB, bộ thu đọc theo đúng định dạng:
//   · tệp nhật ký (.log): khoá ghi đầy đủ, nhưng một bản ghi bị cắt mảnh khi qua ranh giới khối 32 KB;
//   · bảng (.ldb): khoá NÉN TIỀN TỐ — quét thô chuỗi khoá đầy đủ sẽ trượt (đo 26/11 trên profile thật).
// Mọi tệp LevelDB trong tệp này do bộ ghep cuối tệp dựng từ số — không dùng dữ liệu phiên thật.
import { strict as assert } from "node:assert";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  docKhoaTuBang,
  docKhoaTuLog,
  docPhienTuProfile,
  giaiMaGiaTri,
  giaiSnappy,
  khoaLocalStorage,
} from "../collectors/airdna-session.js";

// ---------------------------------------------------------------- bộ ghep LevelDB (dùng chung)
const KHOI_LOG = 32_768;
const gop = (...xs: Uint8Array[]): Uint8Array => {
  const ra = new Uint8Array(xs.reduce((n, x) => n + x.length, 0));
  let o = 0;
  for (const x of xs) {
    ra.set(x, o);
    o += x.length;
  }
  return ra;
};
const varint = (n: number) => {
  const o: number[] = [];
  do {
    let b = n & 0x7f;
    n = Math.floor(n / 128);
    if (n > 0) b |= 0x80;
    o.push(b);
  } while (n > 0);
  return Buffer.from(o);
};
const fixed32 = (n: number) => {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n >>> 0);
  return b;
};
const fixed64 = (n: number) => {
  const b = Buffer.alloc(8);
  b.writeUInt32LE(n % 2 ** 32, 0);
  b.writeUInt32LE(Math.floor(n / 2 ** 32), 4);
  return b;
};

/** Một WriteBatch: 8 byte số thứ tự gốc + 4 byte số mục + các mục (loại 1 = giá trị, 0 = xoá). */
const ghepBatch = (seq: number, muc: { khoa: Uint8Array; giaTri?: Uint8Array }[]) =>
  gop(
    fixed64(seq),
    fixed32(muc.length),
    ...muc.map((m) =>
      m.giaTri
        ? gop(Buffer.from([1]), varint(m.khoa.length), m.khoa, varint(m.giaTri.length), m.giaTri)
        : gop(Buffer.from([0]), varint(m.khoa.length), m.khoa),
    ),
  );

/** Batch một mục dài đúng `mucTieu` byte — để xếp ranh giới khối ở chỗ mong muốn. */
const batchDai = (mucTieu: number, seq = 1) => {
  for (let vlen = mucTieu - 24; vlen <= mucTieu; vlen++) {
    const b = ghepBatch(seq, [{ khoa: Buffer.from("k"), giaTri: Buffer.alloc(vlen) }]);
    if (b.length === mucTieu) return b;
  }
  throw new Error(`không dựng được batch dài ${mucTieu}`);
};

/** Tệp nhật ký LevelDB từ các bản ghi logic: header 7 byte không vừa hết khối thì đệm số 0, bản ghi cắt mảnh. */
const ghepLog = (banGhi: Uint8Array[], duoi: Uint8Array = Buffer.alloc(0)) => {
  const phan: Uint8Array[] = [];
  let o = 0;
  for (const r of banGhi) {
    let da = 0;
    do {
      const conLai = KHOI_LOG - (o % KHOI_LOG);
      if (conLai < 7) {
        phan.push(Buffer.alloc(conLai));
        o += conLai;
      }
      const moCua = Math.min(KHOI_LOG - (o % KHOI_LOG) - 7, r.length - da);
      const loai = da === 0 ? (moCua === r.length ? 1 : 2) : da + moCua === r.length ? 4 : 3;
      phan.push(gop(Buffer.alloc(4), fixed32(moCua).subarray(0, 2), Buffer.from([loai]), r.subarray(da, da + moCua)));
      o += 7 + moCua;
      da += moCua;
    } while (da < r.length);
  }
  return gop(...phan, duoi);
};

/** Khối bảng: mục nén tiền tố khoá (điểm khởi động lại mỗi `chuKy` mục), 1 byte loại nén, 4 byte crc. */
const ghepKhoi = (muc: { khoa: Uint8Array; giaTri: Uint8Array }[], chuKy = 16, nen = false) => {
  const phan: Uint8Array[] = [];
  const diem: number[] = [];
  let doi: Uint8Array = new Uint8Array();
  let dai = 0;
  muc.forEach((m, i) => {
    let p: Uint8Array;
    if (i % chuKy === 0) {
      diem.push(dai);
      p = gop(varint(0), varint(m.khoa.length), varint(m.giaTri.length), m.khoa, m.giaTri);
    } else {
      let chung = 0;
      while (chung < Math.min(doi.length, m.khoa.length) && doi[chung] === m.khoa[chung]) chung++;
      p = gop(varint(chung), varint(m.khoa.length - chung), varint(m.giaTri.length), m.khoa.subarray(chung), m.giaTri);
    }
    phan.push(p);
    doi = m.khoa;
    dai += p.length;
  });
  const than = gop(...phan, ...diem.map(fixed32), fixed32(diem.length));
  return gop(nen ? snappyChu(than) : than, Buffer.from([nen ? 1 : 0]), Buffer.alloc(4));
};

/** Dòng snappy chỉ gồm literal (đúng định dạng, không có bản sao) — đủ để dựng khối nén cho ca kiểm. */
const snappyChu = (duLieu: Uint8Array): Uint8Array => {
  const phan: Uint8Array[] = [varint(duLieu.length)];
  for (let o = 0; o < duLieu.length; o += 60) {
    const dai = Math.min(60, duLieu.length - o);
    phan.push(Buffer.from([(dai - 1) << 2]), duLieu.subarray(o, o + dai));
  }
  return gop(...phan);
};

/** Bảng LevelDB (.ldb): các khối dữ liệu + khối chỉ mục (khoá = khoá cuối khối) + chân trang 48 byte. */
const ghepBang = (
  muc: { khoa: Uint8Array; giaTri: Uint8Array }[],
  { mucMoiKhoi = 2, nenKhoi = [] as number[], nenChiMuc = false } = {},
) => {
  const cacKhoi: Uint8Array[] = [];
  const chiMuc: { khoa: Uint8Array; giaTri: Uint8Array }[] = [];
  let o = 0;
  for (let i = 0; i < muc.length; i += mucMoiKhoi) {
    const nhom = muc.slice(i, i + mucMoiKhoi);
    const k = ghepKhoi(nhom, 16, nenKhoi.includes(i / mucMoiKhoi));
    cacKhoi.push(k);
    chiMuc.push({ khoa: nhom[nhom.length - 1].khoa, giaTri: gop(varint(o), varint(k.length - 5)) });
    o += k.length;
  }
  const kChiMuc = ghepKhoi(chiMuc, 1, nenChiMuc);
  const chan = gop(varint(0), varint(0), varint(o), varint(kChiMuc.length - 5));
  return gop(
    ...cacKhoi,
    kChiMuc,
    chan,
    Buffer.alloc(40 - chan.length),
    Buffer.from("57fb808b247547db", "hex"), // số magic 0xdb4775248b80fb57 little-endian
  );
};

// khoá nội bộ LevelDB = khoá người + 8 byte (số thứ tự << 8 | loại)
const noiBo = (khoa: Uint8Array, seq: number, loai: 1 | 0 = 1) => gop(khoa, fixed64(seq * 256 + loai));
const muc = (khoa: Uint8Array, seq: number, giaTri?: Uint8Array) => ({ khoa: noiBo(khoa, seq, giaTri ? 1 : 0), giaTri: giaTri ?? Buffer.alloc(0) });

// dữ liệu giả: origin và khoá đều là ví dụ — không dính nguồn thật
const GOC = Buffer.from("_https://vi-du.test\x00\x01", "latin1");
const khoa = (s: string) => gop(GOC, Buffer.from(s));
const KHOA = khoa("auth");
const V = (s: string) => Buffer.from(s, "latin1");

// ---------------------------------------------------------------- docKhoaTuLog — tệp nhật ký
test("2511-s02 log: một batch một mục → đọc đủ giá trị kèm số thứ tự", () => {
  const kq = docKhoaTuLog(ghepLog([ghepBatch(10, [{ khoa: KHOA, giaTri: V("gia-tri") }])]), KHOA);
  assert.equal(kq.length, 1);
  assert.equal(kq[0].thuTu, 10);
  assert.equal(kq[0].xoa, false);
  assert.equal(Buffer.from(kq[0].giaTri).toString("latin1"), "gia-tri");
});

test("2511-s02 log: khoá ở mục thứ hai của batch mang số thứ tự gốc + 1", () => {
  const kq = docKhoaTuLog(
    ghepLog([ghepBatch(100, [{ khoa: khoa("a"), giaTri: V("x") }, { khoa: KHOA, giaTri: V("giua") }, { khoa: khoa("b"), giaTri: V("y") }])]),
    KHOA,
  );
  assert.equal(kq.length, 1);
  assert.equal(kq[0].thuTu, 101, "mục i của batch mang số thứ tự gốc + i");
});

test("2511-s02 log: hai phiên bản trong một tệp → giữ cả hai, bản sau số thứ tự lớn hơn", () => {
  const kq = docKhoaTuLog(
    ghepLog([ghepBatch(10, [{ khoa: KHOA, giaTri: V("cu") }]), ghepBatch(11, [{ khoa: KHOA, giaTri: V("moi") }])]),
    KHOA,
  );
  assert.deepEqual(
    kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]),
    [
      [10, "cu"],
      [11, "moi"],
    ],
  );
});

test("2511-s02 log: bản ghi cắt mảnh qua ranh giới khối 32 KB (FIRST → LAST) → ghép lại đọc đủ", () => {
  const lon = batchDai(KHOI_LOG - 7 - 10); // header kế bắt đầu tại 32758: khối chỉ còn 10 byte
  const kqGoc = ghepBatch(7, [{ khoa: khoa("truoc"), giaTri: V("nho") }, { khoa: KHOA, giaTri: Buffer.alloc(1500, 0x61) }]);
  const tep = ghepLog([lon, kqGoc]);
  assert.equal(tep[32758 + 6], 2, "đầu vào thật sự bị cắt: mảnh FIRST ở header cuối khối");
  const kq = docKhoaTuLog(tep, KHOA);
  assert.equal(kq.length, 1);
  assert.equal(kq[0].thuTu, 8);
  assert.equal(kq[0].giaTri.length, 1500);
  assert.ok(Buffer.from(kq[0].giaTri).equals(Buffer.alloc(1500, 0x61)), "giá trị nguyên vẹn sau khi ghép mảnh");
});

test("2511-s02 log: bản ghi dài hơn một khối (FIRST → MIDDLE → LAST) → ghép đủ", () => {
  const dai = ghepBatch(3, [{ khoa: KHOA, giaTri: Buffer.alloc(70_000, 0x7a) }]);
  const kq = docKhoaTuLog(ghepLog([dai]), KHOA);
  assert.equal(kq.length, 1);
  assert.equal(kq[0].giaTri.length, 70_000);
});

test("2511-s02 log: mục XOÁ → có bản ghi xoa mang số thứ tự của mục đó", () => {
  const kq = docKhoaTuLog(ghepLog([ghepBatch(12, [{ khoa: KHOA }])]), KHOA);
  assert.deepEqual(kq.map((b) => [b.thuTu, b.xoa, b.giaTri.length]), [[12, true, 0]]);
});

test("2511-s02 log: khoá chỉ GIỐNG một phần (auth2, hay chứa trong khoá khác) → không khớp", () => {
  const kq = docKhoaTuLog(
    ghepLog([ghepBatch(1, [{ khoa: khoa("auth2"), giaTri: V("a") }, { khoa: gop(GOC, Buffer.from("xauth")), giaTri: V("b") }, { khoa: khoa("aut"), giaTri: V("c") }])]),
    KHOA,
  );
  assert.equal(kq.length, 0);
});

test("2511-s02 log: đuôi tệp còn ghi dở (header hứa 200 byte mà hết tệp) → dừng ở đó, giữ phần đã đọc", () => {
  const tep = ghepLog([ghepBatch(5, [{ khoa: KHOA, giaTri: V("ok") }])], Buffer.from([0, 0, 0, 0, 200, 0, 1, 1, 2, 3]));
  const kq = docKhoaTuLog(tep, KHOA);
  assert.equal(kq.length, 1);
  assert.equal(Buffer.from(kq[0].giaTri).toString(), "ok");
});

test("2511-s02 log: vùng đệm chưa ghi ở cuối tệp (header loại 0, độ dài 0) → bỏ qua, không phải bản ghi", () => {
  const kq = docKhoaTuLog(ghepLog([ghepBatch(5, [{ khoa: KHOA, giaTri: V("ok") }])], Buffer.alloc(1000)), KHOA);
  assert.equal(kq.length, 1);
  assert.equal(Buffer.from(kq[0].giaTri).toString(), "ok");
});

// ---------------------------------------------------------------- docKhoaTuBang — bảng (.ldb)
test("2511-s02 bảng: khoá bị nén tiền tố → vẫn khớp khi tệp KHÔNG chứa chuỗi khoá đầy đủ", () => {
  const bang = ghepBang(
    [muc(khoa("aaa"), 1, V("a")), muc(KHOA, 2, V("phia-auth")), muc(khoa("zzz"), 3, V("z"))],
    { mucMoiKhoi: 3 },
  );
  assert.equal(Buffer.from(bang).indexOf(KHOA), -1, "đầu vào thật sự nén tiền tố: không có khoá đầy đủ trong tệp");
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(
    kq.map((b) => [b.thuTu, b.xoa, Buffer.from(b.giaTri).toString()]),
    [[2, false, "phia-auth"]],
  );
});

test("2511-s02 bảng: nhiều phiên bản của cùng khoá TRONG MỘT KHỐI → giữ cả hai, bản mới đứng trước", () => {
  const bang = ghepBang([muc(KHOA, 9, V("moi")), muc(KHOA, 4, V("cu"))], { mucMoiKhoi: 2 });
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(
    kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]),
    [
      [9, "moi"],
      [4, "cu"],
    ],
  );
});

test("2511-s02 bảng: bản CŨ hơn của cùng khoá tràn sang khối sau → vẫn có bản MỚI NHẤT ở khối ứng viên", () => {
  // đo 26/11 trên bảng thật 000005: hai phiên bản của một khoá nằm ở hai khối; chỉ bản mới nhất được dùng
  const bang = ghepBang([muc(KHOA, 9, V("moi")), muc(KHOA, 4, V("cu"))], { mucMoiKhoi: 1 });
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(
    kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]),
    [[9, "moi"]],
  );
});

test("2511-s02 bảng: khoá nằm ở khối dữ liệu THỨ BA (tìm qua chỉ mục) → đọc được", () => {
  const bang = ghepBang(
    [
      muc(khoa("0a"), 1, V("1")), muc(khoa("1b"), 2, V("2")),
      muc(khoa("2c"), 3, V("3")), muc(khoa("3d"), 4, V("4")),
      muc(khoa("4e"), 5, V("5")), muc(KHOA, 6, V("khoi-ba")), muc(khoa("zzz"), 7, V("7")),
    ],
    { mucMoiKhoi: 2 },
  );
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(
    kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]),
    [[6, "khoi-ba"]],
  );
});

test("2511-s02 bảng: mục XOÁ → bản ghi xoa", () => {
  const kq = docKhoaTuBang(ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 7)], { mucMoiKhoi: 2 }), KHOA);
  assert.deepEqual(kq.map((b) => [b.thuTu, b.xoa]), [[7, true]]);
});

test("2511-s02 bảng: không có khoá → mảng rỗng", () => {
  assert.deepEqual(docKhoaTuBang(ghepBang([muc(khoa("a"), 1, V("a"))], { mucMoiKhoi: 1 }), KHOA), []);
});

test("2511-s02 bảng: khối ứng viên bị nén snappy → giải nén rồi đọc được bình thường", () => {
  const bang = ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 3, V("giai-nen")), muc(khoa("b"), 2, V("b"))], { mucMoiKhoi: 1, nenKhoi: [1] });
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]), [[3, "giai-nen"]]);
});

test("2511-s02 bảng: khối CHỈ MỤC bị nén (đo 26/11: bảng thật 000005) → vẫn tìm được khối và đọc được", () => {
  const bang = ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 3, V("ok")), muc(khoa("b"), 2, V("b"))], { mucMoiKhoi: 1, nenKhoi: [0, 1, 2], nenChiMuc: true });
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]), [[3, "ok"]]);
});

test("2511-s02 bảng: khối nén HỎNG (khai độ dài ra sai) → ném lỗi nói rõ", () => {
  const k0 = ghepKhoi([muc(khoa("a"), 1, V("a"))]);
  const bang = Buffer.from(ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 3, V("x"))], { mucMoiKhoi: 1, nenKhoi: [1] }));
  bang[k0.length] = 0x7f; // byte đầu thân khối nén là độ dài khai: khai 127 trong khi thân ngắn hơn nhiều
  assert.throws(() => docKhoaTuBang(bang, KHOA), /nén hỏng/);
});

// ---------------------------------------------------------------- giaiSnappy — bộ giải nén khối
const chuLatin = (u: Uint8Array): string => Buffer.from(u).toString("latin1");

test("2511-s02 snappy: chữ rồi bản sao chồng lấn (copy offset 1 byte) → giải đúng chuỗi lặp", () => {
  // varint(12) · literal 3 byte "abc" · copy dài 9 từ lệch 3
  const dong = Uint8Array.from([0x0c, 0x08, 0x61, 0x62, 0x63, 0x15, 0x03]);
  const ra = giaiSnappy(dong, 0, dong.length);
  assert.ok(ra, "giải được");
  assert.equal(chuLatin(ra), "abcabcabcabc");
});

test("2511-s02 snappy: chữ dài 70 byte (độ dài nằm ở byte kế tiếp) → giải đủ", () => {
  const duLieu = Buffer.alloc(70, 0x5a);
  const dong = gop(Buffer.from([70]), Buffer.from([60 << 2, 69]), duLieu); // tag>>2 = 60 → một byte độ dài (70-1)
  const ra = giaiSnappy(dong, 0, dong.length);
  assert.ok(ra, "giải được");
  assert.ok(Buffer.from(ra).equals(duLieu));
});

test("2511-s02 snappy: copy offset 2 byte và 4 byte → giải đúng", () => {
  const duLieu = Buffer.from(Array.from({ length: 300 }, (_, i) => i & 0xff));
  const varint320 = Buffer.from([0xc0, 0x02]);
  const chu = gop(Buffer.from([61 << 2, 299 & 0xff, 299 >> 8]), duLieu); // tag>>2 = 61 → hai byte độ dài (300-1)
  const hai = gop(varint320, chu, Buffer.from([(19 << 2) | 2, 0x2c, 0x01])); // copy 20 byte từ lệch 300
  const bon = gop(varint320, chu, Buffer.from([(19 << 2) | 3, 0x2c, 0x01, 0x00, 0x00]));
  for (const dong of [hai, bon]) {
    const ra = giaiSnappy(dong, 0, dong.length);
    assert.ok(ra, "giải được");
    assert.equal(ra.length, 320);
    assert.ok(Buffer.from(ra.subarray(0, 300)).equals(duLieu) && Buffer.from(ra.subarray(300)).equals(duLieu.subarray(0, 20)), "300 byte chữ + 20 byte bản sao");
  }
});

test("2511-s02 snappy: khai độ dài ra sai (hơn số tạo được) → null", () => {
  const dong = Uint8Array.from([0x7f, 0x08, 0x61, 0x62, 0x63]); // khai 127 byte, chỉ tạo được 3
  assert.equal(giaiSnappy(dong, 0, dong.length), null);
});

test("2511-s02 snappy: offset ở giữa buffer, chỉ đọc đúng số byte khai → không dính rác hai bên", () => {
  const dong = Uint8Array.from([0xff, 0x03, 0x08, 0x78, 0x79, 0x7a, 0xff]);
  const ra = giaiSnappy(dong, 1, 5);
  assert.ok(ra, "giải được");
  assert.equal(chuLatin(ra), "xyz");
});

test("2511-s02 bảng: khối KHÁC bị nén (khoá không nằm ở đó) → vẫn đọc được bình thường", () => {
  const bang = ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 3, V("ok")), muc(khoa("b"), 2, V("b"))], { mucMoiKhoi: 1, nenKhoi: [0, 2] });
  const kq = docKhoaTuBang(bang, KHOA);
  assert.deepEqual(kq.map((b) => [b.thuTu, Buffer.from(b.giaTri).toString()]), [[3, "ok"]]);
});

// ---------------------------------------------------------------- giaiMaGiaTri — byte đầu là mã hoá
test("2511-s02 giá trị: tiền tố 0x01 → Latin-1", () => {
  assert.equal(giaiMaGiaTri(gop(Buffer.from([1]), Buffer.from('{"a":1}', "latin1"))), '{"a":1}');
});

test("2511-s02 giá trị: tiền tố 0x00 → UTF-16LE, giữ đúng dấu tiếng Việt", () => {
  const chuoi = '{"ten":"Nguyễn Văn A"}';
  assert.equal(giaiMaGiaTri(gop(Buffer.from([0]), Buffer.from(chuoi, "utf16le"))), chuoi);
});

test("2511-s02 giá trị: rỗng → chuỗi rỗng", () => {
  assert.equal(giaiMaGiaTri(new Uint8Array()), "");
});

// ---------------------------------------------------------------- khoaLocalStorage
test("2511-s02 khoá localStorage: '_' + origin + 0x00 + 0x01 (Latin-1) + tên khoá", () => {
  assert.ok(Buffer.from(khoaLocalStorage("https://vi-du.test", "auth")).equals(KHOA));
});

// ---------------------------------------------------------------- docPhienTuProfile — cả kho
function taoProfile(teps: Record<string, Uint8Array>): string {
  const goc = mkdtempSync(join(tmpdir(), "s02-profile-"));
  const thuMuc = join(goc, "Default", "Local Storage", "leveldb");
  mkdirSync(thuMuc, { recursive: true });
  for (const [ten, b] of Object.entries(teps)) writeFileSync(join(thuMuc, ten), b);
  return goc;
}
const giaTriJson = (j: unknown) => gop(Buffer.from([1]), Buffer.from(JSON.stringify(j), "latin1"));
const voiProfile = (teps: Record<string, Uint8Array>, lam: (thuMuc: string) => void) => {
  const thuMuc = taoProfile(teps);
  try {
    lam(thuMuc);
  } finally {
    rmSync(thuMuc, { recursive: true, force: true });
  }
};
const banGhi = (seq: number, ten: string) =>
  ghepBatch(seq, [{ khoa: KHOA, giaTri: giaTriJson({ appToken: "jwt-gia", fusionAuthRefreshToken: `rt-${ten}` }) }]);

test("2511-s02 profile: bảng cũ (thứ tự 5) và nhật ký mới (thứ tự 9) → lấy bản 9 bất kể tên tệp nào lớn hơn", () => {
  voiProfile({ "000192.ldb": ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 5, giaTriJson({ p: "bang" }))], { mucMoiKhoi: 2 }), "000191.log": ghepLog([banGhi(9, "nhat-ky")]) }, (thuMuc) => {
    assert.deepEqual(docPhienTuProfile(thuMuc, KHOA), { appToken: "jwt-gia", fusionAuthRefreshToken: "rt-nhat-ky" });
  });
});

test("2511-s02 profile: nhật ký ghi sau cùng là XOÁ → null (đã đăng xuất)", () => {
  voiProfile({ "000005.ldb": ghepBang([muc(KHOA, 5, giaTriJson({ p: "bang" }))]), "000191.log": ghepLog([ghepBatch(9, [{ khoa: KHOA }])]) }, (thuMuc) => {
    assert.equal(docPhienTuProfile(thuMuc, KHOA), null);
  });
});

test("2511-s02 profile: chưa đăng nhập (thư mục kho không có, hoặc không tệp nào) → null", () => {
  const thuMuc = mkdtempSync(join(tmpdir(), "s02-profile-trong-"));
  try {
    assert.equal(docPhienTuProfile(thuMuc, KHOA), null);
    voiProfile({}, (trong) => assert.equal(docPhienTuProfile(trong, KHOA), null));
  } finally {
    rmSync(thuMuc, { recursive: true, force: true });
  }
});

test("2511-s02 profile: đường dẫn profile có dấu gạch chéo cuối vẫn đọc được", () => {
  voiProfile({ "000191.log": ghepLog([banGhi(9, "duoi")]) }, (thuMuc) => {
    assert.equal((docPhienTuProfile(`${thuMuc}/`, KHOA) as { fusionAuthRefreshToken: string }).fusionAuthRefreshToken, "rt-duoi");
  });
});

test("2511-s02 profile: giá trị mã hoá UTF-16 → vẫn giải ra JSON", () => {
  const j = { appToken: "jwt", ten: "Nguyễn" };
  const utf16 = gop(Buffer.from([0]), Buffer.from(JSON.stringify(j), "utf16le"));
  voiProfile({ "000191.log": ghepLog([ghepBatch(1, [{ khoa: KHOA, giaTri: utf16 }])]) }, (thuMuc) => {
    assert.deepEqual(docPhienTuProfile(thuMuc, KHOA), j);
  });
});

test("2511-s02 profile: giá trị mới nhất không phải JSON → null", () => {
  voiProfile({ "000191.log": ghepLog([banGhi(5, "cu"), ghepBatch(6, [{ khoa: KHOA, giaTri: V("khong-phai-json") }])]) }, (thuMuc) => {
    assert.equal(docPhienTuProfile(thuMuc, KHOA), null);
  });
});

test("2511-s02 profile: tệp BẢNG hỏng → ném lỗi nói tên tệp, KHÔNG lặng lẽ dùng bản cũ hơn ở tệp khác", () => {
  const bang = Buffer.from(ghepBang([muc(khoa("a"), 1, V("a")), muc(KHOA, 9, V("moi"))]));
  bang[bang.length - 1] ^= 0xff; // hỏng số magic ở chân trang
  voiProfile({ "000191.log": ghepLog([banGhi(5, "cu")]), "000192.ldb": bang }, (thuMuc) => {
    assert.throws(() => docPhienTuProfile(thuMuc, KHOA), /000192\.ldb/);
  });
});
