/**
 * Graceful shutdown cho Collector API: SIGTERM/SIGINT (launchd bootout,
 * restart, Ctrl-C tay) phải flush buffer thành snapshot TRƯỚC khi thoát —
 * tin đã ack 202 mà chưa flush không được mất âm thầm.
 *
 * Bảo hiểm hai lớp: signal thứ hai thoát ngay (operator ép thoát), và
 * deadline (flush treo — ví dụ tải ảnh chết mạng — không đợi launchd
 * SIGKILL). Deps tiêm vào để test không đụng process thật.
 */

export type ShutdownSignal = "SIGTERM" | "SIGINT";
export type SignalHandler = () => void;

export type GracefulShutdownDeps = {
  on: (sig: ShutdownSignal, fn: SignalHandler) => void;
  off: (sig: ShutdownSignal, fn: SignalHandler) => void;
  exit: (code: number) => void;
  log?: (line: string) => void;
};

const DEFAULT_DEADLINE_MS = 20_000;

export function installGracefulShutdown(
  deps: GracefulShutdownDeps,
  opts: { flush: () => Promise<unknown>; deadlineMs?: number },
): { uninstall: () => void } {
  const log = deps.log ?? (() => {});
  const deadlineMs = opts.deadlineMs ?? DEFAULT_DEADLINE_MS;
  let shuttingDown = false;
  let settled = false;

  const finish = (why: string): void => {
    if (settled) return;
    settled = true;
    log(why);
    deps.exit(0);
  };

  const handler = (sig: ShutdownSignal): void => {
    if (shuttingDown) {
      // Signal thứ hai: đang flush mà operator ép thoát — thoát ngay.
      finish(`shutdown: ${sig} lần 2 — thoát ngay, bỏ dừng flush`);
      return;
    }
    shuttingDown = true;
    log(`shutdown: ${sig} — flush buffer rồi thoát (tối đa ${deadlineMs}ms)`);
    const deadline = setTimeout(
      () => finish("shutdown: flush quá deadline — thoát"),
      deadlineMs,
    );
    opts
      .flush()
      .then(() => {
        clearTimeout(deadline);
        finish("shutdown: flush xong — thoát");
      })
      .catch((err: unknown) => {
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
