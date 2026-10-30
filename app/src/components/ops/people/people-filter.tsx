"use client"

import { useRef, useState } from "react"
import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const TAT_CA = "all"

/** Lọc /ops/people bằng form GET: đổi nguồn gửi ngay; tìm theo tên hay tài khoản bằng nút Tìm. Trang về 1. */
export function PeopleFilter({ sources, source, q }: { sources: string[]; source: string | null; q: string }) {
  const form = useRef<HTMLFormElement>(null)
  const [nguon, setNguon] = useState(source ?? TAT_CA)
  const items = [{ value: TAT_CA, label: "Mọi nguồn" }, ...sources.map((s) => ({ value: s, label: s }))]
  return (
    <form ref={form} method="get" action="/ops/people" className="flex flex-wrap items-center gap-2" data-people-filter="">
      {nguon !== TAT_CA && <input type="hidden" name="source" value={nguon} />}
      <Select
        value={nguon}
        items={items}
        onValueChange={(v) => {
          setNguon(String(v))
          // Chờ input ẩn theo nguồn mới rồi mới gửi.
          requestAnimationFrame(() => form.current?.requestSubmit())
        }}
      >
        <SelectTrigger size="sm" aria-label="Nguồn" className="min-w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="start">
          <SelectGroup>
            {items.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <InputGroup className="w-64 max-w-full">
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput name="q" defaultValue={q} placeholder="Tên hoặc tài khoản" aria-label="Tìm theo tên hoặc tài khoản" />
      </InputGroup>
      <Button type="submit" variant="outline" size="sm">
        Tìm
      </Button>
    </form>
  )
}
