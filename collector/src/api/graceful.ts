/**
 * Graceful shutdown cho Collector API: SIGTERM/SIGINT (launchd bootout,
 * restart, Ctrl-C tay) phải flush buffer thành snapshot TRƯỚC khi thoát —
 * tin đã ack 202 mà chưa flush không được mất âm thầm.
 *
 * Bảo hiểm nhiều lớp:
 * - Đóng server HTTP TRƯỚC khi flush (close) — idle connections bị cắt nhưng
 *   request đang chạy được làm nốt (closeIdleConnections, claudedp-2310-3b),
 *   rồi LẶP flush tới khi buffer rỗng (flush trả null) hoặc chạm deadline.
 * - Signal thứ hai thoát ngay (operator ép thoát).
 * - Deadline (mỗi 45s < launchd ExitTimeOut 60s). Sát deadline (<10s) flush
 *   bỏ bước media; ĐANG TẢI ảnh thì huỷ theo AbortSignal (deadlineAt) —
 *   tin quan trọng hơn ảnh, không đợi ảnh treo vượt deadline (2310-3).
 * - Thoát vì deadline/ép mà buffer VẪN còn tin → exit(1) + log số tin mất,
 *   không im lặng exit(0) (2310-3a) — để giám sát thấy mất.
 *
 * Deps tiêm vào để test không đụng process thật.
 */

export type ShutdownSignal = "SIGTERM" | "SIGINT";
export type SignalHandler = () => void;

export type GracefulShutdownDeps = {
  on: (sig: ShutdownSignal, fn: SignalHandler) => void;
  off: (sig: ShutdownSignal, fn: SignalHandler) => void;
  exit: (code: number) => void;
  log?: (line: string) => void;
};

/** Còn ít hơn ngưỡng này tới deadline → flush bỏ/huỷ bước media (tin > ảnh). */
export const MEDIA_CUTOFF_MS = 10_000;

const DEFAULT_DEADLINE_MS = 45_000;

export function installGracefulShutdown(
  deps: GracefulShutdownDeps,
  opts: {
    /** Flush một lượt; trả null khi buffer rỗng. skipMedia: bỏ tải ảnh;
     *  deadlineAt (epoch ms): huỷ tải ảnh khi còn MEDIA_CUTOFF tới mốc. */
    flush: (flushOpts?: { skipMedia?: boolean; deadlineAt?: number }) => Promise<unknown>;
    /** Đóng server HTTP trước khi flush — không nhận POST mới giữa lúc dọn
     *  (dùng closeIdleConnections để request đang chạy được làm nốt). */
    close?: () => Promise<void> | void;
    deadlineMs?: number;
    /** Số tin còn nằm buffer — >0 lúc thoát → exit(1) + log mất (2310-3a). */
    pendingCount?: () => number;
  },
): { uninstall: () => void } {
  const log = deps.log ?? (() => {});
  const deadlineMs = opts.deadlineMs ?? DEFAULT_DEADLINE_MS;
  let shuttingDown = false;
  let settled = false;

  const finish = (why: string): void => {
    if (settled) return;
    settled = true;
    log(why);
    const pending = opts.pendingCount?.() ?? 0;
    if (pending > 0) {
      log(`shutdown: MẤT ${pending} tin đã ack chưa kịp flush — thoát mã 1 để giám sát thấy`);
      deps.exit(1);
      return;
    }
    deps.exit(0);
  };

  const handler = (sig: ShutdownSignal): void => {
    if (shuttingDown) {
      // Signal thứ hai: đang flush mà operator ép thoát — thoát ngay.
      finish(`shutdown: ${sig} lần 2 — thoát ngay, bỏ dừng flush`);
      return;
    }
    shuttingDown = true;
    const startedAt = Date.now();
    const deadlineAt = startedAt + deadlineMs;
    log(`shutdown: ${sig} — đóng HTTP, flush buffer rồi thoát (tối đa ${deadlineMs}ms)`);
    const deadline = setTimeout(
      () => finish("shutdown: flush quá deadline — thoát"),
      deadlineMs,
    );
    (async () => {
      if (opts.close) {
        try {
          await opts.close();
        } catch (err) {
          log(`shutdown: đóng server lỗi (${err instanceof Error ? err.message : String(err)}) — vẫn flush`);
        }
      }
      // Lặp flush tới hết buffer: lượt flush làm trên BẢN CHÉP buffer nên tin
      // ingest giữa chừng nằm lại — phải có lượt tiếp theo. Dừng khi flush
      // báo buffer rỗng (null) hoặc không còn cho ra snapshot nào nữa.
      for (;;) {
        const remaining = deadlineAt - Date.now();
        const skipMedia = remaining < MEDIA_CUTOFF_MS;
        const m = await opts.flush(skipMedia ? { skipMedia: true, deadlineAt } : { deadlineAt });
        if (m === null || m === undefined || typeof m !== "object" || !("snapshotId" in m)) break;
        log(`shutdown: flushed ${(m as { snapshotId: string }).snapshotId}${skipMedia ? " (bỏ media — sát deadline)" : ""}`);
      }
      clearTimeout(deadline);
      finish("shutdown: flush xong — thoát");
    })().catch((err: unknown) => {
      clearTimeout(deadline);
      finish(`shutdown: flush lỗi (${err instanceof Error ? err.message : String(err)}) — thoát`);
    });
  };

  const sigterm = () => handler("SIGTERM");
  const sigint = () => handler("SIGINT");
  deps.on("SIGTERM", sigterm);
  deps.on("SIGINT", sigint);

  return {
    uninstall: () => {
      deps.off("SIGTERM", sigterm);
      deps.off("SIGINT", sigint);
    },
  };
}
