import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import type { User } from "@/lib/auth";
import { isAdmin } from "@/lib/ops-access";
import { isLoginQrFile } from "@/lib/zalo-admin";

/**
 * Lõi của GET /api/zalo-media — phục vụ ảnh tin (PII tầng A, ADR-0007) cho trang /ops.
 * Chỉ admin; KHÔNG sync cloud (file chỉ có trên máy local → ở cloud route trả 404).
 * Hai chế độ:
 *   - `?path=<tuyệt đối>`: ảnh staging OpenClaw cho /ops/deals (PR #5).
 *   - `?snapshot=<snapshotId>&file=media/<tên>`: ảnh N1 tải vào raw snapshot
 *     (`<SNAPSHOTS_DIR>/<market>/<snapshotId>/media/*`, DATA-CONTRACT v2) cho /ops/review.
 *     Route tự ghép đường dưới gốc snapshots — không nhận đường tuyệt đối từ ngoài.
 * Cả hai qua đúng hai lớp kiểm: theo chữ (`isInside`) rồi theo đĩa (`realpath`).
 */

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const isImage = (p: string) => Boolean(MIME[path.extname(p).toLowerCase()]);

/** `file` nằm HẲN trong `root` — so theo đoạn đường dẫn, không theo tiền tố chuỗi
 *  (`/tmp/openclaw-evil/x.png` KHÔNG được tính là trong `/tmp/openclaw`). */
export function isInside(root: string, file: string): boolean {
  const rel = path.relative(root, file);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

// Chỉ hai gốc staging ảnh: media của gateway (~/.openclaw/media, OpenClaw lưu
// ảnh inbound ở media/inbound) và thư mục tạm /tmp/openclaw (docs/ops/runtime-map.md).
// KHÔNG mở cả ~/.openclaw — trong đó có openclaw.json, credentials/, mac-control.token.
function openclawRoots(): string[] {
  const home = process.env.HOME ?? "/Users";
  return [path.join(home, ".openclaw", "media"), "/tmp/openclaw"];
}

/** Gốc raw snapshot: `SNAPSHOTS_DIR` (cùng tên với pipeline/backfill-zalo-media.mjs),
 *  mặc định `collector/snapshots` cạnh app/. Chạy từ worktree thì đặt env trỏ checkout chính. */
export function snapshotsRoot(): string {
  return path.resolve(process.env.SNAPSHOTS_DIR ?? path.join(process.cwd(), "..", "collector", "snapshots"));
}

// snapshotId kiểu `hanoi__zalo-agent__2026-10-22T070651`; file kiểu `media/<sha>.jpg`.
// Không `/`, không `..` — chỉ một tầng tên, thư mục cha của ảnh luôn là `media`.
const SNAPSHOT_ID = /^[A-Za-z0-9][A-Za-z0-9_.:-]*$/;
const MEDIA_FILE = /^media\/[A-Za-z0-9][A-Za-z0-9_.-]*$/;

/** Đường tuyệt đối của ảnh snapshot, hoặc null khi tham số không đúng hình dạng.
 *  Thư mục snapshot = `<root>/<market>/<snapshotId>`, market = phần trước `__`. */
export function snapshotMediaPath(snapshotId: string, file: string): string | null {
  if (!SNAPSHOT_ID.test(snapshotId) || snapshotId.includes("..")) return null;
  if (!MEDIA_FILE.test(file) || file.includes("..")) return null;
  const market = snapshotId.split("__")[0];
  return path.join(snapshotsRoot(), market, snapshotId, file);
}

/** URL cùng origin cho ảnh snapshot (dùng ở loader thẻ duyệt), null khi tham số hỏng. */
export function snapshotMediaUrl(snapshotId: string, file: string): string | null {
  if (!snapshotMediaPath(snapshotId, file)) return null;
  return `/api/zalo-media?snapshot=${encodeURIComponent(snapshotId)}&file=${encodeURIComponent(file)}`;
}

/** realpath của các gốc (macOS: /tmp → /private/tmp); gốc chưa có trên máy → bỏ. */
async function realRoots(roots: string[]): Promise<string[]> {
  const out: string[] = [];
  for (const root of roots) {
    try {
      out.push(await realpath(root));
    } catch {
      // gốc chưa tồn tại (vd. môi trường cloud)
    }
  }
  return out;
}

const inMediaDir = (p: string) => path.basename(path.dirname(p)) === "media";
const outside = () => new Response("path ngoài vùng cho phép", { status: 403 });

async function sendImage(resolved: string, roots: string[], mediaOnly: boolean): Promise<Response> {
  const real = await realRoots(roots);
  // Lớp 1 — theo chữ: phải là file ảnh nằm trong một gốc (dạng gốc hoặc realpath), không phải ảnh QR
  // đăng nhập Zalo (quét được là đăng nhập được tài khoản thu — so-be-mat-api AC-6).
  if (!isImage(resolved) || isLoginQrFile(resolved) || (mediaOnly && !inMediaDir(resolved))) return outside();
  if (![...roots, ...real].some((root) => isInside(root, resolved))) return outside();
  try {
    // Lớp 2 — theo đĩa: đi theo symlink tới đích thật rồi kiểm lại (chặn symlink
    // đặt trong vùng cho phép trỏ ra ngoài, vd. tới ~/.openclaw/openclaw.json).
    const target = await realpath(resolved);
    if (!isImage(target) || isLoginQrFile(target) || (mediaOnly && !inMediaDir(target))) return outside();
    if (!real.some((root) => isInside(root, target))) return outside();
    const st = await stat(target);
    if (!st.isFile()) return new Response("not found", { status: 404 });
    const buf = await readFile(target);
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": MIME[path.extname(target).toLowerCase()],
        "cache-control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}

export async function serveZaloMedia(req: Request, user: User | null): Promise<Response> {
  if (!isAdmin(user)) return new Response("not found", { status: 404 });
  const q = new URL(req.url).searchParams;
  const snapshot = q.get("snapshot");
  const file = q.get("file");
  if (snapshot !== null || file !== null) {
    if (!snapshot || !file) return new Response("thiếu snapshot hoặc file", { status: 400 });
    const joined = snapshotMediaPath(snapshot, file);
    if (!joined) return outside();
    return sendImage(joined, [snapshotsRoot()], true);
  }
  const p = q.get("path");
  if (!p) return new Response("thiếu path", { status: 400 });
  return sendImage(path.resolve(p), openclawRoots(), false);
}
