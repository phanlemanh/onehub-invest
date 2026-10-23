import { ServiceLevels } from "./components/service-levels"

export function Page() {
  return (
    <main
      className="bg-background min-h-svh w-full"
      aria-labelledby="page-heading"
    >
      <h1 id="page-heading" className="sr-only">
        Service Levels
      </h1>
      <ServiceLevels />
    </main>
  )
}