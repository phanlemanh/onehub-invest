// PL43 s03-thu-lai-tin-roi-oan — luật nhận bài S03 viết tắt (AC-1, AC-2, AC-3). Ma trận viết trước theo hợp đồng
// _acceptance/s03-thu-lai-tin-roi-oan/contract.md; chiều đỏ chạy cùng ma trận bằng luật cũ tiêm qua `luat.pl43`.
import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePost, suyLoai, coDauHieuBds, LUAT_PL43, LUAT_TRUOC_PL43 } from "../transform-zalo.mjs";

const doc = (text, pl43 = LUAT_PL43) => {
  const pr = parsePost(text, { luat: pl43 });
  const r = suyLoai({ ...pr }, text, "ca-hai", null, { pl43 });
  return { ...r, priceVnd: pr.priceVnd };
};

// AC-1: mỗi dạng một câu giá thuê và một câu giá bán.
const DANG = ["2PN2w", "2pn2wc", "2 phòng ngủ +", "2 NGỦ", "1 ngủ", "Stu", "stu", "STUDIO", "BE5 Stu"];
const THUE = (d) => `${d} full nội thất 8tr ở liền`;
const BAN = (d) => `${d} view nội khu 2.6 tỷ`;

test("PL43-AC-1 dấu hiệu BĐS viết tắt: mỗi dạng ra đúng loại; luật cũ ra «bo»", () => {
  const loi = [];
  for (const d of DANG) {
    if (doc(THUE(d)).kind !== "rent_lt") loi.push(`thuê «${d}» → ${doc(THUE(d)).kind}`);
    if (doc(BAN(d)).kind !== "sale") loi.push(`bán «${d}» → ${doc(BAN(d)).kind}`);
  }
  assert.deepEqual(loi, [], "PL43-AC-1 dạng viết tắt không ra đúng loại");
  // Chiều đỏ: luật cũ bỏ sót đúng bảy dạng (cả bản thuê lẫn bản bán); «2pn2wc» (đuôi «2wc») và «STUDIO» vốn đã nhận — ca giữ.
  const BO_SOT = ["2PN2w", "2 phòng ngủ +", "2 NGỦ", "1 ngủ", "Stu", "stu", "BE5 Stu"];
  const cuNhan = DANG.filter((d) => doc(THUE(d), LUAT_TRUOC_PL43).kind || doc(BAN(d), LUAT_TRUOC_PL43).kind);
  assert.deepEqual(DANG.filter((d) => !cuNhan.includes(d)), BO_SOT, "PL43-AC-1 đối chứng: tập dạng luật cũ bỏ sót lệch ma trận viết trước");
});

test("PL43-AC-1 diện tích trần đi cùng giá là dấu hiệu BĐS", () => {
  const t = "🏠 HUỆ NGUYỄN NHÀ ĐẸP 🏠 S205 · 55m · 9,5tr · Full 📩 Inbox nhận ảnh";
  assert.equal(doc(t).kind, "rent_lt", "PL43-AC-1 diện tích trần: «55m · 9,5tr» không thành tin thuê");
  assert.equal(doc(t, LUAT_TRUOC_PL43).kind, null, "PL43-AC-1 đối chứng: luật cũ lẽ ra bỏ bài chỉ có diện tích trần");
});

test("PL43-AC-1 chiều đỏ: sáu câu không có dấu hiệu BĐS", () => {
  const DO = ["cho vay 1 năm lãi thấp 5tr", "tuyển 3 nữ phục vụ lương 8tr", "KH 1 nữ cần người 7tr", "cách 500m giá 5tr", "Stuff nhà bếp sale 5tr", "sinh viên studious gia sư 3tr"];
  for (const t of DO) {
    assert.equal(coDauHieuBds(t), false, `PL43-AC-1 «${t}» không được là dấu hiệu BĐS`);
    assert.equal(doc(t).kind, null, `PL43-AC-1 «${t}» không được thành tin`);
  }
});

test("PL43-AC-2 giá không đơn vị ở bài bán", () => {
  const CA = [
    ["Rainbow 1PN+ 47m2 Giá 1t920 BTP có sổ", 1_920_000_000],
    ["Căn 2PN 70m2 2t45 bao phí full đồ", 2_450_000_000],
    ["2PN2vs view sông Giá: 3.7 (thu nét về ) sẵn sổ", 3_700_000_000],
    ["Loại căn: STUDIO Diện tích: 26.6m Giá: 1.650 net", 1_650_000_000],
  ];
  for (const [t, gia] of CA) {
    const r = doc(t);
    assert.equal(r.kind, "sale", `PL43-AC-2 «${t}» không thành tin bán`);
    assert.equal(r.priceVnd, gia, `PL43-AC-2 «${t}» đọc sai giá`);
  }
  assert.equal(parsePost("căn góc 1t9 tầng cao view hồ").priceVnd, null, "PL43-AC-2 «1t9 tầng cao» không được là giá");
  assert.equal(parsePost("thuê 5t5 full đồ studio").priceVnd, null, "PL43-AC-2 «5t5» (5,5 triệu) không được thành 5,5 tỷ");
  assert.equal(parsePost("studio 5t50 full đồ ở liền").priceVnd, null, "PL43-AC-2 «5t50» không tín hiệu bán không được thành 5,5 tỷ");
  // Đối chứng: giữ đúng kết quả hàm cũ.
  for (const t of ["2PN 70m2 Giá 2.5 tỷ/tháng", "bán căn 2PN 50m2 250 triệu", "căn 45m2 giá 7.000.000/m2 2PN"]) {
    assert.deepEqual(doc(t), doc(t, LUAT_TRUOC_PL43), `PL43-AC-2 đối chứng «${t}» đổi kết quả so với luật cũ`);
  }
});

test("PL43-AC-3 câu tìm dạng mới vẫn là Yêu cầu; khẩu hiệu môi giới là tin rao", () => {
  const TIM = [
    "Tìm 1 ngủ toà Be cơ bản giá dưới 7 triệu ạ",
    "Cần Stu LD full đồ ở 1 năm 6tr bp có bàn làm việc",
    "Ai có stu 6.5trbp ko ạ",
    "Em đang đi với khách, kiếm stu full ở liền <7tr",
    "kiếm 2pn full 10tr khu S",
    // S4 r1: câu tìm lọt trong mẫu AC-6 vòng 1.
    "Khách chốt onl stu full 5.5-6tr, ace có hàng gởi e",
    "Tìm gđ3 view đảo căn góc đẹp 2 ngủ tc 4-5 tỷ ace có hàng ib gấp kh cọc trong tuần",
    "Em cần nguồn 58m aquabay đông nam giá 2,9x luôn ạ",
    "Gấp khách thuê stu trống 6 tháng tài chính 5-6 triệu ở ngay đang ở dự án có gửi căn hợp tác",
    "Ai nắm chủ căn stu s801 1ty490 này ib e vs nha",
    "3 tỷ tìm 50-55m wb gấp liên hệ",
    "Em cần gấp chốt onl 7tr quay xe Stu NTCB OS Khách ở k làm BNB View gì cũng được ạ",
  ];
  for (const t of TIM) assert.equal(doc(t).nguon, "yeu-cau", `PL43-AC-3 «${t}» lẽ ra là Yêu cầu`);
  const KHAU = [
    "‼️HÀNG THUÊ 2PN BE TRỐNG 9.5TR ‼️ Ở được ngay 💬 Tìm nhà không khó – Có em Như lo!",
    "❗ Tìm căn khó có em Lo ❗ 🏡 Studio S1.01 trống 4,5 tr",
  ];
  for (const t of KHAU) assert.equal(doc(t).kind, "rent_lt", `PL43-AC-3 khẩu hiệu «${t.slice(0, 30)}…» lẽ ra là tin thuê`);
  // Chiều đỏ: bỏ phần đi cặp (F) thì câu tìm thành tin rao.
  const khongCap = { ...LUAT_PL43, yeuCauCap: false };
  const lot = TIM.filter((t) => doc(t, khongCap).kind);
  const khongLot = TIM.filter((t) => !doc(t, khongCap).kind);
  assert.deepEqual(khongLot, [], "PL43-AC-3 đối chứng: bỏ phần F mà các câu này vẫn không thành tin — chúng không đo được phần F");
});
