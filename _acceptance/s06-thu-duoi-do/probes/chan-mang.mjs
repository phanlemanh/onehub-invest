// Nạp bằng --import trước tệp test: chặn và đếm mọi lời gọi mạng ra ngoài máy (fetch, socket TCP tới host không phải
// localhost). Đếm ghi vào tệp ở $CHAN_MANG_GHI khi tiến trình thoát. Dùng bởi khong-mang.mjs (s06-thu-duoi-do E5).
import net from "node:net";
import { appendFileSync } from "node:fs";
const ghi = process.env.CHAN_MANG_GHI;
const bao = (loai, dich) => { if (ghi) appendFileSync(ghi, `${loai} ${dich}\n`); };
globalThis.fetch = async (u) => { bao("fetch", String(u)); throw new TypeError("chan-mang: lời gọi mạng thật bị chặn"); };
const cu = net.Socket.prototype.connect;
net.Socket.prototype.connect = function (...a) {
  const o = typeof a[0] === "object" && a[0] !== null ? a[0] : { port: a[0], host: a[1] };
  const h = o.host ?? "localhost";
  if (!o.path && !["localhost", "127.0.0.1", "::1"].includes(h)) { bao("socket", `${h}:${o.port}`); throw new Error("chan-mang: socket ra ngoài bị chặn"); }
  return cu.apply(this, a);
};
