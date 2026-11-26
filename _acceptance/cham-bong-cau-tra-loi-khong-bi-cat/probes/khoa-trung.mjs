// khoa-trung.mjs <thư mục state> <mã lượt> — đối chiếu khoá dùng lại của lượt cũ với mã hiện tại và kho thật (E8, AC-6).
//
// Sửa sau chữ ký (phán GS 26/11, khớp expected E8 đã ký — «thẻ rời hàng hay đổi chữ in riêng có lý do»): thẻ ĐỔI CHỮ được in
// riêng và đếm, không tính THIẾU. Căn cứ đo được, không đoán: khoá lệch thì tính lại khoá trên bản bài mới nhất được chụp KHÔNG
// MUỘN HƠN lúc lượt cũ bắt đầu (thời điểm trong mã lượt cb-<ISO>); khoá đó khớp khoá lượt cũ VÀ bài mới nhất hiện nay chụp sau
// lượt cũ → chỉ có chữ bài / tên nhóm đổi (đề xuất, model, prompt_version giữ nguyên). Mọi lệch khác → THIẾU (đỏ).
//
// Đối chứng phá (chỉ trong lượt kiểm, không đụng kho hay DB): KT_PHA=lech:<review_id> làm lệch khoá lượt cũ của thẻ đó;
// KT_PHA=vang-kho:<review_id> coi như kho không có khoá của thẻ đó. Cả hai phải ra ĐỎ đúng thẻ ấy.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const AGENT = new URL("../../../agent/", import.meta.url).pathname;
const { moDocChiDoc, docThe } = await import(AGENT + "src/enrich/cham-bong/doc-db.ts");
const { khoaDung, moKho } = await import(AGENT + "src/enrich/cham-bong/kho.ts");
const { napCauHinhCham } = await import(AGENT + "src/enrich/cham-bong/cau-hinh.ts");
const [STATE, LUOT] = process.argv.slice(2);
const tepKq = join(STATE, LUOT, "ket-qua.jsonl");
if (!existsSync(tepKq)) { console.log(`ĐỎ: không có ${tepKq}`); process.exit(1); }
const mLuot = /^cb-(\d{4}-\d{2}-\d{2})T(\d{2})(\d{2})(\d{2})(\d{3})Z$/.exec(LUOT);
if (!mLuot) { console.log(`ĐỎ: mã lượt ${LUOT} không mang thời điểm (cb-YYYY-MM-DDTHHMMSSmmmZ)`); process.exit(1); }
const LUC_LUOT = `${mLuot[1]}T${mLuot[2]}:${mLuot[3]}:${mLuot[4]}.${mLuot[5]}Z`;
const [PHA_KIEU, PHA_ID] = (process.env.KT_PHA ?? "").split(":");
if (PHA_KIEU) console.log(`ĐỐI CHỨNG PHÁ: ${PHA_KIEU} thẻ ${PHA_ID}`);
const { cauHinh } = napCauHinhCham();
const doc = readFileSync(tepKq, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((d) => d.loai === "doc");
const cap = new Map();
for (const d of doc) cap.set(`${d.review_id}|${d.model}`, PHA_KIEU === "lech" && String(d.review_id) === PHA_ID ? `pha-${d.khoa}` : d.khoa);
const kho = moKho(join(STATE, "kho.jsonl"));
const coTrongKho = (k, id) => !(PHA_KIEU === "vang-kho" && id === PHA_ID) && kho.co(k);
// Bản bài lúc lượt cũ: cùng cách chọn của CAU_THE (bài mới nhất trong post_ids của tin), giới hạn captured_at ≤ lúc lượt.
const CAU_BAI_LUC = `
SELECT
  (SELECT s.text FROM stg_zalo_posts s WHERE s.post_id = ANY (o.post_ids) AND s.captured_at <= $2::timestamptz
    ORDER BY s.captured_at DESC NULLS LAST LIMIT 1) AS text_cu,
  (SELECT s.group_name FROM stg_zalo_posts s WHERE s.post_id = ANY (o.post_ids) AND s.captured_at <= $2::timestamptz
    ORDER BY s.captured_at DESC NULLS LAST LIMIT 1) AS group_cu,
  (SELECT max(s.captured_at) FROM stg_zalo_posts s WHERE s.post_id = ANY (o.post_ids)) AS chup_moi_nhat
FROM sale_offers o WHERE o.offer_id = $1`;
const { truy, dong } = await moDocChiDoc(process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest");
try {
  const { the } = await docThe(truy);
  const theoId = new Map(the.map((t) => [t.review_id, t]));
  let trung = 0, roi = 0;
  const thieu = [];
  const doiChu = [];
  for (const [k, khoaCu] of cap) {
    const [id, model] = k.split("|");
    const t = theoId.get(Number(id));
    if (!t) { roi++; console.log(`rời hàng: thẻ ${id} × ${model}`); continue; }
    const m = cauHinh.model.find((x) => x.gateway === model);
    const khoaMoi = khoaDung(t, m, cauHinh.prompt_version);
    if (khoaMoi !== khoaCu) {
      const { rows: [b] } = await truy(CAU_BAI_LUC, [t.offer_id, LUC_LUOT]);
      const khoaLucCu = b && b.text_cu != null ? khoaDung({ ...t, text: b.text_cu, group_name: b.group_cu ?? null }, m, cauHinh.prompt_version) : null;
      const chupSau = b && b.chup_moi_nhat && new Date(b.chup_moi_nhat) > new Date(LUC_LUOT);
      if (khoaLucCu === khoaCu && chupSau) {
        doiChu.push(`thẻ ${id} × ${model}: bài đăng lại chữ mới (chụp mới nhất ${new Date(b.chup_moi_nhat).toISOString()} > lượt cũ ${LUC_LUOT}); khoá tính trên bài lúc lượt cũ khớp ${khoaCu.slice(0, 12)}`);
      } else {
        thieu.push(`thẻ ${id} × ${model}: khoá mới ${khoaMoi.slice(0, 12)} ≠ khoá lượt 1 ${khoaCu.slice(0, 12)} (bài lúc lượt cũ ${khoaLucCu ? "cũng lệch" : "không dựng được"})`);
      }
    } else if (!coTrongKho(khoaMoi, id)) thieu.push(`thẻ ${id} × ${model}: khoá có ở lượt 1 nhưng không có trong kho`);
    else trung++;
  }
  const theDoiChu = new Set(doiChu.map((x) => x.split(" × ")[0]));
  console.log(`cặp đọc thành công ở lượt ${LUOT}: ${cap.size} · trúng kho ${trung} · rời hàng ${roi} · đổi chữ ${doiChu.length} (${theDoiChu.size} thẻ) · thiếu ${thieu.length}`);
  for (const x of doiChu) console.log(`ĐỔI CHỮ ${x}`);
  for (const x of thieu) console.log(`THIẾU ${x}`);
  if (thieu.length) { console.log(`ĐỎ: ${thieu.length} cặp không dùng lại được`); process.exitCode = 1; }
  else console.log(`XANH: ${trung}/${cap.size - roi - doiChu.length} cặp thẻ còn nguyên dùng lại được; ${doiChu.length} cặp đổi chữ in riêng`);
} finally { await dong(); }
