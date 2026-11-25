/**
 * Nhật ký tiến độ CHỈ GHI THÊM của bộ thu S17 (mốc mở rộng, claudedp-2411-73).
 *
 * Mốc mở rộng lấy khoảng 650.000 căn: trạng thái `state.json` lưu nguyên khối sau mỗi lô không chịu nổi (mỗi lần
 * lưu cả chục MB, mười ba nghìn lần một lượt). Mỗi dự án có một tệp `.jsonl` riêng; mỗi lô chốt xong thì thêm MỘT
 * dòng, không bao giờ ghi lại dòng cũ. Chạy lại thì đọc lại tệp. Dòng cuối bị cụt (gãy giữa lúc ghi) được bỏ qua —
 * dòng hỏng giữa tệp là hỏng dữ liệu thật, phải báo.
 */
import { appendFile, mkdir, open, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type BanGhi = Record<string, unknown>;

export class NhatKyTienDo {
  constructor(private readonly path: string) {}

  async append(record: BanGhi): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
    if (!(await ketThucBangXuongDong(this.path))) {
      // Lượt trước gãy giữa lúc ghi: dòng cuối là mảnh cụt. Thay mảnh ấy bằng MỘT bản ghi hợp lệ ghi rõ «bị cắt»
      // (giữ 200 ký tự đầu) — nếu chỉ xuống dòng rồi nối tiếp thì mảnh cụt thành dòng hỏng giữa tệp, lượt sau lỗi luôn.
      const text = await readFile(this.path, "utf8");
      const i = text.lastIndexOf("\n");
      await writeFile(this.path, `${text.slice(0, i + 1)}${JSON.stringify({ biCat: true, goc: text.slice(i + 1, i + 201) } satisfies BanGhi)}\n`);
    }
    await appendFile(this.path, `${JSON.stringify(record)}\n`, "utf8");
  }

  async readAll(): Promise<BanGhi[]> {
    let text: string;
    try {
      text = await readFile(this.path, "utf8");
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw e;
    }
    const lines = text.split("\n");
    if (lines.at(-1) === "") lines.pop();
    const out: BanGhi[] = [];
    for (let i = 0; i < lines.length; i++) {
      try {
        out.push(JSON.parse(lines[i]) as BanGhi);
      } catch (e) {
        if (i === lines.length - 1) break; // dòng cuối cụt: lượt trước gãy giữa lúc ghi
        throw new Error(`${this.path}: dòng ${i + 1} hỏng (${String(e).slice(0, 80)})`);
      }
    }
    return out;
  }
}

async function ketThucBangXuongDong(path: string): Promise<boolean> {
  let fh: Awaited<ReturnType<typeof open>>;
  try {
    fh = await open(path, "r");
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return true; // tệp chưa có: không có gì để dính
    throw e;
  }
  try {
    const { size } = await fh.stat();
    if (size === 0) return true;
    const buf = Buffer.alloc(1);
    await fh.read(buf, 0, 1, size - 1);
    return buf[0] === 0x0a;
  } finally {
    await fh.close();
  }
}

/**
 * Chốt lô đang dở. Trạng thái chung (`state.json`) KHÔNG ghi ở đây: các pha của mốc mở rộng không đổi trạng thái
 * chung, còn trình điều khiển đã lưu nó khi lượt xong hay dừng (lượt soát 25/11: ghi mỗi lô là hàng chục GB ghi đĩa
 * vô ích). Tiến độ của pha nằm ở nhật ký, ghi sau khi chốt.
 */
export async function chot(o: { writer: { flush(): Promise<string | null> } }): Promise<void> {
  await o.writer.flush();
}
