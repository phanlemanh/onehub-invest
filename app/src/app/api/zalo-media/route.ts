import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";

import { getSessionUser } from "@/lib/auth";
import { isAdmin } from "@/lib/ops-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/zalo-media?path=<mediaPath> — serve ảnh staging của OpenClaw cho
 * trang /ops/deals (G2). Ảnh tin Zalo là tầng A → chỉ admin (cùng cổng với
 * khối liên hệ trên trang). CHỈ nhận file ảnh trong thư mục staging OpenClaw
 * (chặn arbitrary file read); KHÔNG sync cloud (route trả 404 khi file không
 * tồn tại — đúng vì media là tầng A local).
 */
// Chỉ hai gốc staging ảnh: media của gateway (~/.openclaw/media, OpenClaw lưu
// ảnh inbound ở media/inbound) và thư mục tạm /tmp/openclaw (docs/ops/runtime-map.md).
// KHÔNG mở cả ~/.openclaw — trong đó có openclaw.json, credentials/, mac-control.token.
const HOME = process.env.HOME ?? "/Users";
const ALLOWED_ROOTS = [path.join(HOME, ".openclaw", "media"), "/tmp/openclaw"];

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** `file` nằm HẲN trong `root` — so theo đoạn đường dẫn, không theo tiền tố chuỗi
 *  (`/tmp/openclaw-evil/x.png` KHÔNG được tính là trong `/tmp/openclaw`). */
function isInside(root: string, file: string): boolean {
  const rel = path.relative(root, file);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

/** realpath của các gốc (macOS: /tmp → /private/tmp); gốc chưa có trên máy → bỏ. */
async function realRoots(): Promise<string[]> {
  const out: string[] = [];
  for (const root of ALLOWED_ROOTS) {
    try {
      out.push(await realpath(root));
    } catch {
      // gốc chưa tồn tại (vd. môi trường cloud)
    }
  }
  return out;
}

const isImage = (p: string) => Boolean(MIME[path.extname(p).toLowerCase()]);

export async function GET(req: Request) {
  if (!isAdmin(await getSessionUser())) return new Response("not found", { status: 404 });
  const p = new URL(req.url).searchParams.get("path");
  if (!p) return new Response("thiếu path", { status: 400 });
  const resolved = path.resolve(p);
  const roots = await realRoots();
  // Lớp 1 — theo chữ: phải là file ảnh nằm trong một gốc (dạng gốc hoặc realpath).
  if (!isImage(resolved) || ![...ALLOWED_ROOTS, ...roots].some((root) => isInside(root, resolved))) {
    return new Response("path ngoài vùng cho phép", { status: 403 });
  }
  try {
    // Lớp 2 — theo đĩa: đi theo symlink tới đích thật rồi kiểm lại (chặn symlink
    // đặt trong /tmp/openclaw trỏ ra ngoài, vd. tới ~/.openclaw/openclaw.json).
    const real = await realpath(resolved);
    if (!isImage(real) || !roots.some((root) => isInside(root, real))) {
      return new Response("path ngoài vùng cho phép", { status: 403 });
    }
    const st = await stat(real);
    if (!st.isFile()) return new Response("not found", { status: 404 });
    const buf = await readFile(real);
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": MIME[path.extname(real).toLowerCase()],
        "cache-control": "private, max-age=300",
      },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
