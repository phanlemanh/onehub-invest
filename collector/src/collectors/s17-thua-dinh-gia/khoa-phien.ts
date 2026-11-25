/**
 * KHOÁ CHUNG của mọi pha cần phiên của S17: một lúc chỉ MỘT pha gọi API của nguồn — dù ở hai thư mục trạng thái khác
 * nhau, hai worktree, hay hai trang của cùng hồ sơ. Khoá theo lượt (`DANG-CHAY.lock`) chỉ bó mỗi thư mục trạng thái.
 *
 * Vì sao (25/11/2026): hai pha cần phiên chạy đồng thời ở hai trang (căn hộ 6 luồng + thửa 8 luồng ≈ 2,1 lời/s) thì
 * 14:26 nguồn trả HTTP 429; chạy lại ở nhịp khoá thì 18:30 nguồn trả 429 lần thứ hai và phần cần phiên phải dừng
 * hẳn 24 giờ. Mốc «mở song song để tăng tốc» của phần cần phiên được thu hồi vì thế.
 *
 * Tệp khoá ở thư mục tạm của người dùng (một máy, mọi worktree); ghi pid; khoá của tiến trình đã chết được dọn.
 */
import { closeSync, mkdirSync, openSync, readFileSync, unlinkSync, writeSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { RunStopped } from "./client.js";

const conSong = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === "EPERM"; // tiến trình sống nhưng không phải của mình
  }
};

/** Đường tệp khoá mặc định: một máy, mọi worktree, mọi thư mục trạng thái. */
export function duongKhoaPhienMacDinh(): string {
  return join(tmpdir(), `oneinvest-s17-phien${typeof process.getuid === "function" ? `-${process.getuid()}` : ""}.lock`);
}

/** Lấy khoá chung; trả hàm nhả khoá. Pha cần phiên khác đang giữ thì dừng với lý do `another-run`. */
export function khoaPhien(duong: string): () => void {
  mkdirSync(dirname(duong), { recursive: true });
  let daLay = false;
  for (let lan = 0; lan < 3 && !daLay; lan++) {
    try {
      const fd = openSync(duong, "wx");
      writeSync(fd, JSON.stringify({ pid: process.pid, luc: new Date().toISOString() }));
      closeSync(fd);
      daLay = true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      let pid: unknown;
      try {
        pid = (JSON.parse(readFileSync(duong, "utf8")) as { pid?: unknown }).pid;
      } catch {
        pid = undefined;
      }
      if (typeof pid === "number" && conSong(pid)) {
        throw new RunStopped("another-run", `một pha cần phiên khác của S17 đang chạy (pid ${pid}) — không chạy hai pha cần phiên đồng thời, nguồn trả 429`);
      }
      try {
        unlinkSync(duong); // khoá mồ côi
      } catch {
        /* lượt khác vừa dọn giúp */
      }
    }
  }
  if (!daLay) throw new RunStopped("another-run", `khoá chung các pha cần phiên đang được lượt khác giữ (${duong})`);
  return () => {
    try {
      if ((JSON.parse(readFileSync(duong, "utf8")) as { pid?: unknown }).pid === process.pid) unlinkSync(duong);
    } catch {
      /* tệp khoá đã bị dọn (khởi động lại máy, hoặc lượt khác dọn khoá mồ côi) */
    }
  };
}
