#!/usr/bin/env node
/**
 * bench-gate.mjs — C3 prep: đo chất lượng CỔNG CHẶN (decision model) trước
 * khi gặp tin Zalo thật (ADR-0007: "validate threshold trên mẫu đại diện").
 *
 * Lớp dương: mọi item zalo-mock (đều là tin rao BĐS — kể cả thiếu trường).
 * Lớp âm: tin chat/xã giao nhóm tổng hợp (C3 sẽ gặp thật) — mock không có.
 *
 * Gọi Kev (System One API :8009) câu hỏi "noul" (boolean probability):
 *   "Đây có phải tin rao BĐS (bán/cho thuê/ mua)?" — sweep ngưỡng, in
 *   recall (dương) / fallout (âm) để chọn ngưỡng: recall ≥ 0.95 là ràng buộc,
 *   fallout thấp越好. Kèm choice kind (sale|rent_lt|other) so gt.
 *
 * Env: KEV_URL (default http://127.0.0.1:8009) · BENCH_LIMIT (giới hạn dương)
 */
import { gunzipSync } from "node:zlib";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const KEV_URL = process.env.KEV_URL ?? "http://127.0.0.1:8009";
const LIMIT = Number(process.env.BENCH_LIMIT ?? 0);

// ---- Lớp âm: hội thoại nhóm môi giới VN (không phải tin rao) ----
const NEG_TEMPLATES = [
  "Chào cả nhà, chúc mọi người ngày mới tốt lành ạ",
  "Ai biết thợ sửa điều hòa ở Cầu Giấy không chỉ em với",
  "Cảm ơn bác nhiều ạ, để em xem lại",
  "Group có ai đi xem bóng tối nay không ạ?",
  "Cần tìm người cho thuê xe máy tháng, bạn nào biết inbox em",
  "Chia sẻ: lãi suất vay mua nhà vừa giảm nhẹ rồi mọi người ạ",
  "Hi cả nhà, em mới vào nhóm, cho em làm quen ạ",
  "Bán аккаунt game giá rẻ, ai cần pm",
  "Sáng nay giao thông Nguyễn Trãi kẹt xe kinh khủng quá",
  "Ad ơi cho em hỏi phí environment group bao nhiêu ạ",
  "Cảm ơn thông tin, để em liên hệ với khách thử ạ",
  "Ngủ ngon cả nhà 🌙",
  "Cho em hỏi ngoài lúa: trường quốc tế gần Mỹ Đình nào tốt ạ?",
  "Vừa xem xong trận bóng, hay quá trời",
  "Bác nào có link nhóm subdivision khác cho em xin với",
  "Dạo này thị trường hơi chậm nhỉ các bác",
  "Em cảm ơn bác đã chia sẻ kinh nghiệm ạ",
  "Tối nay nhóm họp offline không mọi người?",
  "Ai bán cây cảnh không ạ, em cần mua vài chậu",
  "Nhắc nhở: không đăng tin quảng cáo sai chuyên mục nhé cả nhà",
];
const NEG = [];
for (let i = 0; i < 200; i++) NEG.push(NEG_TEMPLATES[i % NEG_TEMPLATES.length]);

// ---- Lớp dương: mock gt ----
const root = process.env.SNAPSHOT_ROOT ?? "../collector/snapshots/hanoi";
const dirs = readdirSync(root).filter((d) => d.startsWith("hanoi__zalo-mock__")).sort();
let snapId = null;
let positives = [];
for (const d of [...dirs].reverse()) {
  const files = readdirSync(join(root, d)).filter((f) => f.startsWith("items-"));
  const items = files.flatMap((f) => JSON.parse(gunzipSync(readFileSync(join(root, d, f))).toString()));
  const withGt = items.filter((i) => i.meta?.gt);
  if (withGt.length) { positives = withGt; snapId = d; break; }
}
if (LIMIT > 0) positives = positives.slice(0, LIMIT);
if (!positives.length) { console.error("không có mẫu dương (chạy zalo-mock trước)"); process.exit(1); }
console.log(`dương: ${positives.length} (${snapId}) · âm: ${NEG.length}`);

const QUESTION = {
  is_bds: {
    type: "noul",
    instructions: "Đây có phải là tin rao bất động sản (bán/cho thuê/mua nhà, đất, chung cư) trong nhóm Zalo?",
    criteria: {
      true: "Tin đăng rao bán, cho thuê, hoặc tìm mua BĐS, có thể kèm giá/diện tích/địa điểm",
      false: "Trò chuyện, chào hỏi, hỏi đáp, cảm ơn, tin tức, quảng cáo khác chủ đề",
    },
  },
  kind: {
    type: "choice",
    instructions: "Nếu là tin rao BĐS, loại tin là gì?",
    criteria: {
      sale: "Rao bán hoặc tìm mua",
      rent_lt: "Cho thuê hoặc tìm thuê dài hạn",
      other: "Không phải tin rao BĐS hoặc không xác định",
    },
  },
};

async function decide(text) {
  const res = await fetch(`${KEV_URL}/v1/systemone`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: text, model: "kev-latest", questions: QUESTION }),
  });
  if (!res.ok) throw new Error(`kev ${res.status}: ${await res.text()}`);
  const r = await res.json();
  return { p: r.answers.is_bds.noul, kind: r.answers.kind.choice };
}

const rows = [];
let t0 = Date.now();
let n = 0;
for (const text of [...positives.map((p) => ({ text: p.payload.text, label: true, gt: p.meta.gt.kind })), ...NEG.map((t) => ({ text: t, label: false, gt: null }))]) {
  try {
    const { p, kind } = await decide(text.text);
    rows.push({ ...text, p, kind });
  } catch (e) {
    console.error("FAIL:", e.message); process.exit(1);
  }
  if (++n % 100 === 0) console.log(`  …${n}/${rows.length + 0} (${((Date.now() - t0) / n).toFixed(0)}ms/call)`);
}
const msPerCall = (Date.now() - t0) / rows.length;

// ---- Sweep ngưỡng ----
console.log(`\n${msPerCall.toFixed(0)} ms/call — sweep ngưỡng probabilityTrue:`);
console.log("threshold | recall(dương) | fallout(âm) | accuracy");
for (const th of [0.3, 0.5, 0.7, 0.9, 0.95]) {
  const tp = rows.filter((r) => r.label && r.p >= th).length;
  const fp = rows.filter((r) => !r.label && r.p >= th).length;
  const rec = tp / positives.length, fall = fp / NEG.length;
  const acc = (tp + NEG.length - fp) / rows.length;
  console.log(`   ${th.toFixed(2)}   |     ${(rec * 100).toFixed(1)}%     |    ${(fall * 100).toFixed(1)}%    |  ${(acc * 100).toFixed(1)}%`);
}

// ---- kind accuracy trên dương (bỏ other) ----
const posRows = rows.filter((r) => r.label);
const kindOk = posRows.filter((r) => r.kind === r.gt).length;
console.log(`\nkind (sale/rent_lt) đúng: ${(100 * kindOk / posRows.length).toFixed(1)}% (${kindOk}/${posRows.length})`);

// ---- Gợi ý ngưỡng: nhỏ nhất thoả recall ≥ 0.95 ----
for (const th of [0.5, 0.6, 0.7, 0.8, 0.9, 0.95]) {
  const tp = rows.filter((r) => r.label && r.p >= th).length;
  if (tp / positives.length >= 0.95) {
    const fp = rows.filter((r) => !r.label && r.p >= th).length;
    console.log(`→ khuyến nghị ngưỡng ${th} (recall ≥95%, fallout ${(100 * fp / NEG.length).toFixed(1)}%)`);
    break;
  }
}
