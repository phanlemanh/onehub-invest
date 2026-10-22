import { CircleCheckIcon, CircleAlertIcon } from "lucide-react";

// The block's shared toast state icons: the Toaster sets none of its own.
export const TOAST_SUCCESS_ICON = (
  <CircleCheckIcon className="text-success size-4" aria-hidden="true" />
)

export const TOAST_ERROR_ICON = (
  <CircleAlertIcon className="text-destructive size-4" aria-hidden="true" />
)