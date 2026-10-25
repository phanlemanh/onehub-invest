import Link from "next/link"
import { CalendarXIcon, ExternalLinkIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/** Lịch trống (collector chưa thu lịch của listing) — một hành động: xem lịch gốc trên Airbnb. */
export function ListingCalendarEmpty({ airbnbUrl }: { airbnbUrl: string | null }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarXIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Chưa có lịch cho listing này</EmptyTitle>
        <EmptyDescription>Collector chưa thu được lịch đặt phòng; số đêm đã đặt và công suất sẽ hiện khi có lịch.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {airbnbUrl ? (
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<a href={airbnbUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <ExternalLinkIcon data-icon="inline-start" aria-hidden="true" />
            Xem lịch trên Airbnb
          </Button>
        ) : (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href="/vn" />}>
            Tìm thị trường
          </Button>
        )}
      </EmptyContent>
    </Empty>
  )
}
