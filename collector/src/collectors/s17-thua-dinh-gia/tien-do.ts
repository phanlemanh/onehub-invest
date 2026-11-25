/**
 * Nhật ký tiến độ CHỈ GHI THÊM của bộ thu S17 (mốc mở rộng, claudedp-2411-73).
 *
 * Mốc mở rộng lấy khoảng 650.000 căn: trạng thái `state.json` lưu nguyên khối sau mỗi lô không chịu nổi (mỗi lần
 * lưu cả chục MB, mười ba nghìn lần một lượt). Mỗi dự án có một tệp `.jsonl` riêng; mỗi lô chốt xong thì thêm MỘT
 * dòng, không bao giờ ghi lại dòng cũ. Chạy lại thì đọc lại tệp. Dòng cuối bị cụt (gãy giữa lúc ghi) được bỏ qua —
 * dòng hỏng giữa tệp là hỏng dữ liệu thật, phải báo.
 */
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";

export type BanGhi = Record<string, unknown>;

export class NhatKyTienDo {
  constructor(private readonly path: string) {}

  async append(record: BanGhi): Promise<void> {
    await mkdir(dirname(this.path), { recursive: true });
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

/** Chốt lô đang dở rồi mới lưu trạng thái — cùng luật «trạng thái không bao giờ nói đã làm cho việc chưa chốt». */
export async function chotVaLuu(o: { writer: { flush(): Promise<string | null> }; save: () => Promise<void> }): Promise<void> {
  await o.writer.flush();
  await o.save();
}
