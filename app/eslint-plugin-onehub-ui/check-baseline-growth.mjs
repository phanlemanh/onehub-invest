// Chặn baseline eslint-suppressions.json TĂNG (chỉ được giảm, spec §2 G2 / A4).
// `eslint --suppress-rule` / `--suppress-all` làm xanh lint bằng cách nâng số đếm; script này so
// tổng số đếm theo từng luật giữa bản nền (nhánh đích) và bản hiện tại. Đổi tên/dời file giữ
// nguyên số đếm thì không tính là tăng vì so theo tổng của luật, không theo khoá file.
//
// Dùng: node check-baseline-growth.mjs <base.json> <head.json>
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** Tổng số đếm theo luật, cộng dồn qua mọi file. */
export function totalsByRule(json) {
  const totals = {};
  for (const rules of Object.values(json ?? {})) {
    for (const [rule, info] of Object.entries(rules ?? {})) {
      totals[rule] = (totals[rule] ?? 0) + (info?.count ?? 0);
    }
  }
  return totals;
}

/** Các luật có tổng số đếm ở head cao hơn base (luật mới xuất hiện ở head tính là tăng). */
export function compareBaselines(baseJson, headJson) {
  const base = totalsByRule(baseJson);
  const head = totalsByRule(headJson);
  const grown = [];
  for (const rule of Object.keys(head).sort()) {
    const b = base[rule] ?? 0;
    if (head[rule] > b) grown.push({ rule, base: b, head: head[rule] });
  }
  return grown;
}

function main(argv) {
  const [basePath, headPath] = argv;
  if (!basePath || !headPath) {
    console.error("Cách dùng: node check-baseline-growth.mjs <base.json> <head.json>");
    return 2;
  }
  if (!existsSync(headPath)) return 0; // head bị xoá = baseline rỗng, không thể tăng
  const head = JSON.parse(readFileSync(headPath, "utf8"));
  let base;
  if (!existsSync(basePath) || readFileSync(basePath, "utf8").trim() === "") {
    console.log("Chưa có baseline ở nhánh đích (lần đầu đưa baseline vào): bỏ qua so sánh.");
    base = head;
  } else {
    base = JSON.parse(readFileSync(basePath, "utf8"));
  }
  const grown = compareBaselines(base, head);
  for (const g of grown) console.error(`onehub-ui baseline tăng: ${g.rule} ${g.base} → ${g.head}`);
  if (grown.length) {
    console.error("Baseline chỉ được giảm. Sửa vi phạm, hoặc dùng ngoại lệ có lý do thay vì --suppress-*.");
    return 1;
  }
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
