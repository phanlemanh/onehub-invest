#!/usr/bin/env node
// suite-neu-doi.mjs — chạy một suite của lượt chấm S4 / ghim lại CHỈ khi nhánh đổi vùng của suite đó.
//
//   node scripts/suite-neu-doi.mjs <tên-suite> -- <lệnh>
//
// Tệp đổi = merge-base(origin/main, HEAD)..HEAD ∪ cây làm việc (so HEAD) ∪ tệp chưa theo dõi. Có tệp trong vùng → chạy
// `bash -c <lệnh>` từ gốc kho, trả đúng mã thoát. Không có → in «bỏ qua», thoát 0. Không chắc → CHẠY (bảo thủ):
// không giải được gốc, suite lạ, chỉ đổi _acceptance/ (đường nền đầu vòng), diff rỗng, SUITE_NEU_DOI=chay.
// CI (`ci-test.yml`) vẫn chạy đủ mọi suite trên mọi PR — đây chỉ cắt lượt chấm trên máy.
// Hồ sơ: _acceptance/s4-suite-theo-vung. Bảng vùng đo bằng test canh phủ (scripts/suite-neu-doi.test.mjs, S4V-AC-5).
import { execFileSync, spawnSync } from "node:child_process";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Tệp test của các module đọc tệp của module khác (import, chép fixture, quét cây) — vùng rộng theo đo 10/11.
const LOI_APP = [
  "app/**", "agent/**", "pipeline/**", "scripts/**", "db/**", "data-api/**", "CONTEXT.md",
  ".claude/skills/onehub-ui/**", "docs/architecture/**", "docs/product/**", "docs/ops/**",
  "_acceptance/tap-nhan-mau-ocp1/**",
];

export const VUNG = {
  app: LOI_APP,
  app_ui: LOI_APP,
  ui_lint_rules: ["app/**", "db/**", "CONTEXT.md", ".claude/skills/onehub-ui/**"],
  pipeline: [
    "pipeline/**", "db/**", "scripts/**", "agent/**", "app/**", "collector/src/**", "collector/docs/**",
    "collector/scripts/**", "data-api/src/**", "tools/**", "CONTEXT.md", "LO-TRINH.html", "docs/ROADMAP.md",
    "docs/ops/**",
    "_acceptance/danh-ba-phuong-xa-toan-quoc/**", "_acceptance/gop-tin-chi-anh-o-transform/**",
    "_acceptance/lay-mau-khu-trung-theo-tin/**", "_acceptance/nhom-dang-ky-hai-lan-s03/**",
    "_acceptance/s03-len-cong/**", "_acceptance/tap-nhan-mau-ocp1/**", "_acceptance/truong-nhan-s03-081/**",
  ],
  agent: [
    "agent/**", "db/**", "pipeline/**", "scripts/**", "docs/ops/**",
    "app/src/lib/ops/review-can-cu.ts", "app/src/lib/vocab.generated.ts",
    "app/tests/the-duyet-du-can-cu.test.tsx", "app/tests/the-duyet-phuong-lech-gia.test.tsx",
    "_acceptance/config.yaml", "_acceptance/chon-model-theo-o/**", "_acceptance/the-ghep-can-tin-roi-kho/**",
  ],
  portal_static: ["app/**", "scripts/check-portal-compliance.mjs"],
};

// Mỗi suite còn chạy khi chính bộ lọc đổi — bộ lọc sai thì mọi quyết định sau nó sai.
const CHUNG = ["scripts/suite-neu-doi.mjs"];

const reGlob = (g) =>
  new RegExp("^" + g.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*\*/g, "\u0000").replace(/\*/g, "[^/]*").replace(/\u0000/g, ".*") + "$");

// `x/**` = mọi đường dưới x; không có `*` = khớp nguyên đường.
export function khop(duong, glob) {
  if (glob.endsWith("/**")) return duong.startsWith(glob.slice(0, -2));
  if (!glob.includes("*")) return duong === glob;
  return reGlob(glob).test(duong);
}

export const trongVung = (duong, vung) => vung.some((g) => khop(duong, g));

const tomTat = (vung) => (vung.length <= 4 ? vung.join(", ") : `${vung.slice(0, 4).join(", ")} … (+${vung.length - 4})`);

// Quyết định thuần: { chay, ly_do, kich? }. tep = null nghĩa là không đọc được diff.
export function quyetDinh(ten, tep, { ep = false } = {}) {
  if (ep) return { chay: true, ly_do: "ép chạy (SUITE_NEU_DOI=chay)" };
  const vung = VUNG[ten];
  if (!vung) return { chay: true, ly_do: `suite lạ «${ten}» — không có trong bảng vùng` };
  if (tep === null) return { chay: true, ly_do: "không giải được gốc so sánh — chạy đủ" };
  const ma = tep.filter((t) => !t.startsWith("_acceptance/"));
  // «Chưa có mã»: không tệp nào (ngoài _acceptance/) thuộc vùng của BẤT KỲ suite nào — đầu vòng nhánh mới có hồ sơ,
  // tài liệu thiết kế, kế hoạch; đường nền cần đủ sáu suite.
  const vungHop = [...CHUNG, ...Object.values(VUNG).flat()];
  if (!ma.some((t) => trongVung(t, vungHop))) return { chay: true, ly_do: "chưa có thay đổi mã (không tệp nào thuộc vùng suite nào) — chạy đủ làm nền" };
  const kich = ma.filter((t) => trongVung(t, [...CHUNG, ...vung]));
  const kichAcc = tep.filter((t) => t.startsWith("_acceptance/") && trongVung(t, vung));
  const tatCa = [...kich, ...kichAcc];
  if (tatCa.length) return { chay: true, ly_do: `đổi ${tatCa[0]}${tatCa.length > 1 ? ` (+${tatCa.length - 1} tệp trong vùng)` : ""}`, kich: tatCa };
  return { chay: false, ly_do: `không đổi ${tomTat(vung)} (${ma.length} tệp đổi ngoài vùng)` };
}

const git = (cwd, ...a) => execFileSync("git", a, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });

// Tập tệp đổi của nhánh; null khi không đọc được (không phải kho git, ref gốc vắng…).
export function tepDoi(cwd, base = process.env.SUITE_NEU_DOI_BASE) {
  try {
    const goc = base || "origin/main";
    const mb = git(cwd, "merge-base", goc, "HEAD").trim();
    const dong = [
      git(cwd, "diff", "--name-only", mb, "HEAD"),
      git(cwd, "diff", "--name-only", "HEAD"),
      git(cwd, "ls-files", "--others", "--exclude-standard"),
    ].join("\n");
    // node_modules nối bằng symlink (dung-worktree-cham.sh) không phải thay đổi của nhánh.
    return [...new Set(dong.split("\n").map((s) => s.trim()).filter((s) => s && !/(^|\/)node_modules(\/|$)/.test(s)))].sort();
  } catch {
    return null;
  }
}

function gocKho(cwd) {
  try { return git(cwd, "rev-parse", "--show-toplevel").trim(); } catch { return cwd; }
}

function main(argv) {
  const i = argv.indexOf("--");
  const ten = argv[0];
  if (!ten || ten === "--" || i < 0 || i === argv.length - 1) {
    console.error("dùng: node scripts/suite-neu-doi.mjs <tên-suite> -- <lệnh>");
    return 2;
  }
  const lenh = argv.slice(i + 1).join(" ");
  const goc = gocKho(process.cwd());
  const q = quyetDinh(ten, tepDoi(goc), { ep: process.env.SUITE_NEU_DOI === "chay" });
  if (!q.chay) {
    console.log(`suite-neu-doi: bỏ qua ${ten}: ${q.ly_do}`);
    return 0;
  }
  console.log(`suite-neu-doi: chạy ${ten} — ${q.ly_do}`);
  const r = spawnSync("bash", ["-c", lenh], { cwd: goc, stdio: "inherit" });
  if (r.error) { console.error(`suite-neu-doi: không chạy được bash: ${r.error.message}`); return 127; }
  if (r.signal) { const so = { SIGINT: 2, SIGKILL: 9, SIGTERM: 15 }[r.signal] ?? 1; return 128 + so; }
  return r.status ?? 1;
}

const laLoiVao = (() => { try { return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url)); } catch { return false; } })();
if (laLoiVao) process.exitCode = main(process.argv.slice(2));
