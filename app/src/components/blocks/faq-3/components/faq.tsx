import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Item, ItemMedia } from "@/components/ui/item"
import { LifeBuoyIcon, ArrowRightIcon } from "lucide-react"

type FaqItem = {
  id: string
  question: string
  answer: string
}

const faqItems: FaqItem[] = [
  {
    id: "source-owned",
    question: "Can We Edit The Block Source?",
    answer:
      "Every block ships as source your team owns. Swap demo data, adjust the layout, and wire it to your product model.",
  },
  {
    id: "shadcn-stack",
    question: "Will It Fit Our shadcn Stack?",
    answer:
      "Blocks compose from shadcn, Base UI, and ReUI primitives, with portable React boundaries and no Next runtime imports in the source.",
  },
  {
    id: "responsive",
    question: "Are Layouts Already Responsive?",
    answer:
      "Every finished block is reviewed across core breakpoints, with mobile stacking, text wrapping, and overflow handled before release.",
  },
  {
    id: "license",
    question: "What Comes With A Pro License?",
    answer:
      "The full block catalog, source files, implementation notes, and ongoing updates your team can review before adopting.",
  },
  {
    id: "custom-theme",
    question: "Can We Use Our Own Theme?",
    answer:
      "Theme-aware primitives and token-friendly classes keep brand color, radius, density, and dark mode under your control.",
  },
  {
    id: "support",
    question: "Where Do We Get Implementation Help?",
    answer:
      "Start with the docs and block notes. Support can point you to the right source files when integration gets tricky.",
  },
]

export function Faq() {
  return (
    <section aria-labelledby="faq-3-title" className="bg-background w-full">
      <div className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-20 lg:py-24">
        {/* Header */}
        <div className="mb-10 flex max-w-2xl flex-col gap-4 sm:mb-12">
          <p className="text-primary text-xs font-semibold tracking-wider uppercase">
            FAQ
          </p>
          <h2
            id="faq-3-title"
            className="text-foreground text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl"
          >
            Questions, <span className="text-primary">Answered</span>
          </h2>
          <p className="text-muted-foreground text-base leading-7 text-pretty">
            Straight answers on source ownership, the shadcn stack, licensing,
            and getting blocks into your product.
          </p>
        </div>

        {/* Questions: an open, separated two-column grid (no box) */}
        <div className="border-border/60 grid border-t md:grid-cols-2">
          {faqItems.map((item, index) => (
            <div
              key={item.id}
              className={cn(
                "border-border/60 flex flex-col gap-2 border-b py-6 md:py-7",
                index % 2 === 0 ? "md:border-r md:pr-8" : "md:pl-8"
              )}
            >
              <h3 className="text-foreground text-base font-semibold">
                {item.question}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed text-pretty">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Support */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Item className="border-background bg-muted [&_svg]:text-accent-foreground flex size-10.5 shrink-0 items-center justify-center border-2 p-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.14)] dark:border [&_svg]:size-5">
              <ItemMedia variant="icon" className="size-auto">
                <LifeBuoyIcon aria-hidden="true" />
              </ItemMedia>
            </Item>
            <div className="flex min-w-0 flex-col">
              <p className="text-foreground text-sm font-medium">
                Still have a question?
              </p>
              <p className="text-muted-foreground text-sm">
                Reach the team or dig into the docs.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              nativeButton={false}
              render={<a href="#" />}
              variant="outline"
              size="sm"
            >
              <LifeBuoyIcon aria-hidden="true" />
              Support Desk
            </Button>
            <Button
              nativeButton={false}
              render={<a href="#" />}
              variant="ghost"
              size="sm"
            >
              Read Docs
              <ArrowRightIcon aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}