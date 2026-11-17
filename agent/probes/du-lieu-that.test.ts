// du-lieu-that.test.ts — hồ sơ l2-bao-thu-doi-probe-that: mục B5 «Probe dữ liệu thật» của audit-all chạy được hai nhánh
// (PT-AC-8), và agent/probes nằm trong tsconfig (PT-AC-9). Chạy ở executors.test.probe_du_lieu_that (ngoài suite chung).
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const AGENT = join(import.meta.dirname, "..");
const GOC_KHO = join(AGENT, "..");
const SCRIPT = join(GOC_KHO, "scripts/probe-du-lieu-that.sh");
const TEN = ["khong-dau-that", "judge-luat-that", "context-resolver-that", "the-duyet-phuong-that"];

// Nhãn riêng của lượt này cho tệp tạm (PROBE_NHAN_TAM, xem agent/probes/chung.ts): ca khác chạy song song cùng worktree
// (vd judge-entity-duong tạo `.cd-<pid>-*`) không làm phép đếm nhiễu — sự cố lượt chấm r1.
const NHAN = `pt${process.pid}x-`;
function chay(env: Record<string, string>): { ma: number; ra: string } {
  try {
    return { ma: 0, ra: execFileSync("bash", [SCRIPT], { env: { ...process.env, PROBE_NHAN_TAM: NHAN, ...env }, encoding: "utf8", timeout: 600_000 }) };
  } catch (e) {
    const x = e as { status?: number; stdout?: string };
    return { ma: x.status ?? -1, ra: String(x.stdout ?? "") };
  }
}
const THU_MUC_TAM = [join(AGENT, "src/agents"), join(GOC_KHO, "app/probes")];
const tepTam = () => THU_MUC_TAM.flatMap((d) => readdirSync(d).filter((f) => f.startsWith(".") && f.includes(`-${NHAN}`)));
/** Mục B5: gọi scripts/probe-du-lieu-that.sh trong nhánh if/then pass/else fail. */
function kiemAuditAll(noi: string) {
  assert.ok(noi.includes("probe-du-lieu-that.sh") && /Probe dữ liệu thật/.test(noi), "PT-AC-8 audit-all thiếu mục Probe dữ liệu thật");
  assert.ok(/if [^\n]*probe-du-lieu-that\.sh[^\n]*then pass[^\n]*else fail/.test(noi), "PT-AC-8 mục Probe dữ liệu thật không đổi mã thoát thành pass/fail");
}

test("PT-AC-8 mục Probe dữ liệu thật chạy hai nhánh", (t) => {
  if (process.env.CI) return t.skip("cần DB máy thu có tin thật — CI chỉ có lược đồ");
  const audit = readFileSync(join(GOC_KHO, "scripts/audit-all.sh"), "utf8");
  kiemAuditAll(audit);
  assert.throws(() => kiemAuditAll(audit.split("\n").filter((l) => !l.includes("probe-du-lieu-that.sh")).join("\n")), /PT-AC-8 audit-all thiếu mục Probe dữ liệu thật/);
  // Đối chứng dương của phép đếm: một tệp mang nhãn của lượt (đúng khuôn tên chung.ts sinh) phải được đếm.
  const mau = join(AGENT, "src/agents", `.kd-${NHAN}0-0.ts`);
  writeFileSync(mau, "");
  try {
    assert.deepEqual(tepTam(), [`.kd-${NHAN}0-0.ts`], "PT-AC-8 phép đếm tệp tạm không nhận ra tệp mang nhãn");
  } finally {
    rmSync(mau, { force: true });
  }
  const sach = chay({});
  assert.equal(sach.ma, 0, `PT-AC-8 nhánh sạch thoát ${sach.ma}: ${sach.ra}`);
  const dong = sach.ra.trim().split("\n");
  assert.deepEqual(dong.map((l) => l.split(" ")[0]), ["✅", "✅", "✅", "✅"], `PT-AC-8 nhánh sạch không đủ bốn dòng ✅: ${sach.ra}`);
  for (const ten of TEN) assert.ok(dong.some((l) => l.startsWith(`✅ ${ten}`)), `PT-AC-8 thiếu dòng của ${ten}`);
  const hong = chay({ PROBE_GIA_DO: "judge-luat-that" });
  assert.equal(hong.ma, 1, `PT-AC-8 nhánh giả đỏ thoát ${hong.ma}: ${hong.ra}`);
  const loi = hong.ra.trim().split("\n").filter((l) => l.startsWith("❌"));
  assert.equal(loi.length, 1, `PT-AC-8 nhánh giả đỏ phải đúng một dòng ❌: ${hong.ra}`);
  assert.match(loi[0], /^❌ judge-luat-that: .*PROBE_GIA_DO/, "PT-AC-8 dòng ❌ không gọi đúng tên tệp");
  assert.deepEqual(tepTam(), [], "PT-AC-8 lượt script để lại tệp đột biến");
  t.diagnostic(`PT-AC-8: ${dong.join(" | ")} · ${loi[0]}`);
});

test("PT-AC-9 tsconfig kiểm agent/probes", (t) => {
  const cfg = JSON.parse(readFileSync(join(AGENT, "tsconfig.json"), "utf8"));
  assert.ok((cfg.include as string[]).includes("probes/**/*.ts"), "PT-AC-9 tsconfig.include thiếu probes/**/*.ts");
  const tsc = () => {
    try {
      return execFileSync("npx", ["tsc", "--noEmit", "-p", "."], { cwd: AGENT, encoding: "utf8", timeout: 600_000 });
    } catch (e) {
      return String((e as { stdout?: string }).stdout ?? "");
    }
  };
  const loiProbes = (ra: string) => ra.split("\n").filter((l) => /^probes\//.test(l) && /error TS/.test(l));
  const ra = tsc();
  const tong = ra.split("\n").filter((l) => /error TS/.test(l)).length;
  assert.deepEqual(loiProbes(ra), [], "PT-AC-9 tsc báo lỗi trong agent/probes");
  // Chiều đỏ: một tệp có lỗi kiểu dưới probes/ phải bị tsc gọi tên (tên không mở đầu bằng chấm — glob của tsc bỏ tệp ẩn).
  const f = join(AGENT, "probes", `pt-loi-${process.pid}.ts`);
  writeFileSync(f, `${readFileSync(join(AGENT, "probes/chung.ts"), "utf8")}\nexport const x: number = "a";\n`);
  try {
    const sai = loiProbes(tsc());
    assert.ok(sai.some((l) => l.includes(`pt-loi-${process.pid}.ts`) && l.includes("TS2322")), `PT-AC-9 tsc không bắt lỗi kiểu trong probes/: ${sai.join(" | ")}`);
  } finally {
    rmSync(f, { force: true });
  }
  t.diagnostic(`PT-AC-9: 0 lỗi trong probes/ · ${tong} lỗi tồn đọng ngoài probes (node_modules)`);
});
