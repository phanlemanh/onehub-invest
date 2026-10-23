import { Connections } from "./components/connections"

export function Page() {
  return (
    <main
      className="bg-background min-h-svh w-full"
      aria-labelledby="page-heading"
    >
      <h1 id="page-heading" className="sr-only">
        Connections
      </h1>
      <Connections />
    </main>
  )
}