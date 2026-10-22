"use client"

// Mẫu sống cho từng dòng "Một loại UI, một cách làm" của danh mục onehub-ui, cộng bảng
// block Solutions mà cổng Ops dùng. Số liệu trong mẫu là số minh hoạ, không phải dữ liệu thật.
import type { ReactNode } from "react"
import { InboxIcon } from "lucide-react"

import { InsightGrid, type InsightColumn } from "@/components/insight/insight-grid"
import { StatTiles } from "@/components/page/stat-tiles"
import { Badge } from "@/components/reui/badge"
import { Frame, FrameDescription, FrameHeader, FramePanel, FrameTitle } from "@/components/reui/frame"
import { PageError } from "@/components/states/page-error"
import { Button } from "@/components/ui/button"
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"

function Sample({ title, component, description, children }: { title: string; component: string; description: string; children: ReactNode }) {
  return (
    <Frame spacing="default" className="min-w-0">
      <FrameHeader className="flex-row flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-px">
          <FrameTitle role="heading" aria-level={2}>
            {title}
          </FrameTitle>
          <FrameDescription>{description}</FrameDescription>
        </div>
        <Badge variant="outline" className="font-mono">
          {component}
        </Badge>
      </FrameHeader>
      <FramePanel className="flex flex-col gap-3">{children}</FramePanel>
    </Frame>
  )
}

type DemoRow = { area: string; adr: string; occupancy: string }
const DEMO_ROWS: DemoRow[] = [
  { area: "Phường mẫu A", adr: "1.150.000 ₫", occupancy: "62,0%" },
  { area: "Phường mẫu B", adr: "980.000 ₫", occupancy: "55,4%" },
  { area: "Phường mẫu C", adr: "1.320.000 ₫", occupancy: "48,9%" },
]
const DEMO_COLUMNS: InsightColumn<DemoRow>[] = [
  { id: "area", accessorKey: "area", header: "Khu vực", size: 180 },
  { id: "adr", accessorKey: "adr", header: "ADR", size: 140 },
  { id: "occ", accessorKey: "occupancy", header: "Occupancy", size: 120 },
]

type BlockRow = { block: string; route: string; use: string; preview: string }
const BLOCKS: BlockRow[] = [
  { block: "app-shell-36", route: "/ops/**", use: "Khung cổng Ops: thanh bên nhóm", preview: "https://reui.io/preview/base/app-shell-36" },
  { block: "solution-dev-ops-5", route: "/ops", use: "Ô KPI + lưới mục tiêu độ tươi", preview: "https://reui.io/preview/base/solution-dev-ops-5" },
  { block: "solution-dev-ops-6", route: "/ops/collections, /ops/sources", use: "Thẻ số, luồng, cần chú ý, lưới kết nối", preview: "https://reui.io/preview/base/solution-dev-ops-6" },
  { block: "solution-dev-ops-1", route: "/ops/collections", use: "Lưới job theo lịch", preview: "https://reui.io/preview/base/solution-dev-ops-1" },
  { block: "solution-ai-ops-2", route: "/ops/sources", use: "Hàng tài khoản Zalo + hộp kết nối QR", preview: "https://reui.io/preview/base/solution-ai-ops-2" },
  { block: "solution-agents-5", route: "/ops/review", use: "Hàng chờ duyệt + sheet chi tiết", preview: "https://reui.io/preview/base/solution-agents-5" },
]
const BLOCK_COLUMNS: InsightColumn<BlockRow>[] = [
  { id: "block", accessorKey: "block", header: "Mẫu", cell: ({ row }) => <span className="font-mono">{row.original.block}</span>, size: 180 },
  { id: "route", accessorKey: "route", header: "Trang", size: 200 },
  { id: "use", accessorKey: "use", header: "Dùng cho", size: 280 },
  {
    id: "preview",
    header: "Xem trước",
    cell: ({ row }) => (
      <a href={row.original.preview} target="_blank" rel="noopener noreferrer" className="font-medium underline">
        Mở
      </a>
    ),
    size: 100,
  },
]

export function CatalogSamples() {
  return (
    <div className="flex flex-col gap-6">
      <Sample title="Đầu trang" component="PageHeader" description="Chính đầu trang này: đường dẫn, tiêu đề 1–3 chữ, số đếm, một câu mô tả">
        <p className="text-muted-foreground text-sm">Mọi trang vận hành và đầu tư mở bằng đầu trang này; không tự viết tiêu đề bằng thẻ chữ lớn.</p>
      </Sample>

      <Sample title="Ô KPI" component="StatTiles" description="Hàng số chính, bậc so nhóm so sánh nằm ở Badge">
        <StatTiles
          items={[
            { title: "ADR trung vị", value: "1.150.000 ₫", tier: { label: "Khá", variant: "info-light" }, footer: "Số minh hoạ" },
            { title: "Occupancy", value: "58,2%", tier: { label: "Nhóm đầu", variant: "success-light" }, footer: "Số minh hoạ" },
            { title: "Listing", value: "257", footer: "Số minh hoạ" },
          ]}
        />
      </Sample>

      <InsightGrid title="Bảng" description="InsightGrid — Frame + lưới dữ liệu, sắp xếp, phân trang, nhãn tiếng Việt" data={DEMO_ROWS} columns={DEMO_COLUMNS} getRowId={(r) => r.area} />

      <Sample title="Trạng thái" component="Badge" description="Trạng thái luôn qua Badge dạng nhạt; một Badge trạng thái mỗi hàng">
        <div className="flex flex-wrap gap-2">
          <Badge variant="success-light">Đạt</Badge>
          <Badge variant="info-light">Đang xem</Badge>
          <Badge variant="warning-light">Trễ SLO</Badge>
          <Badge variant="destructive-light">Quá hạn</Badge>
          <Badge variant="outline">Chưa có</Badge>
        </div>
      </Sample>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Sample title="Đang tải" component="Skeleton" description="Khung xương theo đúng bố cục vùng">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </Sample>
        <Sample title="Lỗi" component="PageError" description="Nói việc nào hỏng, kèm Thử lại">
          <PageError error={Object.assign(new Error("mẫu"), { digest: "mau-123" })} reset={() => undefined} />
        </Sample>
        <Sample title="Trống" component="Empty" description="Tiêu đề, một dòng, một hành động">
          <Empty className="p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <InboxIcon aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>Chưa lưu khu vực nào</EmptyTitle>
              <EmptyDescription>Lưu khu vực từ trang thị trường để so sánh sau.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button size="sm" variant="outline">
                Tìm thị trường
              </Button>
            </EmptyContent>
          </Empty>
        </Sample>
      </div>

      <InsightGrid title="Mẫu dùng cho cổng Ops" description="Khung và trang của cổng vận hành chuyển thể từ các mẫu này" data={BLOCKS} columns={BLOCK_COLUMNS} getRowId={(r) => r.block} />
    </div>
  )
}
