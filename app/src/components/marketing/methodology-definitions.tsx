import { Badge } from "@/components/reui/badge";
import { COST_DEFAULTS, LT_TAX_PCT } from "@/lib/yield";
import type { Definition } from "./definition-grid";

// Nội dung trang Phương pháp (/methodology) — tách khỏi page.tsx để test đọc đúng mảng trang hiển thị
// (page.tsx chỉ được export metadata + default).

const pct = (v: number) => `${Math.round(v * 100)}%`;

export const METRICS: Definition[] = [
  {
    id: "lich-tuong-lai",
    question: "Số liệu tính trên khoảng thời gian nào?",
    answer:
      "Trên lịch đặt phòng của các tháng TỚI, tính từ ngày quét. Tháng gần đã có nhiều đêm được đặt; tháng xa còn ít, vì khách chưa đặt tới. Vì vậy công suất của các tháng xa thấp hơn thực tế — không có nghĩa là thị trường yếu. Chúng tôi chưa có lịch sử nhiều năm nên chưa so với cùng kỳ năm trước và chưa tính mùa vụ.",
  },
  {
    id: "da-dat",
    question: "Thế nào là một đêm “đã đặt”?",
    answer:
      "Đêm mà lịch Airbnb không còn cho đặt. Con số này có thể gồm cả đêm chủ nhà tự khoá lịch, nên công suất là cận trên của số đêm có khách thật.",
  },
  {
    id: "cong-suat",
    question: "Công suất (occupancy)",
    answer: "Đêm đã đặt ÷ (đêm đã đặt + đêm còn trống). Khi gộp nhiều tháng hoặc nhiều listing, chúng tôi gộp theo số đêm chứ không lấy trung bình các tháng.",
  },
  {
    id: "adr",
    question: "Giá phòng (ADR)",
    answer:
      "Doanh thu ÷ đêm đã đặt. Doanh thu ở đây là giá NIÊM YẾT của đêm, chưa trừ giảm giá, chưa gồm phí dọn dẹp và phí dịch vụ Airbnb. Khi một khu vực có đêm đặt nhưng chưa thu được giá, ADR hiển thị là “—”, không phải 0.",
  },
  {
    id: "revpar",
    question: "RevPAR",
    answer: "Doanh thu ÷ tổng đêm khả dụng (đã đặt + còn trống). Gộp cả giá lẫn công suất vào một số — chỉ số mặc định để xếp hạng phường.",
  },
  {
    id: "listing",
    question: "Listing hoạt động",
    answer: "Số listing có lịch trong tháng đông nhất của cửa sổ dữ liệu.",
  },
  {
    id: "phan-vi",
    question: "Các bậc màu và nhãn “Nhóm đầu / Khá / Trung bình / Thấp”",
    answer:
      "Theo phân vị p30, p60, p90 của các khu vực cùng cấp (phường cùng thị trường, hoặc listing cùng phường). Bản đồ và thanh trong bảng xếp hạng dùng cùng 4 bậc. Bảng xếp hạng chỉ tính khu vực có từ 5 listing trở lên — một hai listing cho số quá cực đoan.",
  },
];

export const YIELD: Definition[] = [
  {
    id: "doanh-thu-mot-can",
    question: "Doanh thu ngắn hạn của một căn được ước tính thế nào?",
    answer:
      "Lấy các listing so sánh: cùng phường và cùng số phòng ngủ (cần ít nhất 5); không đủ thì lấy cả thị trường cùng số phòng ngủ; vẫn không đủ thì lấy cả thị trường. Với mỗi listing: giá niêm yết × công suất 90 đêm đầu của lịch × 365. Kết quả là trung vị, kèm khoảng p25–p75. Diện tích không ảnh hưởng doanh thu vì Airbnb không công bố diện tích.",
  },
  {
    id: "chi-phi",
    question: "Chi phí mặc định gồm những gì?",
    answer: `Phí quản lý ${pct(COST_DEFAULTS.mgmtPct)} doanh thu, phí nền tảng ${pct(COST_DEFAULTS.platformPct)}, thuế ${pct(COST_DEFAULTS.taxPct)} (tham khảo: hộ kinh doanh dịch vụ lưu trú 5% GTGT + 2% TNCN), chi phí cố định ${COST_DEFAULTS.fixedMonthly / 1e6} triệu ₫/tháng, nội thất ban đầu ${COST_DEFAULTS.setupCost / 1e6} triệu ₫. Tất cả sửa được trên form — đây là giả định, không phải số đo.`,
  },
  {
    id: "dai-han",
    question: "So với cho thuê dài hạn thế nào?",
    answer: `Giá thuê dài hạn trung vị của phường, trừ thuế ${pct(LT_TAX_PCT)} (tham khảo: cho thuê tài sản 5% GTGT + 5% TNCN). Mốc “ngang thuê dài hạn” trên biểu đồ là biên lợi nhuận mà ngắn hạn cần đạt để thu nhập ròng bằng thuê dài hạn.`,
  },
  {
    id: "do-tin-cay",
    question: "Độ tin cậy Cao / Trung bình / Thấp nghĩa là gì?",
    answer:
      "Cao: ≥ 10 listing cùng phường, cùng số phòng ngủ, giá không quá phân tán. Trung bình: ≥ 5 listing (có thể đã lùi về cả thị trường). Thấp: phải lấy cả thị trường bất kể số phòng ngủ.",
  },
];

export const SOURCES: Definition[] = [
  {
    id: "airbnb",
    question: "Airbnb (tự thu thập)",
    answer:
      "Hà Nội và TP. Hồ Chí Minh: collector duyệt tìm kiếm Airbnb bằng trình duyệt thật rồi đọc lịch và giá của từng listing, chạy định kỳ. Mỗi lần quét chỉ thấy một phần thị trường, nên số listing “mới” là mới xuất hiện trong kết quả, không hẳn mới đăng.",
  },
  {
    id: "ranh-gioi",
    question: "Ranh giới phường",
    answer: "Từ OpenStreetMap (đơn vị hành chính sau sáp nhập 2025). Listing được gán vào phường theo toạ độ.",
  },
  {
    id: "mo-phong",
    question: "Giá bán và giá thuê dài hạn",
    answer: (
      <p>
        <Badge variant="warning-light" className="me-1.5">Mô phỏng</Badge>
        Hiện là tin rao giả lập để dựng tính năng lợi suất; sẽ thay bằng tin rao thật. Mọi chỗ dùng số này đều gắn nhãn
        “Mô phỏng”.
      </p>
    ),
  },
  {
    id: "airdna",
    question: "Có dùng AirDNA không?",
    answer:
      "Chỉ nội bộ, để đối chiếu và hiệu chuẩn phương pháp. Số liệu AirDNA không hiển thị trên các trang dành cho nhà đầu tư.",
  },
];
