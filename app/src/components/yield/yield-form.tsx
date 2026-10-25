"use client"

import { useState, useTransition, type FormEvent, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { CalculatorIcon, SparklesIcon } from "lucide-react"

import { Badge } from "@/components/reui/badge"
import { Frame, FrameFooter, FramePanel } from "@/components/reui/frame"
import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Item, ItemMedia } from "@/components/ui/item"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { fmtInt, fmtMoneyCompact } from "@/lib/format"
import type { YieldArea } from "@/lib/queries"
import { sendUserEvent } from "@/components/user-event-beacon"
import { LOAN_DEFAULTS, type LoanInputs } from "@/lib/financing"
import { COST_DEFAULTS, type YieldInputs } from "@/lib/yield"

/**
 * Form ước tính — chuyển thể từ @reui/form-11: hàng nhãn | ô nhập, vạch đứt,
 * dải gradient phản chiếu lựa chọn ngay khi gõ. Khác bản gốc: nằm trong Frame
 * (trang dùng họ Frame), gửi bằng URL để báo cáo chia sẻ được.
 */
const dashedSeparatorClassName =
  "border-border bg-transparent data-horizontal:h-0 data-horizontal:border-t data-horizontal:border-dashed"

const BILLION = 1_000_000_000
const MILLION = 1_000_000

function FormRow({
  title,
  description,
  htmlFor,
  children,
}: {
  title: string
  description: ReactNode
  htmlFor: string
  children: ReactNode
}) {
  return (
    <Field className="grid gap-3 px-5 py-4 sm:px-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] md:items-center">
      <FieldContent className="gap-0.5 md:pt-0.5">
        <FieldLabel htmlFor={htmlFor}>{title}</FieldLabel>
        <FieldDescription>{description}</FieldDescription>
      </FieldContent>
      <div className="min-w-0">{children}</div>
    </Field>
  )
}

function InsetSeparator() {
  return (
    <div className="px-5 sm:px-6">
      <Separator className={dashedSeparatorClassName} />
    </div>
  )
}

function Num({
  id,
  value,
  onChange,
  min,
  max,
  step,
  suffix,
}: {
  id: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  suffix?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <NumberField
        id={id}
        value={value}
        min={min}
        max={max}
        step={step}
        locale="vi-VN"
        onValueChange={(next) => onChange(next ?? min)}
        className="max-w-48"
      >
        <NumberFieldGroup>
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldGroup>
      </NumberField>
      {suffix && <span className="text-muted-foreground text-sm">{suffix}</span>}
    </div>
  )
}

function BannerDetail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="truncate font-medium">{value}</span>
    </div>
  )
}

/** Dải gradient của form-11, phản chiếu lựa chọn ngay khi gõ. */
function SummaryBanner({
  inputs,
  area,
  currency,
}: {
  inputs: YieldInputs
  area: YieldArea | undefined
  currency: string
}) {
  const perM2 = inputs.sqm > 0 ? inputs.price / inputs.sqm : 0
  const vsArea = area?.medianPerm2 ? perM2 / area.medianPerm2 - 1 : null
  return (
    <div className="relative isolate overflow-hidden rounded-md bg-[linear-gradient(155deg,var(--color-blue-950)_0%,var(--color-indigo-800)_36%,var(--color-fuchsia-400)_67%,var(--color-orange-200)_100%)] p-4 text-white sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(100deg,var(--color-blue-950)_0%,transparent_48%),linear-gradient(28deg,var(--color-orange-200)_0%,transparent_45%)] opacity-90" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,transparent_0%,var(--color-fuchsia-300)_100%)] opacity-50" />
      <div className="relative flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <Item className="flex size-10 shrink-0 items-center justify-center border border-white/20 bg-white/15 p-0">
            <ItemMedia variant="icon" className="size-auto">
              <CalculatorIcon className="size-4" aria-hidden="true" />
            </ItemMedia>
          </Item>
          <div className="min-w-0">
            <p className="text-xs font-medium text-white/70">Căn đang ước tính</p>
            <h2 className="truncate text-lg leading-6 font-semibold">
              {inputs.bedrooms === 0 ? "Studio" : `${inputs.bedrooms} phòng ngủ`} · {fmtInt(inputs.sqm)} m²
            </h2>
            <p className="mt-1 line-clamp-1 text-sm text-white/75">
              {area ? `${area.name} · ${fmtInt(area.listings)} listing Airbnb trong phường` : "Chọn phường"}
            </p>
          </div>
        </div>
        <div className="bg-background/95 text-foreground w-full rounded-md p-3 text-sm shadow-lg shadow-black/15 backdrop-blur sm:w-72">
          <div className="grid gap-1.5">
            <BannerDetail label="Giá mua" value={fmtMoneyCompact(inputs.price, currency)} />
            <BannerDetail label="Giá/m²" value={fmtMoneyCompact(perM2, currency)} />
            <BannerDetail
              label="So với trung vị phường*"
              value={
                vsArea === null
                  ? "—"
                  : `${vsArea >= 0 ? "+" : "−"}${Math.abs(Math.round(vsArea * 100))}%`
              }
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export function YieldForm({
  areas,
  initial,
  initialLoan,
  currency,
}: {
  areas: YieldArea[]
  initial: YieldInputs
  initialLoan: LoanInputs
  currency: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [inputs, setInputs] = useState<YieldInputs>(initial)
  const [loan, setLoan] = useState<LoanInputs>(initialLoan)
  const area = areas.find((a) => a.id === inputs.area)
  const suggested = area?.medianPerm2 ? area.medianPerm2 * inputs.sqm : null

  const patch = (next: Partial<YieldInputs>) => setInputs((cur) => ({ ...cur, ...next }))

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const params = new URLSearchParams({
      area: inputs.area,
      pn: String(inputs.bedrooms),
      m2: String(inputs.sqm),
      price: String(Math.round(inputs.price)),
      mgmt: String(inputs.mgmtPct),
      platform: String(inputs.platformPct),
      tax: String(inputs.taxPct),
      fixed: String(Math.round(inputs.fixedMonthly)),
      setup: String(Math.round(inputs.setupCost)),
      eq: String(loan.equityPct),
      rate: String(loan.ratePct),
      term: String(loan.termYears),
    })
    // Hồ sơ tài chính của người dùng (tầng A, chỉ local) — giữ tên sự kiện của bộ Mô phỏng đầu tư cũ cho bộ nhớ agent.
    sendUserEvent("dau_tu_input", {
      area: inputs.area,
      price: Math.round(inputs.price),
      equityPct: loan.equityPct,
      ratePct: loan.ratePct,
      termYears: loan.termYears,
    })
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }))
  }

  const areaItems = areas.map((a) => ({ value: a.id, label: a.name }))

  return (
    <Frame spacing="default" className="w-full min-w-0">
      {/* noValidate: bước ±0,1 tỷ chỉ là bước của nút, giá lẻ (4,62 tỷ) vẫn hợp lệ;
          server tự kẹp mọi tham số về khoảng cho phép. */}
      <form onSubmit={handleSubmit} noValidate className="contents">
        <FramePanel className="flex flex-col gap-0 p-0">
          <div className="p-4 sm:p-5">
            <SummaryBanner inputs={inputs} area={area} currency={currency} />
          </div>
          <FieldSet className="gap-0">
            <FieldLegend className="sr-only">Thông tin căn</FieldLegend>
            <FieldGroup className="gap-0">
              <FormRow
                title="Phường"
                description="Listing Airbnb của phường dùng làm mẫu so sánh."
                htmlFor="yield-area"
              >
                <Select
                  value={inputs.area}
                  items={areaItems}
                  onValueChange={(value) => value && patch({ area: String(value) })}
                >
                  <SelectTrigger id="yield-area" className="w-full [&_small]:hidden">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    <SelectGroup>
                      {areas.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          <span className="flex min-w-0 flex-col items-start gap-px">
                            <span className="font-medium">{a.name}</span>
                            <small className="text-muted-foreground line-clamp-1 text-xs">
                              {fmtInt(a.listings)} listing
                              {a.medianPerm2 ? ` · ${fmtMoneyCompact(a.medianPerm2, currency)}/m² (mô phỏng)` : ""}
                            </small>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </FormRow>
              <InsetSeparator />
              <FormRow title="Số phòng ngủ" description="0 = studio." htmlFor="yield-pn">
                <Num id="yield-pn" value={inputs.bedrooms} min={0} max={5} step={1} onChange={(v) => patch({ bedrooms: v })} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Diện tích" description="Diện tích sử dụng." htmlFor="yield-m2">
                <Num id="yield-m2" value={inputs.sqm} min={15} max={400} step={5} suffix="m²" onChange={(v) => patch({ sqm: v })} />
              </FormRow>
              <InsetSeparator />
              <FormRow
                title="Giá mua"
                description={
                  suggested ? (
                    <>
                      Gợi ý theo giá/m² mô phỏng của phường:{" "}
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        onClick={() => patch({ price: Math.round(suggested / 1e7) * 1e7 })}
                      >
                        {fmtMoneyCompact(suggested, currency)}
                      </Button>
                    </>
                  ) : (
                    "Phường chưa có dữ liệu giá bán."
                  )
                }
                htmlFor="yield-price"
              >
                <Num
                  id="yield-price"
                  value={Math.round((inputs.price / BILLION) * 100) / 100}
                  min={0.3}
                  max={200}
                  step={0.1}
                  suffix="tỷ ₫"
                  onChange={(v) => patch({ price: v * BILLION })}
                />
              </FormRow>
            </FieldGroup>
          </FieldSet>
        </FramePanel>

        <FramePanel className="flex flex-col gap-0 p-0">
          <FieldSet className="gap-0">
            <FieldLegend className="px-5 pt-4 text-sm sm:px-6">
              Chi phí vận hành <Badge variant="outline" className="ms-1">Mặc định sửa được</Badge>
            </FieldLegend>
            <FieldGroup className="gap-0">
              <FormRow title="Phí quản lý" description="Đơn vị vận hành thường thu 15–25% doanh thu." htmlFor="yield-mgmt">
                <Num id="yield-mgmt" value={Math.round(inputs.mgmtPct * 100)} min={0} max={50} step={1} suffix="% doanh thu" onChange={(v) => patch({ mgmtPct: v / 100 })} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Phí nền tảng" description="Phí host của Airbnb." htmlFor="yield-platform">
                <Num id="yield-platform" value={Math.round(inputs.platformPct * 100)} min={0} max={20} step={1} suffix="% doanh thu" onChange={(v) => patch({ platformPct: v / 100 })} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Thuế" description="Tham khảo: hộ kinh doanh lưu trú 5% GTGT + 2% TNCN." htmlFor="yield-tax">
                <Num id="yield-tax" value={Math.round(inputs.taxPct * 100)} min={0} max={30} step={1} suffix="% doanh thu" onChange={(v) => patch({ taxPct: v / 100 })} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Chi phí cố định" description="Điện nước, internet, phí dịch vụ toà nhà, vật tư." htmlFor="yield-fixed">
                <Num id="yield-fixed" value={Math.round(inputs.fixedMonthly / MILLION)} min={0} max={100} step={0.5} suffix="tr ₫/tháng" onChange={(v) => patch({ fixedMonthly: v * MILLION })} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Nội thất ban đầu" description="Chi một lần — chỉ ảnh hưởng thời gian hoàn vốn." htmlFor="yield-setup">
                <Num id="yield-setup" value={Math.round(inputs.setupCost / MILLION)} min={0} max={2000} step={10} suffix="tr ₫" onChange={(v) => patch({ setupCost: v * MILLION })} />
              </FormRow>
            </FieldGroup>
          </FieldSet>
        </FramePanel>

        <FramePanel className="flex flex-col gap-0 p-0">
          <FieldSet className="gap-0">
            <FieldLegend className="px-5 pt-4 text-sm sm:px-6">
              Vốn vay <Badge variant="outline" className="ms-1">Mặc định sửa được</Badge>
            </FieldLegend>
            <FieldGroup className="gap-0">
              <FormRow title="Vốn tự có" description="Phần giá mua trả bằng tiền của mình; phần còn lại vay ngân hàng." htmlFor="yield-eq">
                <Num id="yield-eq" value={Math.round(loan.equityPct * 100)} min={10} max={100} step={5} suffix="% giá mua" onChange={(v) => setLoan((l) => ({ ...l, equityPct: v / 100 }))} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Lãi suất vay" description="Lãi danh nghĩa mỗi năm, trả góp đều hằng tháng." htmlFor="yield-rate">
                <Num id="yield-rate" value={Math.round(loan.ratePct * 1000) / 10} min={0} max={30} step={0.5} suffix="%/năm" onChange={(v) => setLoan((l) => ({ ...l, ratePct: v / 100 }))} />
              </FormRow>
              <InsetSeparator />
              <FormRow title="Kỳ hạn" description="Số năm trả hết khoản vay." htmlFor="yield-term">
                <Num id="yield-term" value={loan.termYears} min={5} max={35} step={5} suffix="năm" onChange={(v) => setLoan((l) => ({ ...l, termYears: v }))} />
              </FormRow>
            </FieldGroup>
          </FieldSet>
        </FramePanel>

        <FrameFooter className="flex-row flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            * Giá bán, giá thuê dài hạn là dữ liệu mô phỏng (G1).
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => {
                patch({ ...COST_DEFAULTS })
                setLoan(LOAN_DEFAULTS)
              }}
            >
              Về mặc định
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? (
                <Spinner data-icon="inline-start" aria-hidden="true" />
              ) : (
                <SparklesIcon data-icon="inline-start" aria-hidden="true" />
              )}
              Ước tính
            </Button>
          </div>
        </FrameFooter>
      </form>
    </Frame>
  )
}

