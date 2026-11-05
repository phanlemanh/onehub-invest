import Link from "next/link";
import { MapPinOffIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

/** Mọi id không hiện được cùng một câu, để người ngoài không dò được tin ẩn. */
export default function NotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <MapPinOffIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Tin này không còn hiện</EmptyTitle>
        <EmptyDescription>Tin có thể đã cũ, hoặc đường dẫn không đúng. Các tin đang rao vẫn xem được.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button nativeButton={false} render={<Link prefetch={false} href="/vn/hanoi/listings/sale" />}>
          Xem tin đang bán
        </Button>
      </EmptyContent>
    </Empty>
  );
}
