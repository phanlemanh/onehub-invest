// khoa-trung.mjs <thư mục state> <mã lượt> — đối chiếu khoá dùng lại của lượt cũ với mã hiện tại và kho thật (E8, AC-6).
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
const AGENT = new URL("../../../agent/", import.meta.url).pathname;
const { moDocChiDoc, docThe } = await import(AGENT + "src/enrich/cham-bong/doc-db.ts");
const { khoaDung, moKho } = await import(AGENT + "src/enrich/cham-bong/kho.ts");
const { napCauHinhCham } = await import(AGENT + "src/enrich/cham-bong/cau-hinh.ts");
const [STATE, LUOT] = process.argv.slice(2);
const tepKq = join(STATE, LUOT, "ket-qua.jsonl");
if (!existsSync(tepKq)) { console.log(`ĐỎ: không có ${tepKq}`); process.exit(1); }
const { cauHinh } = napCauHinhCham();
const doc = readFileSync(tepKq, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l)).filter((d) => d.loai === "doc");
const cap = new Map();
for (const d of doc) cap.set(`${d.review_id}|${d.model}`, d.khoa);
const kho = moKho(join(STATE, "kho.jsonl"));
const { truy, dong } = await moDocChiDoc(process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest");
try {
  const { the } = await docThe(truy);
  const theoId = new Map(the.map((t) => [t.review_id, t]));
  let trung = 0, roi = 0;
  const thieu = [];
  for (const [k, khoaCu] of cap) {
    const [id, model] = k.split("|");
    const t = theoId.get(Number(id));
    if (!t) { roi++; console.log(`rời hàng: thẻ ${id} × ${model}`); continue; }
    const m = cauHinh.model.find((x) => x.gateway === model);
    const khoaMoi = khoaDung(t, m, cauHinh.prompt_version);
    if (khoaMoi !== khoaCu) thieu.push(`thẻ ${id} × ${model}: khoá mới ${khoaMoi.slice(0, 12)} ≠ khoá lượt 1 ${khoaCu.slice(0, 12)}`);
    else if (!kho.co(khoaMoi)) thieu.push(`thẻ ${id} × ${model}: khoá có ở lượt 1 nhưng không có trong kho`);
    else trung++;
  }
  console.log(`cặp đọc thành công ở lượt ${LUOT}: ${cap.size} · trúng kho ${trung} · rời hàng ${roi} · thiếu ${thieu.length}`);
  for (const x of thieu) console.log(`THIẾU ${x}`);
  if (thieu.length) { console.log(`ĐỎ: ${thieu.length} cặp không dùng lại được`); process.exitCode = 1; }
  else console.log(`XANH: ${trung}/${cap.size - roi} cặp còn trong hàng dùng lại được`);
} finally { await dong(); }
