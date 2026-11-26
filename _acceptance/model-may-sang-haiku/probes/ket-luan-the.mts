// ket-luan-the.mts — MH1 AC-8 «kết luận luật đổi»: với mỗi cặp của so-truoc-sau.json, đưa kết luận luật trước lời gọi và đầu ra
// thô của model qua ĐÚNG hàm dựng thẻ của judge-run (`noiDungThe` — cả hai nhánh ghi thẻ dùng nó) và in kết luận thẻ sẽ mang.
// Chạy: cd agent && node --import tsx ../_acceptance/model-may-sang-haiku/probes/ket-luan-the.mts <so-truoc-sau.json> [--cay-ket-luan]
// --cay-ket-luan: bản đột biến để kết luận thẻ đọc theo lời giải thích của model (thứ luật L14 cấm) — phép đo phải đỏ.
import { readFileSync } from "node:fs";
import { noiDungThe } from "../../../agent/scripts/judge-run.js";
import { parseGiaiThich, type KetLuan, type KetQuaLuat } from "../../../agent/src/agents/judge-entity.js";

const [tep, ...co] = process.argv.slice(2);
const cay = co.includes("--cay-ket-luan");
const kq = JSON.parse(readFileSync(tep, "utf8")) as { judge: { raw: string | null; ket_luan_truoc: KetLuan }[] };

const dotBien = (luat: KetQuaLuat, giai: string | null): KetLuan =>
  giai && /khác|không (phải )?cùng|không trùng/i.test(giai) ? "no" : giai && /cùng một căn|trùng căn/i.test(giai) ? "yes" : luat.same_house;

const ra = kq.judge.map((j) => {
  const luat: KetQuaLuat = { same_house: j.ket_luan_truoc, ly_do: [], lech: { gia_m2: null, dien_tich: null } };
  const giai = j.raw === null ? null : parseGiaiThich(j.raw);
  const cuocGoi = { model: null, trace: null, ok: giai !== null, loi: giai === null ? "sai-khuon" : null };
  return cay ? dotBien(luat, giai) : noiDungThe(luat, giai, cuocGoi, "1970-01-01T00:00:00Z").ketLuan;
});
process.stdout.write(JSON.stringify(ra));
