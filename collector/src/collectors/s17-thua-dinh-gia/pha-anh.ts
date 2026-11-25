/**
 * Pha `images` — tải TOÀN BỘ ảnh dự án vào kho chuẩn (mốc mở rộng, claudedp-2411-73).
 *
 * Việc phải làm đọc từ kho (catalog.ts), không gọi API. Mỗi lô tối đa `maxFiles` tệp của một dự án → một snapshot:
 * item `anh_du_an` mang URL (payload.media) và bảng đối chiếu `meta.mediaFiles`, ảnh gốc dưới `media/`. Lô chốt xong
 * MỚI ghi tiến độ (nhật ký chỉ-ghi-thêm, một tệp mỗi dự án). Lỗi vĩnh viễn của một tệp (hết hạn, sai chữ ký, không
 * còn, máy chủ ngoài) được ghi nhận để không hỏi lại; lỗi mạng thì chưa ghi, lượt sau thử lại — dự án chỉ được đánh
 * dấu xong khi không còn ảnh dở. Bị chặn hoặc quá trần: chốt phần đã tải, ghi tiến độ, dừng cả lượt.
 */
import { createHash } from "node:crypto";
import { join } from "node:path";

import { RunStopped } from "./client.js";
import { duoiCua, hashUrl, taiAnh, tenTepCua, type KetQuaTai, type LoiAnh } from "./anh.js";
import { projectImages } from "./catalog.js";
import { makeItem } from "./kinds.js";
import type { KeoDan } from "./keo-dan.js";
import type { PhaseSummary, RunOptions } from "./run.js";
import type { BatchWriter } from "./store.js";
import { NhatKyTienDo, chotVaLuu } from "./tien-do.js";

export type AnhPhaseOptions = {
  /** Đuôi máy chủ lưu trữ của chính nguồn — đọc từ cấu hình local (tầng A). */
  hostSuffixes: string[];
  /** Số tệp tải cùng lúc. */
  luongSong: number;
  maxBytes: number;
  timeoutMs: number;
  userAgent: string;
  /** Đệm thử trong test; mặc định fetch toàn cục. */
  fetchImpl?: typeof fetch;
};

type MucMedia = { url: string; file?: string; sha256?: string; bytes?: number; error?: string };

/** Lỗi vĩnh viễn: hỏi lại cũng vậy, ghi nhận một lần rồi thôi. */
const LOI_VINH_VIEN = new Set<string>(["het-han", "sai-chu-ky", "khong-con", "host-not-allowed"]);
/** Nhiều lỗi mạng liền nhau thế này là nguồn ảnh hỏng hoặc mình bị chặn ngầm — dừng, không đổ tiếp. */
const MAX_LOI_LIEN = 10;

type TienDoAnh = { daLan: Set<string>; loiVinhVien: Map<string, string>; xong: boolean };

function docTienDoAnh(lines: Array<Record<string, unknown>>): TienDoAnh {
  const out: TienDoAnh = { daLan: new Set(), loiVinhVien: new Map(), xong: false };
  for (const r of lines) {
    for (const h of (r.daTai as string[] | undefined) ?? []) out.daLan.add(h);
    for (const [h, loi] of Object.entries((r.loi ?? {}) as Record<string, string>)) out.loiVinhVien.set(h, loi);
    if (r.xong === true) out.xong = true;
  }
  return out;
}

export async function imagesPhase(o: RunOptions, anh: AnhPhaseOptions, keoDan: KeoDan): Promise<PhaseSummary> {
  const started = keoDan.calls;
  const writer = o.writer as BatchWriter;
  const motSnapshot = writer.maxFiles ?? 100;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const kq = await projectImages(o.snapshotRoot as string, anh.hostSuffixes);
  let items = 0;
  let failed = 0;
  let soFile = 0;
  let soByte = 0;
  let soDuAnXong = 0;
  let dung: RunStopped | null = null;
  let loiLien = 0; // lỗi mạng liền nhau suốt cả pha (không đặt về không khi đổi lô): một tệp thành công mới đặt về không

  for (const d of kq.duAn) {
    if (dung) break;
    const tienDo = new NhatKyTienDo(join(o.tienDoDir as string, `anh-${d.id}.jsonl`));
    const td = docTienDoAnh(await tienDo.readAll());
    if (td.xong) continue;
    const conLai = d.anh.filter((a) => !td.daLan.has(hashUrl(a.url)) && !td.loiVinhVien.has(hashUrl(a.url)));
    const ngoaiMoi = d.ngoai.filter((u) => !td.loiVinhVien.has(hashUrl(u)));
    let conLoiMang = 0;
    let soFileDuAn = 0;
    let soLoiDuAn = 0;
    const soLo = Math.max(1, Math.ceil(conLai.length / motSnapshot));
    for (let i = 0; i < soLo && !dung; i++) {
      const lo = conLai.slice(i * motSnapshot, (i + 1) * motSnapshot);
      const ngoai = i === 0 ? ngoaiMoi : [];
      if (!lo.length && !ngoai.length) break;

      // Tải lô này bằng một nhóm việc chạy song song; một tệp bị chặn thì cả lô dừng ngay.
      const ketQua = new Map<string, KetQuaTai>();
      let chiMuc = 0;
      let loiChan: RunStopped | null = null;
      const worker = async (): Promise<void> => {
        for (;;) {
          if (loiChan) return;
          const chi = chiMuc++;
          if (chi >= lo.length) return;
          try {
            keoDan.assertRunning();
          } catch (e) {
            loiChan = e as RunStopped; // quá trần hoặc yêu cầu dừng
            return;
          }
          keoDan.calls++;
          const k = await taiAnh(lo[chi].url, anh);
          ketQua.set(lo[chi].url, k);
          if (k.loi === "ok") {
            loiLien = 0;
          } else if (k.loi === "chan") {
            loiChan = keoDan.block(`máy chủ ảnh trả HTTP ${k.http} (${k.chiTiet ?? "không rõ lý do"})`);
            return;
          } else if (!LOI_VINH_VIEN.has(k.loi)) {
            loiLien++;
            if (loiLien >= MAX_LOI_LIEN) {
              loiChan = keoDan.stopRun("network-down", `${MAX_LOI_LIEN} tệp ảnh lỗi mạng liền nhau`);
              return;
            }
          }
        }
      };
      await Promise.all(Array.from({ length: Math.max(1, Math.min(anh.luongSong, lo.length)) }, worker));

      const tep: Array<{ name: string; bytes: Buffer }> = [];
      const daTai: string[] = [];
      const loi: Record<string, string> = {};
      const muc: MucMedia[] = [];
      let loByte = 0;
      for (const a of lo) {
        const k = ketQua.get(a.url);
        if (!k) continue; // chưa tới lượt (dừng giữa lô) — lượt sau làm
        if (k.loi === "ok" && k.bytes) {
          const name = tenTepCua(a.url, duoiCua(k.kieu, a.url));
          tep.push({ name, bytes: k.bytes });
          daTai.push(hashUrl(a.url));
          loByte += k.bytes.length;
          muc.push({ url: a.url, file: name, sha256: sha256Cua(k.bytes), bytes: k.bytes.length });
        } else {
          if (LOI_VINH_VIEN.has(k.loi)) loi[hashUrl(a.url)] = k.loi;
          conLoiMang++;
          muc.push({ url: a.url, error: k.loi });
        }
      }
      for (const u of ngoai) {
        loi[hashUrl(u)] = "host-not-allowed";
        muc.push({ url: u, error: "host-not-allowed" });
      }
      if (!tep.length && !Object.keys(loi).length && !ngoai.length) {
        dung = loiChan; // cả lô chỉ toàn lỗi mạng: không có gì để chốt
        continue;
      }
      const item = makeItem(
        "anh_du_an",
        `du-an-${d.id}-anh-${i + 1}`,
        { media: [...(ngoai.map((url) => ({ url }))), ...lo.filter((a) => ketQua.has(a.url)).map((a) => ({ url: a.url, ...(a.nhom.length ? { nhom: a.nhom } : {}) }))] },
        { request: { duAn: d.id }, soFile: tep.length, soByte: loByte, mediaFiles: muc },
        at(),
      );
      await writer.addWithFiles(item, tep);
      await chotVaLuu(o); // lô chốt xong rồi mới ghi tiến độ
      await tienDo.append({ duAn: d.id, ...(daTai.length ? { daTai } : {}), ...(Object.keys(loi).length ? { loi } : {}) });
      items++;
      failed += muc.filter((m) => m.error && m.error !== "host-not-allowed").length;
      soFile += tep.length;
      soByte += loByte;
      soFileDuAn += tep.length;
      soLoiDuAn += Object.keys(loi).length;
      dung = loiChan;
    }
    if (!dung) {
      if (conLoiMang > 0) continue; // còn ảnh lỗi mạng: để lượt sau thử lại, chưa đánh dấu xong
      await tienDo.append({ duAn: d.id, xong: true, soFile: soFileDuAn, soLoi: soLoiDuAn });
      soDuAnXong++;
      o.log({ suKien: "anh-du-an-xong", duAn: d.id, soFile: soFileDuAn, soLoi: soLoiDuAn });
    }
  }
  if (dung) throw dung;
  return { phase: o.phase, calls: keoDan.calls - started, items, failed, so: { soDuAnXong, soFile, soByte, soLoi: failed } };
}

const sha256Cua = (b: Buffer): string => createHash("sha256").update(b).digest("hex");
