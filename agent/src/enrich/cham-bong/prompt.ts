// prompt.ts — NB1 cham-bong-bo-sung-tin: lời nhắc đọc mù năm ô «Bổ sung tin» (design §1, AC-2). Lời nhắc chỉ mang tên nhóm, tên các
// ô cần đọc và chữ bài gốc đầy đủ trong một khối có ranh giới cố định. KHÔNG có tham số nào mang giá trị đề xuất, model đã đề xuất
// hay kết quả lần đọc kia — kiểu DauVao không có chỗ cho chúng. Chỉ nhận giá trị nói thẳng trong chữ bài (sổ quyết định S2).
// Đổi chữ lời nhắc là đổi prompt_version trong agent/config/cham-bong-bo-sung-tin.json (khoá dùng lại đổi theo → đọc lại hết).
import { createHash } from "node:crypto";
import { PROPERTY_TYPE as PT } from "../../vocab.generated.js";
import type { OCham } from "./ket-cuc.js";

export const RANH_BAI = { mo: "<<<BAI_GOC", dong: "BAI_GOC>>>" } as const;
/** Mã loại hình đọc được (từ vựng chung, bỏ «unknown»). */
export const LOAI_HINH: readonly string[] = Object.values(PT).filter((v) => v !== PT.unknown);

export type DauVao = { text: string; group_name: string | null; o: OCham[] };

export const HUONG_DAN = `Bạn là người gắn nhãn tin đăng trong nhóm chat môi giới bất động sản Việt Nam. Bạn nhận tên nhóm, danh sách ô cần đọc và chữ bài nằm giữa hai dòng ${RANH_BAI.mo} và ${RANH_BAI.dong}. Đọc chữ bài và điền ĐÚNG các ô được hỏi cho căn được rao.

Mỗi ô là một object {"v": giá trị hoặc null, "trich": chuỗi, "can_cu": chuỗi}:
- "v": chỉ điền khi CHỮ BÀI nói thẳng giá trị đó. Không đoán, không suy từ kiến thức nghề, quy ước hay tên nhóm. Không có thì null.
- "trich": chép NGUYÊN VĂN một đoạn ngắn của chữ bài chứa giá trị (không sửa chữ, không thêm dấu). v null thì "".
- "can_cu": một câu nói vì sao đoạn trích cho ra giá trị. v null thì "".

Các ô có thể được hỏi:
- property_type: một trong ${LOAI_HINH.map((v) => `"${v}"`).join(", ")} — "${PT.apartment}" căn hộ chung cư, studio, duplex, penthouse; "${PT.house}" nhà phố, liền kề, biệt thự, shophouse; "${PT.land}" đất; "${PT.room}" phòng trọ; "${PT.commercial}" mặt bằng, văn phòng.
- bedrooms: số phòng ngủ, số nguyên; studio = 0; «1PN+», «2N+1» → số phòng ngủ chính (1, 2).
- bathrooms: số WC / phòng vệ sinh, số nguyên.
- block_raw: mã toà như bài viết, giữ dấu chấm, vd "PR2", "S1.03", "TC1".
- street_raw: tên đường hoặc phố như bài viết, vd "Nguyễn Văn Linh".

Trả đúng MỘT object JSON, không markdown, không giải thích, khoá là đúng tên các ô được hỏi.`;

/** Lời nhắc của một lần đọc; `sha` = sha256(system + "\n" + user) ghi vào từng kết quả để soát lại. */
export function loiNhac(d: DauVao): { system: string; user: string; sha: string } {
  const user = [
    `Tên nhóm: ${d.group_name ?? "(không có)"}`,
    `Ô cần đọc: ${d.o.join(", ")}`,
    RANH_BAI.mo,
    d.text,
    RANH_BAI.dong,
  ].join("\n");
  return { system: HUONG_DAN, user, sha: createHash("sha256").update(`${HUONG_DAN}\n${user}`).digest("hex") };
}
