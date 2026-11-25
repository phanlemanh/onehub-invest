/**
 * «Kéo dan» của một pha KHÔNG gọi API của nguồn (pha ảnh — chỉ tải tệp tĩnh): giữ đúng các trần và luật dừng của
 * lớp gọi (client.ts) — trần lời, trần thời gian, yêu cầu dừng, và khoá dừng: đã dừng thì không gửi gì nữa.
 * Bị chặn (máy chủ ảnh trả 403 không phải hết hạn, hoặc 429) là dừng cả lượt, kể cả ở pha không cần phiên.
 */
import { RunStopped, type Caps, type StopReason } from "./client.js";

export class KeoDan {
  /** Số tệp đã gửi lời tải (kể cả lời lỗi). */
  calls = 0;
  /** Số lần gặp chặn. */
  blocks = 0;
  private stopped: RunStopped | null = null;
  private readonly startedAt: number;

  constructor(
    private readonly o: {
      caps: Caps;
      now: () => number;
      shouldStop?: () => boolean;
    },
  ) {
    this.startedAt = o.now();
  }

  private stop(reason: StopReason, message: string): RunStopped {
    this.stopped ??= new RunStopped(reason, message);
    return this.stopped;
  }

  assertRunning(): void {
    if (this.stopped) throw this.stopped;
    if (this.o.shouldStop?.()) throw this.stop("operator-stop", "có tệp DUNG trong thư mục trạng thái — dừng theo yêu cầu");
    if (this.o.now() - this.startedAt > this.o.caps.minutes * 60_000) throw this.stop("time-cap", `quá trần thời gian ${this.o.caps.minutes} phút`);
    if (this.calls >= this.o.caps.calls) throw this.stop("call-cap", `quá trần ${this.o.caps.calls} lời gọi`);
  }

  block(message: string): RunStopped {
    this.blocks++;
    return this.stop("blocked", message);
  }

  stopRun(reason: StopReason, message: string): RunStopped {
    return this.stop(reason, message);
  }
}
