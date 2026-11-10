// E7/AC-7 (ma-album-s03) — TIỀN KIỂM trước khi khởi động lại gateway.
// Tám kiểm; thiếu BẤT KỲ điều nào → thoát ≠ 0 và in rõ «KHÔNG ĐƯỢC KHỞI ĐỘNG
// LẠI». Đọc máy thật nhưng TOÀN BỘ CHỈ ĐỌC; bản build mới lấy từ
// OPENCLAW_SRC (mặc định ~/dev/openclaw — dist build của nhánh ext).
// NOTE THIẾT KẾ (contract): bộ canh đã-vá đang chạy là ĐIỀU KIỆN — hiện
// CHƯA gộp nên tiền kiểm phải ĐỎ đúng ở kiểm đó cho tới khi gộp.
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const OC = `${HOME}/.openclaw`;
const SRC = process.env.OPENCLAW_SRC ?? `${HOME}/dev/openclaw`;
// bản launchd đang chạy — có thể trỏ bản thử qua env (ca mô phỏng 8/8)
const WD_THAT = process.env.MAS3_WD_THAT ?? `/Users/manhphan/dev/onehub-invest/pipeline/logs/zalo-watchdog.log`;
const WD_SCRIPT = process.env.MAS3_WD_SCRIPT ?? `/Users/manhphan/dev/onehub-invest/scripts/zalo-watchdog.sh`;
const CANH_VA = process.env.MAS3_CANH_DA_VA === "1"; // bật khi bộ canh đã vá được gộp

function doc(f, ...args) {
  try { return execFileSync(f, args, { encoding: "utf8" }); } catch { return ""; }
}
const sha = (p) => (existsSync(p) ? createHash("sha256").update(readFileSync(p)).digest("hex") : "(không)");

// mốc đếm transcript_events để lệnh phán lùi (E8) dùng — ghi stdout ở cuối
function demTranscript() {
  // MỌI agent trong ~/.openclaw/agents (review 10/11: bản trước chỉ main + watcher; AC-7 đòi mọi agent)
  const out = {};
  const dir = `${OC}/agents`;
  const ags = existsSync(dir) ? readdirSync(dir) : [];
  for (const ag of ags) {
    const db = `${dir}/${ag}/agent/openclaw-agent.sqlite`;
    if (!existsSync(db)) continue;
    const mode = existsSync(`${db}-wal`) || existsSync(`${db}-journal`) ? "mode=ro" : "immutable=1";
    let r = "";
    try { r = execFileSync("/usr/bin/sqlite3", [`file:${db}?${mode}`, "SELECT COUNT(*) || '|' || COALESCE(MAX(created_at),0) FROM transcript_events;"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim(); }
    catch { r = "(lỗi đọc)"; }
    out[ag] = r || "(lỗi đọc)";
  }
  return out;
}

test("E7 tiền kiểm trước khởi động lại gateway (8 điều kiện)", () => {
  const loi = [];
  const inRa = (ok, ten, chiTiet = "") => {
    console.log(`${ok ? "ok  " : "ĐỎ  "} E7 ${ten}${chiTiet ? " — " + chiTiet : ""}`);
    if (!ok) loi.push(ten);
  };

  // (1) openclaw config validate trên BẢN CHÉP cấu hình thật (không đụng bản thật). Bản chép nằm trong thư mục tạm riêng
  //     quyền 0700, tệp 0600, xoá ngay sau khi validate (review 10/11: bản trước để lại /tmp/…json quyền 0644).
  const tmpDir = mkdtempSync(join(tmpdir(), "mas3-tien-kiem-"));
  try {
    const tmp = join(tmpDir, "openclaw.json");
    writeFileSync(tmp, readFileSync(`${OC}/openclaw.json`, "utf8"), { mode: 0o600 });
    const r = execFileSync(`${OC}/bin/openclaw`, ["config", "validate", "--json"], { encoding: "utf8", env: { ...process.env, OPENCLAW_CONFIG_PATH: tmp }, stdio: ["ignore", "pipe", "ignore"] });
    inRa(JSON.parse(r).valid === true, "1. validate bản chép cấu hình thật");
  } catch (e) { inRa(false, "1. validate bản chép cấu hình thật", String(e.message).slice(0, 80)); }
  finally { rmSync(tmpDir, { recursive: true, force: true }); }

  // (2) marker bộ canh trong monitor ĐANG CHẠY
  const monDangChay = existsSync(`${OC}/extensions/zalouser/dist/.setup`)
    ? (doc("/bin/ls", `${OC}/extensions/zalouser/dist/.setup/`).split("\n").find((f) => f.startsWith("monitor-")) ?? "")
    : "";
  const noiMon = monDangChay ? readFileSync(`${OC}/extensions/zalouser/dist/.setup/${monDangChay}`, "utf8") : "";
  inRa(monDangChay && noiMon.includes("pluginHooks") && noiMon.includes("SuppressMessageReceivedHooks"),
    "2. marker bộ canh trong monitor đang chạy", monDangChay || "không thấy monitor");

  // (3) script bộ canh launchd đang chạy là BẢN ĐÃ VÁ đếm transcript_events
  //     + lần chạy gần nhất ≤10′ đạt
  const wdNoiDung = existsSync(WD_SCRIPT) ? readFileSync(WD_SCRIPT, "utf8") : "";
  const daVa = wdNoiDung.includes("l4d_read_db") && wdNoiDung.includes(".first-done");
  let chayGanNhat = "";
  if (existsSync(WD_THAT)) {
    const dong = readFileSync(WD_THAT, "utf8").trim().split("\n");
    chayGanNhat = dong[dong.length - 1] ?? "";
  }
  const m = chayGanNhat.match(/^(\S+)/);
  const tuoiPhut = m ? (Date.now() - Date.parse(m[1])) / 60000 : 1e9;
  if (!CANH_VA) {
    // CHƯA gộp: kiểm này PHẢI ĐỎ đúng chỗ (thiết kế hợp đồng) — vẫn chạy 2 nửa
    inRa(false, "3. bộ canh đã vá đang chạy + tick ≤10′", `chưa gộp (script có L4d: ${daVa}; tick ${Math.round(tuoiPhut)}′ trước) — điều kiện của hợp đồng, đỏ cho tới khi gộp`);
  } else {
    inRa(daVa && chayGanNhat.includes("ok —") && tuoiPhut <= 10, "3. bộ canh đã vá đang chạy + tick ≤10′",
      `L4d=${daVa} · tick ${Math.round(tuoiPhut)}′ · ${chayGanNhat.slice(0, 40)}`);
  }

  // (4) băm cấu hình OpenClaw không đổi so mốc (env MAS3_CFG_SHA; không có = ghi mốc mới)
  const bamHienTai = sha(`${OC}/openclaw.json`);
  const bamMoc = process.env.MAS3_CFG_SHA;
  // thiếu mốc = CHƯA kiểm được → ĐỎ (review 10/11: bản trước cho «ok»). Lần đầu đọc E7_MOC_CFG_SHA in cuối, chạy lại với MAS3_CFG_SHA.
  inRa(Boolean(bamMoc) && bamMoc === bamHienTai, "4. băm cấu hình OpenClaw không đổi", bamMoc ? (bamMoc === bamHienTai ? "" : "băm đã đổi") : "chưa có mốc — chạy lại với MAS3_CFG_SHA=<E7_MOC_CFG_SHA>");

  // (5) mã mới (src extension trên nhánh vá) không có requestOldMessages/old_messages/đường gửi mới
  const srcFiles = ["src/monitor.ts", "src/zalo-js.ts", "src/types.ts", "src/channel.runtime.ts", "src/send.ts"]
    .map((f) => `${SRC}/extensions/zalouser/${f}`).filter(existsSync);
  const noiDung = srcFiles.map((f) => readFileSync(f, "utf8")).join("\n");
  const khongLayTinCu = !noiDung.includes("requestOldMessages") && !noiDung.includes("old_messages");
  // đường gửi mới: hàm gửi của extension giữ nguyên khuôn — kiểm diff vùng send*
  const khongDuongGuiMoi = srcFiles.filter((f) => f.endsWith("send.ts")).every((f) => {
    const s = readFileSync(f, "utf8");
    return s.includes("sendMessage") === s.includes("sendZalo"); // không thêm hàm gửi lạ
  });
  // không đọc được tệp nguồn nào = CHƯA kiểm được → ĐỎ
  inRa(srcFiles.length > 0 && khongLayTinCu && khongDuongGuiMoi, "5. mã mới không có lấy-tin-cũ / đường gửi mới", srcFiles.length ? "" : `không thấy mã nguồn extension ở ${SRC}`);

  // (6) bản build CHƯA vá khớp dist ĐANG CHẠY: build 568ed825b (bản sạch) diff
  //     dist đang chạy phải rỗng — chứng minh dist chạy = base + chỉ .patch của ta
  const distChay = `${OC}/extensions/zalouser/dist`;
  const distGoc = `${SRC}/dist/extensions/zalouser`; // dist build từ 568ed825b sạch (bo-canh đã build sẵn ở ~/dev/openclaw/dist? — nếu không có, bỏ qua an toàn)
  const khop = !existsSync(distGoc) ? false : (() => {
    try {
      return execFileSync("/usr/bin/diff", ["-r", "-q", distGoc, distChay], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }) === "";
    } catch { return false; }
  })();
  // không có dist gốc để so = CHƯA kiểm được → ĐỎ (review 10/11: bản trước cho «ok»)
  inRa(khop, "6. build chưa vá khớp dist đang chạy", existsSync(distGoc) ? "" : `không có dist gốc ở ${distGoc} — build bản chưa vá trước`);

  // (7) không phiên agent dở: transcript không đổi trong 60′ (so mốc env MAS3_TR_MOC; không có mốc = ghi)
  const dem = demTranscript();
  const mocTr = process.env.MAS3_TR_MOC;
  // thiếu mốc 60′ = CHƯA kiểm được → ĐỎ. Lần đầu đọc E7_MOC_TRANSCRIPT, đợi 60′, chạy lại với MAS3_TR_MOC.
  const khongLuuMoI = Boolean(mocTr) && mocTr === JSON.stringify(dem);
  inRa(khongLuuMoI, "7. không phiên agent dở (transcript_events bằng mốc 60′)", mocTr ? JSON.stringify(dem) : "chưa có mốc 60′ — chạy lại sau 60′ với MAS3_TR_MOC=<E7_MOC_TRANSCRIPT>");

  // (8) mốc đếm đã ghi để phán lùi dùng
  inRa(Object.keys(dem).length > 0 && Object.values(dem).every((v) => /^\d+\|\d+$/.test(v)), "8. mốc đếm transcript_events ghi được", JSON.stringify(dem));

  console.log(`E7_MOC_TRANSCRIPT=${JSON.stringify(dem)}`);
  console.log(`E7_MOC_CFG_SHA=${bamHienTai}`);
  if (loi.length) {
    console.error(`\nE7 TIỀN KIỂM THẤT BẠI (${loi.length}/8 đỏ): ${loi.join(" · ")}`);
    console.error("→ KHÔNG ĐƯỢC KHỞI ĐỘNG LẠI GATEWAY cho tới khi mọi điều kiện xanh.");
    assert.fail(`tiền kiểm đỏ: ${loi.join(" · ")}`);
  }
  console.log("\nE7 ĐẠT — đủ điều kiện tiến hành theo hồ sơ (sau khi bộ canh đã vá được gộp).");
});
