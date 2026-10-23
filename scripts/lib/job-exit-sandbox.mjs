// job-exit-sandbox.mjs — hộp cát cho phép đo AU3 (`scripts/job-exit.test.mjs`), nạp bằng
//   node --import file://…/job-exit-sandbox.mjs pipeline/<bước>.mjs
// Chặn MỌI kết nối TCP không tới cổng canh (JOB_EXIT_SENTINEL_PORT trên 127.0.0.1) và mọi fetch,
// để một bước lỡ viết cứng chuỗi kết nối (như push-ops-facts 23/10) không bao giờ chạm DB thật hay cloud.
// Mỗi lần chặn ghi một dòng vào JOB_EXIT_BLOCK_LOG — phép đo đòi tệp này rỗng ở bước lành.
import { appendFileSync } from "node:fs";
import net from "node:net";

const SENTINEL = Number(process.env.JOB_EXIT_SENTINEL_PORT);
const BLOCK_LOG = process.env.JOB_EXIT_BLOCK_LOG;

function ghiChan(what) {
  const line = `JOB-EXIT SANDBOX chặn ${what}`;
  process.stderr.write(line + "\n");
  if (BLOCK_LOG) appendFileSync(BLOCK_LOG, line + "\n");
}

// net.connect() gọi socket.connect([options, cb]) (mảng đã chuẩn hoá); pg gọi socket.connect(port, host).
function dich(args) {
  let a = args[0];
  if (Array.isArray(a)) a = a[0];
  if (a && typeof a === "object") return { port: a.port, host: a.host, path: a.path };
  return { port: a, host: typeof args[1] === "string" ? args[1] : undefined };
}

const goc = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...args) {
  const { port, host, path } = dich(args);
  const hostOk = host === undefined || host === "127.0.0.1" || host === "localhost";
  if (path || !hostOk || Number(port) !== SENTINEL || !Number.isFinite(SENTINEL)) {
    ghiChan(path ? `socket ${path}` : `TCP ${host ?? "?"}:${port}`);
    process.nextTick(() => this.destroy(new Error("job-exit sandbox: kết nối bị chặn")));
    return this;
  }
  return goc.apply(this, args);
};

globalThis.fetch = async (url) => {
  ghiChan(`fetch ${String(url)}`);
  throw new Error("job-exit sandbox: fetch bị chặn");
};
