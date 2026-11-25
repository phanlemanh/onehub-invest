/**
 * Pha `images` — tải TOÀN BỘ ảnh dự án vào kho chuẩn (mốc mở rộng, claudedp-2411-73).
 *
 * Việc phải làm đọc từ kho (catalog.ts), không gọi API. Có hai LỢT chạy bằng hai tiến trình riêng (thư mục trạng
 * thái riêng) để không chậm nhau: lượt «chính nguồn» (ảnh trên máy chủ của nguồn, link có hạn) và lượt «máy chủ
 * ngoài» (ảnh chèn từ nơi khác — Mạnh chốt 25/11: «Lấy cả ảnh ở máy chủ ngoài»).
 *
 * Mỗi lô tối đa `maxFiles` URL của một dự án → một snapshot: item `anh_du_an` mang URL (payload.media) và bảng đối
 * chiếu `meta.mediaFiles`, ảnh gốc dưới `media/`. Mã item ghi theo VỊ TRÍ trong danh sách ảnh của dự án
 * (`du-an-<id>-anh-<từ>-<tới>`), nên hai lượt khác nhau không bao giờ trùng mã; mỗi item là một phần, bên đọc cộng
 * dồn, KHÔNG lấy «bản mới nhất».
 *
 * Lỗi vĩnh viễn của một URL (xem LOI_VINH_VIEN_ANH) được ghi nhận một lần rồi thôi; lỗi tạm (mạng, 5xx, hết giờ)
 * chưa ghi, lượt sau thử lại, tối đa `toiDaLanThu` lượt rồi ghi `qua-so-lan-thu`. Dự án chỉ được đánh dấu xong khi
 * không còn ảnh dở. Lô chốt xong MỚI ghi tiến độ (nhật ký chỉ-ghi-thêm, một tệp mỗi dự án).
 *
 * Rào: máy chủ của nguồn trả 403 (không phải hết hạn), 429 hay trang HTML thay ảnh → BỊ CHẶN, dừng cả lượt. Máy chủ
 * ngoài chặn → ghi `chan-o-may-chu`, bỏ qua máy chủ đó (nhớ ở tệp `may-chu-bi-chan.json`), lượt vẫn đi tiếp; mỗi
 * máy chủ ngoài tối đa hai lời cùng lúc.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { RunStopped } from "./client.js";
import { LOI_VINH_VIEN_ANH, duoiCua, hashUrl, taiAnh, tenTepCua, type GiaiTen, type KetQuaTai } from "./anh.js";
import { projectImages } from "./catalog.js";
import { makeItem } from "./kinds.js";
import type { KeoDan } from "./keo-dan.js";
import type { PhaseSummary, RunOptions } from "./run.js";
import type { BatchWriter } from "./store.js";
import { NhatKyTienDo } from "./tien-do.js";

export type AnhPhaseOptions = {
  /** Đuôi máy chủ lưu trữ của chính nguồn — đọc từ cấu hình local (tầng A). */
  hostSuffixes: string[];
  /** Lượt này chỉ lấy ảnh ở máy chủ ngoài nguồn (tiến trình riêng). */
  chiNgoai: boolean;
  /** Số tệp tải cùng lúc. */
  luongSong: number;
  maxBytes: number;
  timeoutMs: number;
  /** Không nhận được byte nào quá bấy nhiêu mili-giây thì bỏ tệp đó (lỗi tạm). */
  stallMs?: number;
  userAgent: string;
  /** Đệm thử trong test; mặc định fetch toàn cục. */
  fetchImpl?: typeof fetch;
  /** Đệm thử trong test; mặc định hỏi bộ giải tên của hệ điều hành (chỉ máy chủ ngoài). */
  dnsLookup?: GiaiTen;
  /** Số lượt thử một URL lỗi tạm trước khi ghi nhận `qua-so-lan-thu` (mặc định 3). */
  toiDaLanThu?: number;
  /** Khoảng cách (mili-giây) giữa hai dòng báo «đang tải» (mặc định 60 000). */
  baoMoiMs?: number;
};

type MucMedia = { url: string; file?: string; sha256?: string; bytes?: number; error?: string; chiTiet?: string };

/**
 * «Mất mạng» của máy thu — dừng, không đổ tiếp. Lượt nguồn: bấy nhiêu lỗi tạm ĐƯỢC TÍNH liền nhau. Lượt ngoài: bấy
 * nhiêu MÁY CHỦ KHÁC NHAU cùng lỗi tạm liền nhau (một máy chủ chết kéo theo hàng chục URL của nó — không phải mạng
 * của máy thu hỏng).
 */
const TOI_DA_LOI_LIEN = { nguon: 10, ngoai: 50 };
/**
 * Phanh dự phòng: MỌI lỗi tạm liền nhau, kể cả trên URL đã lỗi ở lượt trước (được miễn trừ ở bộ đếm chính) — một cú
 * rớt mạng thật không được che bởi miễn trừ. Cao hơn bộ đếm chính để cụm URL lỗi kinh niên (đo 25/11: 82 URL liền) qua.
 */
const TOI_DA_LOI_TAT_CA = { nguon: 20, ngoai: 150 };
/**
 * Lỗi «cấp máy chủ»: chứng chỉ, không phân giải được tên, không nối được kịp. Mỗi lỗi như vậy là vĩnh viễn của riêng
 * URL khi mạng vẫn ổn — nhưng khi MẠT MẠNG của máy thu thì MỌI lời đều lỗi kiểu này.
 */
const LOI_CAP_MAY_CHU: ReadonlySet<string> = new Set(["chung-chi", "may-chu-khong-ton-tai", "may-chu-khong-tra-loi"]);
/** Ở lượt ngoài: chuỗi lỗi cấp máy chủ liền nhau (không có tệp nào tải được xen giữa) có bấy nhiêu máy chủ khác nhau thì coi là rớt mạng. */
const NGUONG_MAY_CHU_CAP_LOI = 2;
/**
 * Mỗi máy chủ ngoài tối đa bấy nhiêu lời cùng lúc — mức ban đầu (từng nâng lên sáu chiều 25/11 để tăng tốc, rồi Mạnh
 * chốt 18:18 «giảm lại lượt thu như ban đầu»). Máy chủ nào chặn (403, 429, trang thử thách) thì bỏ máy chủ đó, không lách.
 */
export const TOI_DA_MOT_MAY_CHU_NGOAI = 2;
/** Trần số kết nối tải ảnh một lượt. Ảnh là tệp tĩnh, không gọi API của nguồn nên có trần riêng (khỏi trần 8 của lời API). */
export const MAX_ANH_LUONG_SONG = 16;
const TEN_TEP_MAY_CHU_BI_CHAN = "may-chu-bi-chan.json";
/** Link còn hạn dưới bấy nhiêu mili-giây (5 phút) vẫn được hỏi, để lệch đồng hồ nhỏ không làm bỏ sót ảnh. */
const LEECH_HET_HAN = 300_000;
const BAO_MOI_MS = 60_000;

type TienDoAnh = { daLan: Set<string>; loiVinhVien: Map<string, string>; dem: Map<string, number>; xong: boolean };

function docTienDoAnh(lines: Array<Record<string, unknown>>): TienDoAnh {
  const out: TienDoAnh = { daLan: new Set(), loiVinhVien: new Map(), dem: new Map(), xong: false };
  for (const r of lines) {
    for (const h of (r.daTai as string[] | undefined) ?? []) out.daLan.add(h);
    for (const [h, loi] of Object.entries((r.loi ?? {}) as Record<string, string>)) out.loiVinhVien.set(h, loi);
    for (const [h, n] of Object.entries((r.dem ?? {}) as Record<string, number>)) out.dem.set(h, n);
    if (r.xong === true) out.xong = true;
  }
  return out;
}

type MayChuBiChan = Map<string, { lyDo: string; lanDau: string; soLan: number }>;

async function docMayChuBiChan(duong: string): Promise<MayChuBiChan> {
  try {
    return new Map(Object.entries(JSON.parse(await readFile(duong, "utf8")) as Record<string, { lyDo: string; lanDau: string; soLan: number }>));
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return new Map();
    throw e;
  }
}

async function ghiMayChuBiChan(duong: string, ds: MayChuBiChan): Promise<void> {
  await writeFile(`${duong}.moi`, JSON.stringify(Object.fromEntries(ds), null, 2));
  await rename(`${duong}.moi`, duong);
}

const hostCua = (url: string): string => {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return url;
  }
};
const sha256Cua = (b: Buffer): string => createHash("sha256").update(b).digest("hex");

export async function imagesPhase(o: RunOptions, anh: AnhPhaseOptions, keoDan: KeoDan): Promise<PhaseSummary> {
  const started = keoDan.calls;
  const writer = o.writer as BatchWriter;
  const motSnapshot = writer.maxFiles ?? 100;
  const at = () => (o.now ?? (() => new Date()))().toISOString();
  const lop: "nguon" | "ngoai" = anh.chiNgoai ? "ngoai" : "nguon";
  const tienDoDir = o.tienDoDir as string;
  const kq = await projectImages(o.snapshotRoot as string, anh.hostSuffixes);
  const toiDaLanThu = anh.toiDaLanThu ?? 3;
  const toiDaLoiLien = TOI_DA_LOI_LIEN[lop];
  const toiDaLoiTatCa = TOI_DA_LOI_TAT_CA[lop];
  const toiDaMotMayChu = lop === "ngoai" ? Math.min(TOI_DA_MOT_MAY_CHU_NGOAI, Math.max(1, anh.luongSong)) : Math.max(1, anh.luongSong);
  const tepBiChan = join(tienDoDir, TEN_TEP_MAY_CHU_BI_CHAN);
  // Máy chủ ngoài đã chặn được nhớ cho cả hai lượt (nguồn có thể chuyển hướng sang máy chủ ngoài).
  const mayChuBiChan: MayChuBiChan = await docMayChuBiChan(tepBiChan);
  const khoaMayChuChan = new Set(mayChuBiChan.keys());
  // Bằng chứng đồng hồ máy thu đúng (một lần mỗi lượt): chưa có thì không đoán link hết hạn — xem ở vòng dự án.
  let dongHoDung: boolean | null = null;

  let items = 0;
  let failed = 0;
  let soFile = 0;
  let soByte = 0;
  let soDuAnXong = 0;
  let dung: RunStopped | null = null;
  // «Mất mạng»: các bộ đếm dưới chạy suốt lượt (qua cả ranh giới dự án), chỉ một tệp tải được mới đặt về không.
  let loiLien = 0; // lượt nguồn: lỗi tạm ĐƯỢC TÍNH liền nhau
  const mayChuLoiLien = new Set<string>(); // lượt ngoài: máy chủ khác nhau trong chuỗi lỗi tạm được tính
  let loiTamTatCa = 0; // MỌI lỗi tạm KHÔNG có phản hồi HTTP liền nhau, kể cả được miễn trừ — phanh dự phòng
  const mayChuCapLoi = new Set<string>(); // máy chủ khác nhau trong chuỗi lỗi CẤP MÁY CHỦ liền nhau (nhận ra rớt mạng)
  const datLaiMang = (): void => {
    loiLien = 0;
    mayChuLoiLien.clear();
    loiTamTatCa = 0;
    mayChuCapLoi.clear();
  };

  for (const d of kq.duAn) {
    if (dung) break;
    const ds = d.anh.filter((a) => (a.ngoai ? "ngoai" : "nguon") === lop);
    if (!ds.length) continue;
    const tienDo = new NhatKyTienDo(join(tienDoDir, `${lop === "ngoai" ? "anh-ngoai" : "anh"}-${d.id}.jsonl`));
    const td = docTienDoAnh(await tienDo.readAll());
    if (td.xong) continue;
    const con = ds
      .map((a, i) => ({ ...a, vi: i + 1 }))
      .filter((a) => !td.daLan.has(hashUrl(a.url)) && !td.loiVinhVien.has(hashUrl(a.url)));
    let conLoiMang = 0;
    let soFileDuAn = 0;
    let soLoiDuAn = 0;

    const gio = (o.now ?? (() => new Date()))().getTime();
    const dangChayMayChu = new Map<string, number>();
    let loiChan: RunStopped | null = null;
    let biSua = false; // có máy chủ ngoài vừa bị chặn trong dự án này
    let daXong = 0; // số tệp của dự án đã có kết quả trong lượt này
    let dangTai = 0; // số tệp đang nhận
    let byteNhan = 0; // số byte đã nhận được trong lượt này (kể cả tệp đang dở)
    // Nguồn chặn thì bỏ ngay mọi tệp đang dở của dự án: không nhận tiếp từ máy chủ vừa chặn, cũng không chờ nó.
    const acBo = new AbortController();
    let daNhan = 0;
    const tuyChonTai = {
      ...anh,
      duoiNguon: anh.hostSuffixes,
      keNgoai: true,
      signal: acBo.signal,
      mayChuBiChan: khoaMayChuChan,
      trenKhoi: (n: number) => {
        byteNhan += n - daNhan;
        daNhan = n;
      },
    };
    const nguonVuaChan = (): boolean => loiChan !== null && loiChan.reason === "blocked";
    const nhanKetQua = (x: KetQuaTai, a: { url: string }): KetQuaTai => {
      if (x.loi !== "chan") return x;
      if (x.mayChuCuoi === "nguon") {
        // Bước cuối là máy chủ của nguồn: bị chặn thật — dừng cả lượt.
        loiChan ??= keoDan.block(`máy chủ ảnh của nguồn trả HTTP ${x.http} (${x.chiTiet ?? "không rõ lý do"})`);
        acBo.abort(new Error("nguồn chặn"));
        return { ...x, loi: "loi", chiTiet: "nguồn chặn" };
      }
      // Bước cuối là máy chủ ngoài (kể cả khi nguồn chuyển hướng sang đó): máy chủ đó chặn — nhớ và bỏ qua, không tính
      // là nguồn chặn.
      const hNgoai = hashUrl(hostCua(x.urlCuoi ?? a.url));
      if (!mayChuBiChan.has(hNgoai)) {
        mayChuBiChan.set(hNgoai, { lyDo: x.chiTiet ?? `HTTP ${x.http}`, lanDau: at(), soLan: 1 });
        khoaMayChuChan.add(hNgoai);
        biSua = true;
      }
      return { ...x, loi: "chan-o-may-chu" as const };
    };

    // Chỉ tin dự đoán «link đã hết hạn» sau khi có bằng chứng đồng hồ máy thu đúng: hỏi thử MỘT link đoán đã hết hạn.
    // Máy chủ bảo đã hết hạn → dự đoán đúng cho cả lượt này. Máy chủ vẫn trả ảnh → đồng hồ máy thu lệch: không đoán,
    // hỏi hết (không link nào bị bỏ oan). Chưa kết luận được (lỗi mạng) thì dự án này không đoán.
    const doHetHan = (a: { hetHan: string | null }): boolean => a.hetHan !== null && Date.parse(a.hetHan) + LEECH_HET_HAN <= gio;
    let loiThu: { a: (typeof con)[number]; x: KetQuaTai } | null = null;
    if (dongHoDung !== true && con.some(doHetHan)) {
      const a = con.find(doHetHan)!;
      try {
        keoDan.assertRunning();
      } catch (e) {
        loiChan = e as RunStopped;
      }
      if (!loiChan) {
        keoDan.calls++;
        const x = nhanKetQua(await taiAnh(a.url, tuyChonTai), a);
        if (x.loi === "het-han" || x.loi === "ok") {
          dongHoDung = x.loi === "het-han";
          o.log({
            suKien: "anh-dong-ho",
            duAn: d.id,
            dung: dongHoDung,
            lechChu: x.lechChu ?? null,
            ...(dongHoDung ? {} : { thongBao: "máy chủ vẫn trả ảnh cho một link đoán đã hết hạn — đồng hồ máy thu có thể lệch: lượt này không đoán, hỏi hết" }),
          });
        }
        loiThu = { a, x };
      }
    }
    if (loiChan) {
      dung = loiChan;
      break;
    }

    // Chia lô theo VỊ TRÍ trong danh sách ảnh (mã item ổn định). Việc của MỌI lô đổ vào một hàng đợi chung của dự án:
    // tệp gốc to trên đường chậm ở lô này không giữ luồng của lô khác (đo 25/11: một tệp 44 MB giữ lô sáu phút, năm
    // luồng ngồi không). Mỗi lô chốt ngay khi đủ kết quả, không chờ lô trước; mã theo vị trí nên thứ tự chốt không ảnh
    // hưởng gì. Các lô được chốt nối tiếp nhau — mỗi lô vẫn là một snapshot.
    type LoAnh = { a: typeof con; ketQua: Map<string, KetQuaTai>; conLai: number; coTai: number; daChot: boolean };
    const cacLo: LoAnh[] = [];
    for (let i = 0; i < con.length; i += motSnapshot) {
      const lo: LoAnh = { a: con.slice(i, i + motSnapshot), ketQua: new Map(), conLai: 0, coTai: 0, daChot: false };
      // Link ký số đã quá hạn theo chính tham số của nó (và đồng hồ đã có bằng chứng): không gửi lời nào, ghi nhận là hết hạn.
      for (const anh of lo.a) {
        if (dongHoDung === true && doHetHan(anh)) lo.ketQua.set(anh.url, { url: anh.url, loi: "het-han", http: 0, chiTiet: "du-doan-het-han" });
        else lo.conLai++;
      }
      cacLo.push(lo);
    }
    if (loiThu) {
      const lo = cacLo.find((x) => x.a.includes(loiThu!.a))!;
      if (!lo.ketQua.has(loiThu.a.url)) lo.conLai--;
      lo.ketQua.set(loiThu.a.url, loiThu.x);
      lo.coTai++;
    }
    // URL đã lỗi tạm ở lượt trước xếp xuống CUỐI hàng của dự án: phần còn tươi tải trước, và cụm URL lỗi kinh niên ở
    // đầu hàng không cộng dồn thành «mất mạng» giả (lượt thật 25/11 17:47 dừng oan sau 102 lời). Mã item vẫn theo vị trí
    // gốc trong danh sách ảnh, thứ tự tải không đổi mã. Băm máy chủ tính một lần ở đây (vòng chờ cũ băm lại mỗi 3 ms).
    const daLoi = new Set(con.filter((a) => (td.dem.get(hashUrl(a.url)) ?? 0) > 0).map((a) => a.url));
    const hang = cacLo.flatMap((lo) =>
      lo.a.map((a, k) => ({ lo, k, a, h: hashUrl(hostCua(a.url)), mienTru: daLoi.has(a.url) })).filter((v) => !lo.ketQua.has(v.a.url)),
    );
    hang.sort((x, y) => Number(x.mienTru) - Number(y.mienTru));
    const daLay = new Set<number>();
    let daXuLi = 0; // đã lấy đi hoặc đã bỏ qua
    let loiChot: unknown = null; // lỗi khi chốt snapshot: dừng hết, không ghi tiến độ của lô ấy

    // Worker nhàn (còn việc nhưng máy chủ của việc đó đang ở giới hạn) không hỏi vòng theo đồng hồ — đốt CPU (đo lượt
    // soát 25/11: càng nhiều luồng càng chậm). Mỗi worker nhàn chờ một promise chung; một tệp tải xong, hoặc lượt dừng,
    // thì đánh thức tất cả.
    const dangCho = new Set<() => void>();
    const danhThuc = (): void => {
      for (const g of dangCho) g();
      dangCho.clear();
    };
    const choViec = (): Promise<void> => new Promise<void>((g) => dangCho.add(g));
    let hangChot: Promise<void> = Promise.resolve();
    const xepChot = (lo: LoAnh): void => {
      lo.daChot = true;
      hangChot = hangChot
        .then(() => chotLo(lo))
        .catch((e: unknown) => {
          loiChot = e;
          danhThuc();
        });
    };
    const kiemChot = (lo: LoAnh): void => {
      if (lo.conLai <= 0 && !lo.daChot) xepChot(lo);
    };

    const layViec = (): number | "het" | -1 => {
      for (let i = 0; i < hang.length; i++) {
        if (daLay.has(i)) continue;
        const v = hang[i];
        const h = v.h;
        if (mayChuBiChan.has(h)) {
          daLay.add(i); // máy chủ này đã chặn: không hỏi nữa
          daXuLi++;
          v.lo.conLai--;
          kiemChot(v.lo);
          continue;
        }
        if ((dangChayMayChu.get(h) ?? 0) < toiDaMotMayChu) {
          daLay.add(i);
          daXuLi++;
          dangChayMayChu.set(h, (dangChayMayChu.get(h) ?? 0) + 1);
          return i;
        }
      }
      return daXuLi >= hang.length ? "het" : -1; // -1: còn việc nhưng máy chủ đang bận
    };
    const worker = async (): Promise<void> => {
      try {
        for (;;) {
          if (loiChan || loiChot) return;
          const i = layViec();
          if (i === "het") return;
          if (i === -1) {
            await choViec();
            continue;
          }
          const { lo, a, h, mienTru } = hang[i];
          try {
            keoDan.assertRunning();
          } catch (e) {
            loiChan = e as RunStopped; // quá trần hoặc yêu cầu dừng
            return;
          }
          keoDan.calls++;
          daNhan = 0;
          dangTai++;
          let x: KetQuaTai;
          try {
            x = await taiAnh(a.url, tuyChonTai);
          } finally {
            dangTai--;
            dangChayMayChu.set(h, Math.max(0, (dangChayMayChu.get(h) ?? 1) - 1));
            danhThuc();
          }
          x = nhanKetQua(x, a);
          if (nguonVuaChan()) return; // nguồn vừa chặn: tệp đang dở bị bỏ, không ghi nhận, không tính là một lượt thử lỗi
          daXong++;
          const tuCapMayChu = LOI_CAP_MAY_CHU.has(x.loi);
          if (tuCapMayChu) {
            // Lỗi cấp máy chủ khi RỚT MẠNG: mọi lời đều lỗi kiểu này. Ghi vĩnh viễn từng URL thì một cú rớt mạng đốt
            // sạch phần hàng còn lại mà lượt vẫn kết thúc bình thường (phát hiện nghiêm trọng của lượt soát 25/11 —
            // nhật ký tiến độ chỉ ghi thêm nên không còn đường thử lại). Ở lượt nguồn luôn coi là tạm (tối đa ba lượt
            // rồi mới ghi nhận). Ở lượt ngoài chỉ là vĩnh viễn của riêng máy chủ khi chuỗi lỗi cấp máy chủ liền nhau
            // chưa có hai máy chủ khác nhau: một máy chủ chết là chuyện của nó, nhiều máy chủ cùng chết là mạng của ta.
            mayChuCapLoi.add(h);
            if (lop === "nguon" || mayChuCapLoi.size >= NGUONG_MAY_CHU_CAP_LOI) x = { ...x, loi: "loi", chiTiet: `${x.loi}: ${x.chiTiet ?? ""}`.trim() };
          }
          if (!mayChuBiChan.has(h)) {
            lo.ketQua.set(a.url, x); // máy chủ (ngoài) của URL này vừa bị chặn trong lúc tải: ghi là bị chặn
            lo.coTai++;
          }
          lo.conLai--;
          kiemChot(lo);
          if (x.loi === "ok" && x.bytes) {
            datLaiMang();
          } else if (!LOI_VINH_VIEN_ANH.has(x.loi)) {
            if (!tuCapMayChu) mayChuCapLoi.clear(); // đã tới được máy chủ (lỗi 5xx, treo…): mạng còn lên
            // URL đã lỗi tạm ở lượt trước là lỗi kinh niên của riêng nó: không tính vào bộ đếm chính, chỉ vào phanh dự phòng.
            // Phanh dự phòng chỉ đếm lời KHÔNG tới được máy chủ (chưa có phản hồi HTTP): máy chủ đã trả lời (trang lỗi 5xx,
            // trang HTML) thì mạng của ta còn lên. Lượt chỉ còn URL đã lỗi không có tệp nào thành công để đặt lại bộ đếm —
            // đêm 25/11 lượt chốt các URL ngoài dừng oan ở 150.
            if (!(x.http > 0)) loiTamTatCa++;
            if (!mienTru) {
              if (lop === "ngoai") mayChuLoiLien.add(h);
              else loiLien++;
            }
            const soDem = lop === "ngoai" ? mayChuLoiLien.size : loiLien;
            if (soDem >= toiDaLoiLien) {
              loiChan = keoDan.stopRun("network-down", lop === "ngoai" ? `${soDem} máy chủ khác nhau cùng lỗi mạng liền nhau` : `${soDem} tệp ảnh lỗi mạng liền nhau`);
              return;
            }
            if (loiTamTatCa >= toiDaLoiTatCa) {
              loiChan = keoDan.stopRun("network-down", `${toiDaLoiTatCa} tệp ảnh lỗi mạng liền nhau, kể cả URL đã lỗi từ lượt trước`);
              return;
            }
          }
        }
      } finally {
        danhThuc(); // worker này thoát (dừng, lỗi chốt): đánh thức các worker đang chờ để chúng thấy lý do dừng
      }
    };
    async function chotLo(lo: LoAnh): Promise<void> {
      if (loiChot) return; // một lô chốt hỏng: không chốt tiếp nữa, lượt dừng với lỗi ấy
      const tep: Array<{ name: string; bytes: Buffer }> = [];
      const daTai: string[] = [];
      const loi: Record<string, string> = {};
      const dem: Record<string, number> = {};
      const muc: MucMedia[] = [];
      const daiDien: typeof con = []; // các URL thực sự có mặt trong item này
      let loByte = 0;
      for (const a of lo.a) {
        const h = hashUrl(a.url);
        const hostBiChan = mayChuBiChan.get(hashUrl(hostCua(a.url)));
        if (hostBiChan && !td.daLan.has(h) && !lo.ketQua.get(a.url)?.bytes) {
          loi[h] = "chan-o-may-chu";
          muc.push({ url: a.url, error: "chan-o-may-chu", chiTiet: hostBiChan.lyDo });
          daiDien.push(a);
          continue;
        }
        const x = lo.ketQua.get(a.url);
        if (!x) continue; // chưa có kết quả (dừng giữa lô) — lượt sau làm
        daiDien.push(a);
        if (x.loi === "ok" && x.bytes) {
          const name = tenTepCua(a.url, duoiCua(x.kieu, a.url));
          tep.push({ name, bytes: x.bytes });
          daTai.push(h);
          loByte += x.bytes.length;
          muc.push({ url: a.url, file: name, sha256: sha256Cua(x.bytes), bytes: x.bytes.length });
        } else if (LOI_VINH_VIEN_ANH.has(x.loi)) {
          loi[h] = x.loi;
          muc.push({ url: a.url, error: x.loi, chiTiet: x.chiTiet });
        } else {
          // Lỗi tạm: chưa ghi là lỗi; đếm lượt thử, quá hạn thì ghi nhận.
          const n = (td.dem.get(h) ?? 0) + 1;
          td.dem.set(h, n);
          dem[h] = n;
          conLoiMang++;
          if (n >= toiDaLanThu) {
            loi[h] = "qua-so-lan-thu";
            muc.push({ url: a.url, error: "qua-so-lan-thu", chiTiet: x.chiTiet ? `${x.loi}: ${x.chiTiet}` : x.loi });
          } else {
            muc.push({ url: a.url, error: x.loi, chiTiet: x.chiTiet });
          }
        }
      }
      const soLoiLo = Object.values(loi).filter((x) => x !== "chan-o-may-chu").length;
      const tienDoMoi = { ...(daTai.length ? { daTai } : {}), ...(Object.keys(loi).length ? { loi } : {}), ...(Object.keys(dem).length ? { dem } : {}) };
      if (!tep.length && !Object.keys(loi).length) {
        // Không có gì chốt (cả lô chỉ toàn lỗi tạm): chỉ ghi số lượt thử — dòng này không khẳng định việc gì đã làm.
        if (Object.keys(dem).length) await tienDo.append({ dem });
        return;
      }
      lo.ketQua.clear(); // tệp đã vào lô chốt: trả bộ nhớ
      const vi = daiDien.map((a) => a.vi);
      const item = makeItem(
        "anh_du_an",
        `du-an-${d.id}-anh${lop === "ngoai" ? "-ngoai" : ""}-${Math.min(...vi)}-${Math.max(...vi)}`,
        { media: daiDien.map((a) => ({ url: a.url, ...(a.nhom.length ? { nhom: a.nhom } : {}) })) },
        { request: { duAn: d.id }, nhomMayChu: lop, soFile: tep.length, soByte: loByte, mediaFiles: muc },
        at(),
      );
      await writer.addWithFiles(item, tep);
      await writer.flush(); // lô chốt xong rồi mới ghi tiến độ (trạng thái chung do trình điều khiển lưu)
      if (Object.keys(tienDoMoi).length) await tienDo.append(tienDoMoi);
      items++;
      failed += soLoiLo;
      soFile += tep.length;
      soByte += loByte;
      soFileDuAn += tep.length;
      soLoiDuAn += Object.keys(loi).length;
      o.log({
        suKien: "anh-lot",
        duAn: d.id,
        nhomMayChu: lop,
        tu: Math.min(...vi),
        toi: Math.max(...vi),
        soFile: tep.length,
        soByte: loByte,
        soLoi: Object.keys(loi).length,
        soDuDoanHetHan: muc.filter((m) => m.chiTiet === "du-doan-het-han").length,
      });
    }

    for (const lo of cacLo) kiemChot(lo); // lô chỉ toàn link đã hết hạn: chốt luôn
    // Theo giờ thật, mỗi khoảng báo một dòng «đang tải» (bao nhiêu tệp đang nhận, bao nhiêu byte đã nhận): lô có tệp gốc
    // to trên đường chậm kéo dài nhiều phút (đo 25/11: 44 MB, 0,2 MB/s một kết nối) — không có dòng này thì không phân
    // biệt được đang tải với treo.
    const bao = setInterval(() => {
      if (dangTai > 0) o.log({ suKien: "anh-dang-tai", duAn: d.id, nhomMayChu: lop, dangTai, daXong, soLuong: hang.length, byteDangNhan: byteNhan });
    }, anh.baoMoiMs ?? BAO_MOI_MS);
    bao.unref?.();
    try {
      await Promise.all(Array.from({ length: Math.max(1, Math.min(anh.luongSong, hang.length)) }, worker));
    } finally {
      clearInterval(bao);
    }
    if (biSua) {
      await mkdir(tienDoDir, { recursive: true });
      await ghiMayChuBiChan(tepBiChan, mayChuBiChan);
    }
    // Dừng giữa dự án: phần đã tải của mọi lô dở vẫn được chốt (mã theo vị trí, lượt sau làm phần thiếu).
    for (const lo of cacLo) if (!lo.daChot && lo.coTai > 0) xepChot(lo);
    await hangChot;
    if (loiChot) throw loiChot;
    if (loiChan) {
      dung = loiChan;
      break;
    }
    if (conLoiMang > 0) continue; // còn ảnh lỗi tạm: để lượt sau thử lại, chưa đánh dấu xong
    await tienDo.append({ duAn: d.id, xong: true, soFile: soFileDuAn, soLoi: soLoiDuAn });
    soDuAnXong++;
    o.log({ suKien: "anh-du-an-xong", duAn: d.id, nhomMayChu: lop, soFile: soFileDuAn, soLoi: soLoiDuAn });
  }
  if (dung) throw dung;
  return { phase: o.phase, calls: keoDan.calls - started, items, failed, so: { soDuAnXong, soFile, soByte, soLoi: failed } };
}
