// Dựng bảng chốt thuật ngữ (bang-chot.html) từ terms.mjs.
//   node _acceptance/glossary-context/build.mjs            → chỉ bang-chot.html
//   node _acceptance/glossary-context/build.mjs --context  → thêm CONTEXT.md ở gốc repo
// CONTEXT.md chỉ ghi sau khi Mạnh duyệt bảng chốt (sửa terms.mjs theo câu trả lời trước).
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ALLOW, GEO_SLUG_NOTE, GROUPS, MEASURED, RULE_CHOICES, TERMS } from "./terms.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const COUNTS = JSON.parse(readFileSync(join(HERE, "do-ten-2026-10-23.json"), "utf8"));
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const code = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
const LETTER = ["A", "B", "C"];

function usage(t) {
  const rows = (t.use || []).filter((k) => COUNTS[k]?.total).map((k) => [k, COUNTS[k]]);
  if (!rows.length) return '<span class="muted">—</span>';
  return rows
    .map(([k, c]) => `<span class="u${t.avoid.some((a) => a.toLowerCase() === k.toLowerCase()) ? " bad" : ""}">${esc(k)} <b>${c.total}</b>${c.ui ? ` <i>UI ${c.ui}</i>` : ""}</span>`)
    .join("");
}

function slugCell(t) {
  const parts = [];
  for (const s of t.slug || []) parts.push(`<code class="ok">${esc(s)}</code>`);
  for (const o of t.old || []) parts.push(`<code class="bad">${esc(o.from)}</code> → <code class="ok">${esc(o.to)}</code>`);
  if (t.anchors?.length) parts.push(`<div>neo: ${t.anchors.map((a) => `<code class="ok">#${esc(a)}</code>`).join(" ")}</div>`);
  if (t.params?.length) parts.push(`<div>tham số: ${t.params.map((a) => `<code class="ok">${esc(a)}</code>`).join(" ")}</div>`);
  if (t.slugNote) parts.push(`<div class="muted">${code(t.slugNote)}</div>`);
  return parts.join(" ") || '<span class="muted">—</span>';
}

function choiceBlock(c) {
  return `<div class="choice"><div class="q"><span class="qid">${c.q}</span> ${code(c.title)}</div>${c.options
    .map((o, i) => `<div class="opt${i === c.rec ? " rec" : ""}"><b>${LETTER[i]}</b> ${code(o.label)}${i === c.rec ? ' <span class="badge">khuyến nghị</span>' : ""}<div class="muted">${code(o.note)}</div></div>`)
    .join("")}<div class="why">${code(c.why)}</div></div>`;
}

function html() {
  const choices = [...TERMS.filter((t) => t.choice).map((t) => t.choice), ...RULE_CHOICES].sort((x, y) => +x.q.slice(1) - +y.q.slice(1));
  const reply = choices.map((c) => `${c.q} ${LETTER[c.rec]}`).join(" · ") + " — ___";
  const groups = GROUPS.map(([g, label]) => {
    const rows = TERMS.filter((t) => t.group === g)
      .map((t) => `<tr${t.choice ? ' class="has-choice"' : ""}>
<td><div class="vn">${esc(t.vn)}</div><div class="def">${code(t.def)}</div>${t.note ? `<div class="note">${code(t.note)}</div>` : ""}</td>
<td><code>${code(t.code).replace(/<\/?code>/g, "")}</code><div class="muted">RESO: ${code(t.reso)}</div></td>
<td>${slugCell(t)}</td>
<td>${t.avoid.length ? t.avoid.map((a) => `<span class="av">${esc(a)}</span>`).join(" ") : '<span class="muted">—</span>'}</td>
<td class="use">${usage(t)}</td>
<td>${t.choice ? choiceBlock(t.choice) : '<span class="muted">giữ như cột 1</span>'}</td>
</tr>`)
      .join("\n");
    return `<h2>${esc(label)}</h2><div class="scroll"><table><thead><tr><th>Tên chuẩn (UI tiếng Việt) · định nghĩa</th><th>Tên code</th><th>Slug URL</th><th>Tên bỏ (_Avoid_)</th><th>Đang dùng (số file)</th><th>Khuyến nghị</th></tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join("\n");

  return `<!doctype html>
<html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bảng chốt thuật ngữ</title>
<style>
:root{--bg:#fbfbfa;--fg:#1d1d1b;--muted:#6b6b66;--line:#e4e3df;--card:#fff;--accent:#2f5bd3;--ok:#1d7a46;--bad:#b3261e;--hl:#fff7e0}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#151514;--fg:#ecebe8;--muted:#a19f99;--line:#33322f;--card:#1d1d1c;--accent:#8aa8ff;--ok:#6ccf94;--bad:#ff8a80;--hl:#2b2618}}
:root[data-theme="dark"]{--bg:#151514;--fg:#ecebe8;--muted:#a19f99;--line:#33322f;--card:#1d1d1c;--accent:#8aa8ff;--ok:#6ccf94;--bad:#ff8a80;--hl:#2b2618}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
main{max-width:1280px;margin:0 auto;padding:24px 16px 64px}
h1{font-size:22px;margin:0 0 4px}h2{font-size:16px;margin:32px 0 8px}
.muted{color:var(--muted);font-size:12px}.lead{color:var(--muted);margin:0 0 16px;max-width:760px}
code{font:12px ui-monospace,SFMono-Regular,Menlo,monospace;background:color-mix(in srgb,var(--line) 60%,transparent);padding:1px 4px;border-radius:4px}
code.ok{color:var(--ok)}code.bad{color:var(--bad);text-decoration:line-through}
.scroll{overflow-x:auto;border:1px solid var(--line);border-radius:8px;background:var(--card)}
table{border-collapse:collapse;width:100%;min-width:1080px}th,td{text-align:left;vertical-align:top;padding:10px;border-bottom:1px solid var(--line)}
th{font-size:12px;color:var(--muted);font-weight:600;background:var(--bg)}tr:last-child td{border-bottom:0}
tr.has-choice td{background:var(--hl)}td:first-child{width:28%}td:last-child{width:26%}
.vn{font-weight:600}.def{font-size:13px;margin-top:2px}.note{font-size:12px;color:var(--muted);margin-top:4px}
.av{display:inline-block;font-size:12px;color:var(--bad);border:1px solid color-mix(in srgb,var(--bad) 35%,transparent);border-radius:4px;padding:0 4px;margin:0 2px 2px 0}
.use .u{display:block;font-size:12px}.use .u.bad{color:var(--bad)}.use i{color:var(--muted);font-style:normal}
.choice .q{font-weight:600;margin-bottom:4px}.qid{color:var(--accent)}.opt{font-size:13px;padding:4px 0}.opt.rec b{color:var(--accent)}
.badge{font-size:11px;color:var(--accent);border:1px solid var(--accent);border-radius:999px;padding:0 6px}.why{font-size:12px;margin-top:4px;color:var(--muted)}
.box{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:16px;margin:16px 0}
.box ol,.box ul{margin:4px 0 0;padding-left:20px}pre{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px;overflow-x:auto;font:13px ui-monospace,Menlo,monospace}
</style></head><body><main>
<h1>Bảng chốt thuật ngữ onehub-invest</h1>
<p class="lead">Mỗi khái niệm một hàng: tên tiếng Việt trên UI, tên code (RESO khi có), slug URL tiếng Anh, các tên bỏ và số file đang dùng từng tên. Hàng tô vàng có hai lựa chọn hợp lý — Mạnh chọn. Duyệt xong máy mới ghi <code>CONTEXT.md</code> bản chính thức. Đo ${esc(MEASURED)}: số file chứa tên (không phân biệt hoa thường) trong app/src, agent, pipeline, db/migrations, data-api/src, docs/architecture, ROADMAP, AGENTS.md; “UI” = app/src/app + components (bỏ components/ui, reui). Tên đỏ = tên sẽ bỏ.</p>

<div class="box"><b>Cần Mạnh trả lời ${choices.length} câu</b> (Q6 — đích của <code>/dau-tu</code> — Mạnh đã chốt gộp vào <code>/yield</code>; Q9 mới thêm từ danh sách của phiên Bản đồ đích Invest) — chép dòng dưới, sửa chữ cái nào nghĩ khác, rồi điền ô cuối bằng “duyệt” hoặc ghi chỗ cần sửa:
<pre>${esc(reply)}</pre>
${RULE_CHOICES.map(choiceBlock).join("")}</div>

<div class="box"><b>Luật đặt tên sẽ ghi vào AGENTS.md › Quy ước</b> (thay câu “URL ASCII không dấu (slugifyName())”):
<ul>
<li>Code, API, tên bảng/cột: tiếng Anh; field/enum dữ liệu theo RESO Data Dictionary khi có (ADR-0011).</li>
<li>Chữ UI tiếng Việt, lấy nhãn từ <code>CONTEXT.md</code>; khái niệm chưa có trong đó thì thêm term trước khi viết nhãn.</li>
<li><b>URL tiếng Anh toàn bộ</b>: ASCII, kebab-case, mỗi đoạn tĩnh nằm trong danh sách slug của <code>CONTEXT.md</code>. ${code(GEO_SLUG_NOTE)}</li>
<li>Đổi slug cũ phải kèm redirect vĩnh viễn trong <code>app/next.config.ts</code>, làm trong đợt dọn của nhóm trang đó (không đổi lẻ).</li>
<li>Máy kiểm: <code>app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs</code> — đỏ khi thêm đoạn URL ngoài danh sách, khi ngoại lệ quá hạn, khi đổi slug mà thiếu redirect.</li>
</ul></div>

${groups}

<div class="box"><b>Phát hiện khi quét (không sửa ở đây — ghi thành việc tiếp theo)</b>
<ol>
<li>Tên nguồn thật trên cổng Invest: <code>/listing/[id]</code> “Xem trên Airbnb ↗”, “Giá một đêm trên Airbnb”; <code>booking-heatmap.tsx</code> “…trên Airbnb.” — SPL nói UI chỉ ghi nhãn tầng C. Cần Mạnh quyết: link ra nền tảng gốc có được phép không.</li>
<li>Ops ghi tên thật thay mã: <code>/ops/collections</code> “Airbnb — listing tươi” (nên là S01).</li>
<li>Route API mang tên nguồn thật: <code>/api/zalo-media</code>, <code>/api/v1/ops/zalo/*</code> — ngoài phạm vi test trang; nên dời sang mã/tên chức năng khi đụng tới.</li>
<li>Chữ lẫn tiếng Anh trên UI: “Yield ngắn hạn/dài hạn” (<code>/so-sanh</code>), “cho market này” (<code>investment-simulator.tsx</code>), tiêu đề <code>/ops/review</code> “Review Queue”.</li>
<li><code>portals.md</code> §4 “Thuật ngữ cố định” ghi Occupancy/Yield tiếng Anh — sẽ thay bằng trỏ tới <code>CONTEXT.md</code>. <code>invest-portal-ia.md</code> liệt <code>so-sanh</code> là từ khoá dành riêng của <code>[submarket]</code> — sai: <code>/so-sanh</code> ở gốc; từ khoá thật là <code>listings</code>, <code>map</code>, <code>dau-tu</code>.</li>
</ol></div>
</main></body></html>
`;
}

function contextMd() {
  const blocks = GROUPS.map(([g, label]) => {
    const terms = TERMS.filter((t) => t.group === g).map((t) => {
      const meta = [`Code: \`${t.code.replace(/`/g, "")}\``, `RESO: ${t.reso}`];
      const lines = [`**${t.vn}**: ${t.def}`, `- ${meta.join(" · ")}`];
      if (t.slug?.length) lines.push(`- Slug URL: ${t.slug.map((s) => `\`${s}\``).join(" · ")}`);
      if (t.anchors?.length) lines.push(`- Neo URL: ${t.anchors.map((s) => `\`#${s}\``).join(" · ")}`);
      if (t.params?.length) lines.push(`- Tham số URL: ${t.params.map((s) => `\`${s}\``).join(" · ")}`);
      for (const o of t.old || []) lines.push(`- Slug cũ: \`${o.from}\` → \`${o.to}\`${o.note ? ` (${o.note})` : ""}`);
      if (t.note) lines.push(`- Ghi chú: ${t.note}`);
      if (t.avoid.length) lines.push(`_Avoid_: ${t.avoid.join(", ")}`);
      return lines.join("\n");
    });
    return `## ${label}\n\n${terms.join("\n\n")}`;
  });
  return `# CONTEXT — ngôn ngữ chuẩn onehub-invest

> Bộ từ vựng chung cho UI, code, tài liệu và tiêu chí nghiệm thu. Mạnh duyệt ${"__DATE__"}
> (bảng chốt: \`_acceptance/glossary-context/bang-chot.html\`). Bối cảnh sản phẩm:
> \`docs/product/CONTEXT-PRODUCT.md\`. Luật đặt tên: \`AGENTS.md\` › Quy ước.

Cách đọc — mỗi khối một thuật ngữ:

- Dòng in đậm là **nhãn tiếng Việt chuẩn** — chữ dùng trên UI, trong văn xuôi và trong tiêu chí
  \`_acceptance/*/contract.md\`. Tên code/API/route đặt trong \`backtick\` (máy đọc bỏ qua code span).
- \`Code\` là tên tiếng Anh trong code; \`RESO\` là field/resource Data Dictionary 2.0 tương ứng
  (ADR-0011, \`pipeline/mappings.yaml\`).
- \`Slug URL\` là đoạn URL tiếng Anh của trang. Test \`app/eslint-plugin-onehub-ui/tests/route-slugs.test.mjs\`
  đòi mọi đoạn tĩnh của route nằm trong các dòng này. ${GEO_SLUG_NOTE}
- \`Neo URL\` (đoạn \`#…\`) và \`Tham số URL\` (\`?…=\`) cũng tiếng Anh; tham số camelCase theo tên code.
- \`Slug cũ\` là route tiếng Việt còn chạy — đổi sang slug đích trong đợt dọn của nhóm trang, kèm
  redirect vĩnh viễn trong \`app/next.config.ts\`.
- \`_Avoid_\` liệt tên lệch đã loại. Kit nghiệm thu đọc dòng này: lint W6 cảnh báo khi tiêu chí của
  hợp đồng dùng tên bị loại. Thêm thuật ngữ mới: thêm khối ở đây cùng commit với nhãn/route mới.

_Allow_: ${ALLOW.join(", ")}

${blocks.join("\n\n")}
`;
}

writeFileSync(join(HERE, "bang-chot.html"), html());
console.log("ghi", join(HERE, "bang-chot.html"));
if (process.argv.includes("--context")) {
  const date = process.argv.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a)) || new Date().toISOString().slice(0, 10);
  const i = process.argv.indexOf("--out");
  const out = i > 0 ? process.argv[i + 1] : join(ROOT, "CONTEXT.md"); // --out <file>: bản nháp để thử parser
  writeFileSync(out, contextMd().replace("__DATE__", date));
  console.log("ghi", out);
}
