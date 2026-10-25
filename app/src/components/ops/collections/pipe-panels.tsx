// Hai khung trạng thái hạ tầng (ống S03, rotation S02) theo dải đầu vùng của
// solution-dev-ops-6; trạng thái là Badge, sự cố có câu giải thích là Alert.
import { CircleAlertIcon } from "lucide-react"
import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import type { GateFunnel, RotationPreview, ZaloHealth } from "@/lib/collections-queries"
import { fmtInt, fmtPct, fmtVnDateTime } from "@/lib/format"
import { sourceLabel, type SourceRoles } from "@/lib/source-labels"

import { SectionHeader } from "./section"

export function ZaloPipePanel({ zalo, funnel, lastPostHours, roles = {} }: { zalo: ZaloHealth; funnel: GateFunnel; lastPostHours: number | null; roles?: SourceRoles }) {
  const s03 = sourceLabel("S03", roles)
  const status =
    zalo.connected === null ? <Badge variant="outline">Chưa có tín hiệu sống</Badge> : zalo.connected ? <Badge variant="success-light">Kênh kết nối</Badge> : <Badge variant="destructive-light">Kênh đứt</Badge>
  return (
    <Frame spacing="default" className="min-w-0">
      <SectionHeader
        title={`Ống ${s03}`}
        description={`Tín hiệu sống 15′ cuối ${zalo.heartbeatAgeMin === null ? "—" : `${fmtInt(zalo.heartbeatAgeMin)}′ trước`} · tin cuối qua cổng ${lastPostHours === null ? "chưa có" : `${fmtInt(lastPostHours)}h trước`}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {status}
          {zalo.uptime24h !== null ? <Badge variant="outline">Thời gian sống 24h {fmtPct(zalo.uptime24h, 0)}</Badge> : null}
        </div>
      </SectionHeader>
      <FramePanel className="flex flex-col gap-3">
        {zalo.connected === false ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Kênh {s03} đứt</AlertTitle>
            <AlertDescription>
              <Link prefetch={false} href="/ops/sources" className="font-medium underline">
                Đăng nhập lại ở Nguồn dữ liệu
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}
        {zalo.heartbeatAgeMin !== null && zalo.heartbeatAgeMin > 20 ? (
          <Alert variant="warning">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Dò trễ</AlertTitle>
            <AlertDescription>
              Kiểm tra tác vụ gửi tín hiệu sống của kênh {s03} —{" "}
              <Link prefetch={false} href="/ops/sources" className="font-medium underline">
                Nguồn dữ liệu
              </Link>
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {zalo.silentAlert24h ? <Badge variant="warning-light">Cảnh báo im lặng 24h</Badge> : null}
          {zalo.driftAlert24h ? <Badge variant="warning-light">Danh sách cho phép lệch nhóm tham gia</Badge> : null}
          {!zalo.silentAlert24h && !zalo.driftAlert24h ? <span className="text-muted-foreground text-xs">Không có cảnh báo im lặng hay lệch danh sách cho phép trong 24 giờ.</span> : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Cổng Kev: sự kiện cuối {fmtVnDateTime(funnel.lastEventAt)}. 7 ngày qua: {fmtInt(funnel.last7.messages)} tin thấy → {fmtInt(funnel.last7.passed)} qua cổng → {fmtInt(funnel.last7.accepted)} nhận vào bảng thô
          {funnel.last7.media > 0 ? ` · ${fmtInt(funnel.last7.media)} chỉ có ảnh` : ""}.
        </p>
      </FramePanel>
    </Frame>
  )
}

/** Vòng thu S02 (ON6, luật 5 — Hỏi-2): chỉ lịch tác vụ, số lượt thu mỗi đêm và giờ cập nhật. Không số thị trường, không
 * con trỏ, không tên thị trường — số S02 chỉ ở /ops/quality. */
export function RotationPanel({ rotation, roles = {} }: { rotation: RotationPreview; roles?: SourceRoles }) {
  return (
    <Frame spacing="default" className="min-w-0">
      <SectionHeader
        title={`Vòng thu ${sourceLabel("S02", roles)}`}
        description={rotation.updatedAt ? `Cập nhật ${fmtVnDateTime(rotation.updatedAt)}` : "Chưa chạy đêm nào"}
      />
      <FramePanel className="flex flex-col gap-3">
        <p className="text-sm">6 lượt thu mỗi đêm lúc 19:05, bỏ qua thị trường đã thu trong 24 giờ.</p>
        <p className="text-muted-foreground text-xs">
          Số liệu S02 ở <Link href="/ops/quality" className="underline-offset-4 transition-colors hover:text-foreground hover:underline">Chất lượng dữ liệu</Link>.
        </p>
      </FramePanel>
    </Frame>
  )
}
