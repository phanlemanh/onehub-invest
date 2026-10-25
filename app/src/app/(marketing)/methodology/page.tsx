import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRightIcon, ChartColumnIcon, MapIcon } from "lucide-react";

import { DefinitionGrid } from "@/components/marketing/definition-grid";
import { METRICS, SOURCES, YIELD } from "@/components/marketing/methodology-definitions";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Item, ItemMedia } from "@/components/ui/item";

export const metadata: Metadata = {
  title: "Phương pháp & thuật ngữ",
  description: "Cách One Invest thu thập dữ liệu Airbnb và tính công suất, ADR, RevPAR, lợi suất.",
};

/**
 * Phương pháp & thuật ngữ (IA L8, L11) — mọi ⓘ định nghĩa trong portal trỏ về đây.
 * Định nghĩa mở sẵn theo @reui/faq-3 (routes.md: faq-3 thay faq-6): đọc lướt cả trang, không phải bấm từng câu.
 */
export default function MethodologyPage() {
  return (
    <div className="flex flex-col gap-14 px-4 py-12 sm:px-6 sm:py-16">
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-3">
        <Badge variant="outline" size="xl" radius="full" className="text-foreground h-7 w-fit">
          Phương pháp
        </Badge>
        <h1 className="text-foreground max-w-2xl text-4xl font-semibold tracking-tight text-balance">
          Số liệu đến từ đâu, và được tính thế nào
        </h1>
        <p className="text-muted-foreground max-w-2xl text-base leading-7 text-pretty">
          Định nghĩa từng chỉ số, mô hình ước tính lợi suất và các nguồn dữ liệu — kể cả những giới hạn hiện tại.
        </p>
        <nav aria-label="Mục lục" className="flex flex-wrap gap-2 pt-2">
          {[
            ["chi-so", "Chỉ số"],
            ["loi-suat", "Lợi suất"],
            ["nguon", "Nguồn dữ liệu"],
          ].map(([id, label]) => (
            <Badge key={id} variant="outline" render={<a href={`#${id}`} />} className="hover:bg-accent transition-colors">
              {label}
            </Badge>
          ))}
        </nav>
      </header>

      <DefinitionGrid id="chi-so" title="Chỉ số" items={METRICS} />
      <DefinitionGrid id="loi-suat" title="Mô hình lợi suất" items={YIELD} />
      <DefinitionGrid id="nguon" title="Nguồn dữ liệu" items={SOURCES} />

      {/* Hàng hỗ trợ của faq-3: sản phẩm không có bàn hỗ trợ/tài liệu riêng → hai việc chính của Invest. */}
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Item className="border-background bg-muted [&_svg]:text-accent-foreground flex size-10.5 shrink-0 items-center justify-center border-2 p-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.14)] dark:border [&_svg]:size-5">
            <ItemMedia variant="icon" className="size-auto">
              <ChartColumnIcon aria-hidden="true" />
            </ItemMedia>
          </Item>
          <div className="flex min-w-0 flex-col">
            <p className="text-foreground text-sm font-medium">Xem các chỉ số trên số thật</p>
            <p className="text-muted-foreground text-sm">Xếp hạng phường, hoặc ước tính lợi suất một căn.</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button nativeButton={false} render={<Link href="/vn" />} variant="outline" size="sm">
            <MapIcon aria-hidden="true" />
            Xem thị trường
          </Button>
          <Button nativeButton={false} render={<Link href="/yield" />} variant="ghost" size="sm">
            Ước tính lợi suất
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  );
}
