// sinh-log-that.mjs — KEV1 AC-9: sinh log hook bằng CHÍNH handler.js (writer thật), để kiem.sh đưa qua kiem-sau.sh thay
// vì chỉ tin log mẫu viết tay. Hộp cát: HOME tạm, spool tạm, collector giả 127.0.0.1 cổng ngẫu nhiên trả 202, cổng chấm trỏ
// một cổng đã đóng (hook cũ gọi nó thì nhận lỗi — đúng cảnh máy thu không còn Kev). Không chạm ~/.openclaw, :9210, :8009.
//   node sinh-log-that.mjs <handler.js> <tệp log ra>
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, writeFileSync, copyFileSync, readFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir, homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const [handlerPath, out] = process.argv.slice(2);
if (!handlerPath || !out) { console.error("dùng: sinh-log-that.mjs <handler.js> <tệp log ra>"); process.exit(2); }
const HOME_THAT = homedir();
const T = mkdtempSync(join(tmpdir(), "kev1-log-that-"));
process.env.HOME = T;
process.env.ONEINVEST_HOOK_SPOOL = join(T, "spool");
if (resolve(homedir()) === resolve(HOME_THAT)) { console.error("HOME tạm không có hiệu lực — bỏ chạy"); process.exit(2); }
mkdirSync(join(T, ".openclaw/credentials"), { recursive: true });
mkdirSync(join(T, ".openclaw/logs"), { recursive: true });
writeFileSync(join(T, ".openclaw/credentials/oneinvest-agent.key"), "khoa-gia\n");

const nghe = (srv) => new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv.address().port)));
const thu = createServer((req, res) => { req.resume(); req.on("end", () => { res.writeHead(202, { "content-type": "application/json" }); res.end('{"accepted":1}'); }); });
const dong = createServer(); // lấy một cổng rồi đóng — cổng chấm «không nghe»
const cổngThu = await nghe(thu);
const cổngDong = await nghe(dong); await new Promise((ok) => dong.close(ok));
process.env.ONEINVEST_API_URL = `http://127.0.0.1:${cổngThu}`;
process.env.ONEINVEST_KEV_URL = `http://127.0.0.1:${cổngDong}`;

const ban = join(T, "handler.mjs");
copyFileSync(handlerPath, ban);
try {
  const { default: h } = await import(pathToFileURL(ban).href);
  for (const [i, chu] of ["bán căn hộ 2PN giá 2 tỷ", "cho thuê studio 6 triệu", "bán đất 60m2 sổ đỏ"].entries()) {
    await h({ event: { channelId: "zalouser", accountId: "acc-mau", conversationId: `nhom-mau-${i}`, content: chu,
      timestamp: Date.now(), metadata: { senderName: "nguoi-mau", senderId: `u${i}` }, media: [] } });
  }
  await new Promise((ok) => setTimeout(ok, 100)); // log() ghi không chờ
  const log = join(T, ".openclaw/logs/oneinvest-zalo-pipe.log");
  writeFileSync(out, existsSync(log) ? readFileSync(log, "utf8") : "");
} finally {
  thu.close();
  rmSync(T, { recursive: true, force: true });
}
