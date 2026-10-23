// Hai khung trạng thái hạ tầng (Ống Zalo, Rotation AirDNA) theo dải đầu vùng của
// solution-dev-ops-6; trạng thái là Badge, sự cố có câu giải thích là Alert.
import { CircleAlertIcon } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Badge } from "@/components/reui/badge"
import { Frame, FramePanel } from "@/components/reui/frame"
import type { GateFunnel, RotationPreview, ZaloHealth } from "@/lib/collections-queries"
import { fmtInt, fmtPct } from "@/lib/format"

import { SectionHeader } from "./section"

export function ZaloPipePanel({ zalo, funnel, lastPostHours }: { zalo: ZaloHealth; funnel: GateFunnel; lastPostHours: number | null }) {
  const status =
    zalo.connected === null ? <Badge variant="outline">Chưa có heartbeat</Badge> : zalo.connected ? <Badge variant="success-light">Kênh kết nối</Badge> : <Badge variant="destructive-light">Kênh đứt</Badge>
  return (
    <Frame spacing="default" className="min-w-0">
      <SectionHeader
        title="Ống Zalo"
        description={`Heartbeat 15′ cuối ${zalo.heartbeatAgeMin === null ? "—" : `${fmtInt(zalo.heartbeatAgeMin)}′ trước`} · tin cuối qua cổng ${lastPostHours === null ? "chưa có" : `${fmtInt(lastPostHours)}h trước`}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          {status}
          {zalo.uptime24h !== null ? <Badge variant="outline">Uptime 24h {fmtPct(zalo.uptime24h, 0)}</Badge> : null}
        </div>
      </SectionHeader>
      <FramePanel className="flex flex-col gap-3">
        {zalo.connected === false ? (
          <Alert variant="destructive">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Kênh Zalo đứt</AlertTitle>
            <AlertDescription>
              Đăng nhập lại: <code className="font-mono text-xs">openclaw channels login --channel zalouser</code>
            </AlertDescription>
          </Alert>
        ) : null}
        {zalo.heartbeatAgeMin !== null && zalo.heartbeatAgeMin > 20 ? (
          <Alert variant="warning">
            <CircleAlertIcon aria-hidden="true" />
            <AlertTitle>Probe trễ</AlertTitle>
            <AlertDescription>Kiểm tra launchd zalo-heartbeat.</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {zalo.silentAlert24h ? <Badge variant="warning-light">Cảnh báo im lặng 24h</Badge> : null}
          {zalo.driftAlert24h ? <Badge variant="warning-light">Allowlist lệch membership</Badge> : null}
          {!zalo.silentAlert24h && !zalo.driftAlert24h ? <span className="text-muted-foreground text-xs">Không có cảnh báo im lặng hay lệch allowlist trong 24 giờ.</span> : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Cổng Kev: sự kiện cuối {funnel.lastEventAt ?? "—"}. 7 ngày qua: {fmtInt(funnel.last7.messages)} tin thấy → {fmtInt(funnel.last7.passed)} qua cổng → {fmtInt(funnel.last7.accepted)} nhận vào raw
          {funnel.last7.media > 0 ? ` · ${fmtInt(funnel.last7.media)} chỉ có ảnh` : ""}.
        </p>
      </FramePanel>
    </Frame>
  )
}

export function RotationPanel({ rotation }: { rotation: RotationPreview }) {
  return (
    <Frame spacing="default" className="min-w-0">
      <SectionHeader
        title="Rotation AirDNA kế tiếp"
        description={`${fmtInt(rotation.total)} market · con trỏ ${fmtInt(rotation.cursor)} · ${rotation.updatedAt ? `cập nhật ${rotation.updatedAt.slice(0, 16).replace("T", " ")}` : "chưa chạy đêm nào"}`}
      />
      <FramePanel className="flex flex-col gap-3">
        {rotation.next.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {rotation.next.map((m) => (
              <Badge key={m.id} variant="outline">
                {m.name}
                <span className="text-muted-foreground">
                  #{m.id}
                  {m.lastCapturedAt ? "" : " · chưa thu"}
                </span>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">Không còn market nào cần thu — mọi thị trường đều tươi trong 24h.</p>
        )}
        <p className="text-muted-foreground text-xs">6 market/đêm lúc 19:05, bỏ qua market thu trong 24h — một vòng toàn quốc khoảng 6–7 đêm.</p>
      </FramePanel>
    </Frame>
  )
}
