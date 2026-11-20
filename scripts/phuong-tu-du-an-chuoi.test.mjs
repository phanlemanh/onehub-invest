// node --test scripts/phuong-tu-du-an-chuoi.test.mjs
// Hồ sơ phuong-tu-du-an-chay-that (DA45) AC-1: bước phuong-tu-du-an của chuỗi nạp S03 (scripts/zalo-import-daily.sh) đứng ngay sau
// transform-zalo, trước transform-media, gọi với --ghi --noi-tiep, ở cả lượt nhanh 15′ lẫn lượt 00:00. Khuôn
// scripts/zalo-import-job-nhe.test.mjs: chép NGUYÊN tệp bọc thật + job-step.sh vào cây tạm, `node` giả đầu PATH ghi nhãn bước và đối
// số. Ca khoá thật: bước phuong-tu-du-an chạy bằng node THẬT trên một DB tạm riêng (lược đồ tối thiểu), một phiên thứ hai giữ khoá
// bảng phát biểu — lượt nhanh phải in BỎ LƯỢT. Chiều đỏ: bản chép tệp bọc bỏ dòng bước, cùng cây tạm, cùng node giả.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { after, test } from "node:test";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = "scripts/zalo-import-daily.sh";
const THAT = readFileSync(path.join(REPO, SCRIPT), "utf8");
const BUOC = "phuong-tu-du-an";
const LENH_BUOC = "pipeline/scripts/phuong-tu-du-an.mjs";
const SCRATCH = mkdtempSync(path.join(realpathSync(tmpdir()), "pct-chuoi-"));
after(() => rmSync(SCRATCH, { recursive: true, force: true }));

const SNAP = "collector/snapshots/hanoi/hanoi__zalo-agent__2026-10-25T000000Z";
const STATE = "pipeline/logs/apify-daily.state";
const DOC_GOP = "pipeline/doc-gop-hang-ngay.sh";

// node giả: ghi «nhãn|đối số»; bước tên trong THAT_BUOC chạy bằng node thật (REAL_NODE); FAIL_STEPS như zalo-import-job-nhe.
const NODE_SHIM = `#!/bin/bash
step=node
for a in "$@"; do case "$a" in *.mjs|*.js|*.ts) step="$(basename "$a")"; step="\${step%.*}"; break;; esac; done
echo "$step|$*" >> "$SEEN"
if [ -n "\${THAT_BUOC:-}" ] && [ "$step" = "$THAT_BUOC" ]; then exec "$REAL_NODE" "$@"; fi
IFS=',' read -ra items <<< "\${FAIL_STEPS:-}"
for it in "\${items[@]}"; do
  IFS=':' read -r name c kieu <<< "$it"
  if [ "$name" = "$step" ]; then
    case "$kieu" in khoa) echo "error: canceling statement due to lock timeout" >&2;; *) echo "Error: boom ($step)" >&2;; esac
    exit "$c"
  fi
done
exit 0
`;

function cay(noiDung = THAT) {
  const root = mkdtempSync(path.join(SCRATCH, "cay-"));
  for (const rel of [SCRIPT, "scripts/lib/job-step.sh"]) {
    mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    copyFileSync(path.join(REPO, rel), path.join(root, rel));
  }
  writeFileSync(path.join(root, SCRIPT), noiDung);
  mkdirSync(path.join(root, SNAP), { recursive: true });
  writeFileSync(path.join(root, SNAP, "manifest.json"), "{}\n");
  mkdirSync(path.join(root, "pipeline/logs"), { recursive: true });
  mkdirSync(path.join(root, "pipeline/scripts"), { recursive: true });
  // Lệnh thật (symlink: node giải đường thật nên ../lib và pg của pipeline/ vẫn tìm thấy).
  symlinkSync(path.join(REPO, LENH_BUOC), path.join(root, LENH_BUOC));
  mkdirSync(path.join(root, "agent"));
  writeFileSync(path.join(root, DOC_GOP), '#!/bin/bash\nexec node "$(dirname "$0")/doc-gop-hang-ngay.mjs"\n');
  const bin = path.join(root, ".shim-bin");
  mkdirSync(bin);
  writeFileSync(path.join(bin, "node"), NODE_SHIM);
  chmodSync(path.join(bin, "node"), 0o755);
  writeFileSync(path.join(bin, "sleep"), "#!/bin/bash\nexit 0\n");
  chmodSync(path.join(bin, "sleep"), 0o755);
  mkdirSync(path.join(root, ".home"));
  return root;
}

function chay(root, { nhanh = true, fail = "", env = {} } = {}) {
  writeFileSync(path.join(root, STATE), "2026-10-24T000000Z");
  const seen = path.join(root, ".seen");
  writeFileSync(seen, "");
  const r = spawnSync("/bin/bash", [path.join(root, SCRIPT), ...(nhanh ? ["--luot-nhanh"] : [])], {
    cwd: root, encoding: "utf8", timeout: 120_000,
    env: {
      PATH: `${path.join(root, ".shim-bin")}:/usr/bin:/bin`, HOME: path.join(root, ".home"),
      DATABASE_URL: "postgres://127.0.0.1:9/khong-co", SEEN: seen, FAIL_STEPS: fail, REAL_NODE: process.execPath, ...env,
    },
  });
  const dong = readFileSync(seen, "utf8").split("\n").filter(Boolean).map((l) => {
    const i = l.indexOf("|");
    return { buoc: l.slice(0, i), args: l.slice(i + 1) };
  });
  return { code: r.status, out: `${r.stdout}${r.stderr}`, calls: dong.map((d) => d.buoc), args: Object.fromEntries(dong.map((d) => [d.buoc, d.args])) };
}

/** Lời hứa thứ tự của AC-1 ở một lượt; trả thông điệp lỗi đầu tiên hay null. */
function loiThuTu(r, ten) {
  const i = r.calls.indexOf(BUOC);
  if (i < 0) return `PCT-AC-1 [${ten}] thiếu bước ${BUOC}`;
  if (r.calls[i - 1] !== "transform-zalo") return `PCT-AC-1 [${ten}] ${BUOC} không đứng ngay sau transform-zalo: ${r.calls.join(" → ")}`;
  if (r.calls[i + 1] !== "transform-media") return `PCT-AC-1 [${ten}] ${BUOC} không đứng ngay trước transform-media: ${r.calls.join(" → ")}`;
  if (!/(^| )--ghi( |$)/.test(r.args[BUOC]) || !/(^| )--noi-tiep( |$)/.test(r.args[BUOC])) return `PCT-AC-1 [${ten}] ${BUOC} thiếu --ghi --noi-tiep: ${r.args[BUOC]}`;
  return null;
}
function kiemThuTu(noiDung) {
  for (const [ten, nhanh] of [["nhanh", true], ["00:00", false]]) {
    const r = chay(cay(noiDung), { nhanh });
    assert.equal(r.code, 0, r.out.slice(-800));
    const loi = loiThuTu(r, ten);
    if (loi) return loi;
  }
  return null;
}

test("PCT-AC-1 phuong-tu-du-an chạy --ghi --noi-tiep ngay sau transform-zalo, trước transform-media, ở hai lượt", () => {
  assert.equal(kiemThuTu(THAT), null);
});

test("PCT-AC-1 chiều đỏ: bản chép bỏ dòng bước thì ca đỏ gọi tên bước thiếu", () => {
  const bo = THAT.replace(/^buoc zalo-import-daily phuong-tu-du-an .*$/m, ":");
  assert.notEqual(bo, THAT, "đột biến không khớp dòng bước trong tệp bọc");
  assert.match(kiemThuTu(bo), /PCT-AC-1 \[nhanh\] thiếu bước phuong-tu-du-an/);
  const sai = THAT.replace(/^(buoc zalo-import-daily phuong-tu-du-an .*) --noi-tiep$/m, "$1");
  assert.notEqual(sai, THAT, "đột biến không khớp cờ --noi-tiep");
  assert.match(kiemThuTu(sai), /thiếu --ghi --noi-tiep/);
});

test("PCT-AC-1 bước lỗi ở hai lượt: job khác 0, các bước sau vẫn chạy", () => {
  for (const [ten, nhanh] of [["nhanh", true], ["00:00", false]]) {
    const r = chay(cay(), { nhanh, fail: `${BUOC}:4:boom` });
    assert.notEqual(r.code, 0, `PCT-AC-1 [${ten}] bước lỗi mà job thoát 0`);
    assert.match(r.out, new RegExp(`JOB FAIL \\[zalo-import-daily\\] bước ${BUOC} mã 4`), `PCT-AC-1 [${ten}] thiếu dòng JOB FAIL`);
    for (const sau of ["transform-media", "refresh-bait-gap", "xep-hang-gia"]) {
      assert.ok(r.calls.includes(sau), `PCT-AC-1 [${ten}] ${sau} không chạy sau khi ${BUOC} lỗi`);
    }
  }
});

test("PCT-AC-1 lượt 00:00: bước báo lỗi khoá thì job khác 0, không in BỎ LƯỢT", () => {
  const r = chay(cay(), { nhanh: false, fail: `${BUOC}:1:khoa` });
  assert.notEqual(r.code, 0, "PCT-AC-1 [00:00] lỗi khoá mà job thoát 0");
  assert.doesNotMatch(r.out, /BỎ LƯỢT/, "PCT-AC-1 [00:00] lượt 00:00 không được bỏ lượt");
});

test("PCT-AC-1 khoá THẬT ở phiên thứ hai: lượt nhanh in BỎ LƯỢT, không tính vào mã thoát; lượt 00:00 thoát khác 0 vì lock timeout", async () => {
  const pg = createRequire(path.join(REPO, "pipeline/package.json"))("pg");
  const mayChu = (process.env.DATABASE_URL ?? "postgres://oneinvest:oneinvest@localhost:5433/oneinvest").replace(/\/[^/?]+(\?.*)?$/, "");
  const ten = `oneinvest_pct_khoa_${process.pid}`;
  const qt = new pg.Client({ connectionString: `${mayChu}/postgres` });
  await qt.connect();
  try {
    await qt.query(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`);
    await qt.query(`CREATE DATABASE ${ten}`);
    const giu = new pg.Client({ connectionString: `${mayChu}/${ten}` });
    await giu.connect();
    try {
      // Lược đồ tối thiểu đủ qua bước kiểm DB của lệnh (bảng, ràng buộc trường, hàm phường của 099).
      await giu.query(`CREATE TABLE field_assertions (rule_id text, retracted_at timestamptz, field text,
        CONSTRAINT field_assertions_field_chk CHECK (field IN ('project_node_id', 'area_id')))`);
      await giu.query("CREATE FUNCTION resolve_offer_area_du_an(text[]) RETURNS integer LANGUAGE sql AS 'SELECT 0'");
      // Đối chứng dương: không ai giữ khoá thì bước chạy thật xong, in câu chốt lượt đầu (DB chưa có phát biểu).
      const ok = chay(cay(), { env: { THAT_BUOC: BUOC, DATABASE_URL: `${mayChu}/${ten}` } });
      assert.equal(ok.code, 0, ok.out.slice(-800));
      assert.match(ok.out, /chưa áp lượt đầu/, "PCT-AC-1 đối chứng: bước thật không chạy tới câu chốt");
      await giu.query("BEGIN");
      await giu.query("LOCK TABLE field_assertions IN ACCESS EXCLUSIVE MODE");
      const r = chay(cay(), { env: { THAT_BUOC: BUOC, DATABASE_URL: `${mayChu}/${ten}`, S03_NHANH_LOCK_TIMEOUT: "1s" } });
      // Lượt 00:00, cùng khoá thật: không có PGOPTIONS, bước tự đặt trần chờ (PTD_LOCK_TIMEOUT, mặc định 10 phút) nên thoát khác 0
      // vì lock timeout chứ không chờ mãi (S4-r2). Thiếu trần thì lệnh treo tới hạn 120 giây của spawnSync: mã null, không có
      // dòng «lock timeout» — ca đỏ.
      const d = chay(cay(), { nhanh: false, env: { THAT_BUOC: BUOC, DATABASE_URL: `${mayChu}/${ten}`, PTD_LOCK_TIMEOUT: "1s" } });
      await giu.query("ROLLBACK");
      assert.ok(Number.isInteger(d.code) && d.code !== 0, `PCT-AC-1 [00:00] khoá thật: job phải thoát khác 0 (được ${d.code}):\n${d.out.slice(-800)}`);
      assert.match(d.out, /lock timeout/, "PCT-AC-1 [00:00] khoá thật: bước không dừng vì lock timeout");
      assert.match(d.out, new RegExp(`JOB FAIL \\[zalo-import-daily\\] bước ${BUOC} mã`), "PCT-AC-1 [00:00] khoá thật: thiếu dòng JOB FAIL");
      assert.doesNotMatch(d.out, /BỎ LƯỢT/, "PCT-AC-1 [00:00] khoá thật: lượt 00:00 không được bỏ lượt");
      assert.ok(d.calls.includes("transform-media"), "PCT-AC-1 [00:00] khoá thật: bước sau không chạy");
      assert.equal(r.code, 0, `PCT-AC-1 khoá thật làm lượt nhanh thoát ${r.code}:\n${r.out.slice(-800)}`);
      assert.match(r.out, new RegExp(`BỎ LƯỢT \\[zalo-import-daily\\] bước ${BUOC}: đụng khoá`), "PCT-AC-1 khoá thật không ra BỎ LƯỢT");
      assert.ok(r.calls.includes("transform-media"), "PCT-AC-1 bước sau không chạy khi bước phường bị bỏ lượt");
    } finally {
      await giu.end().catch(() => {});
    }
  } finally {
    await qt.query(`DROP DATABASE IF EXISTS ${ten} WITH (FORCE)`).catch(() => {});
    await qt.end();
  }
});
