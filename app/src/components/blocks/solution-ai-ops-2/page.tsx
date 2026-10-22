import { ProviderSettings } from "./components/provider-settings"

export function Page() {
  return (
    <main
      className="flex min-h-svh w-full items-start justify-center p-4 sm:p-8 md:p-12"
      aria-labelledby="page-heading"
    >
      <h1 id="page-heading" className="sr-only">
        Provider settings
      </h1>
      <ProviderSettings />
    </main>
  )
}