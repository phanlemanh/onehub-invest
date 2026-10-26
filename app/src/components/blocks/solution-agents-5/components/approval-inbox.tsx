import { useCallback, useMemo, useState } from "react"
import { toast } from "sonner"

import { AgentToolbar } from "./agent-toolbar"
import { ApprovalPolicy, ReviewCoverage } from "./approval-policy"
import { ApprovalQueue } from "./approval-queue"
import { ApprovalSummary } from "./approval-summary"
import {
  APPROVALS,
  APPROVED_TODAY_BASE,
  TOAST_INFO_ICON,
  TOAST_SUCCESS_ICON,
  type IApprovalRequest,
  type IPolicyRule,
} from "./data"
import { RecentDecisions } from "./recent-decisions"
import { RejectDialog, type RejectTarget } from "./reject-dialog"
import { RequestDetailSheet } from "./request-detail-sheet"

function getMostUrgentPending(requests: IApprovalRequest[]) {
  return requests.reduce<IApprovalRequest | null>(
    (urgent, request) =>
      request.status === "pending" &&
      (!urgent || request.slaMinutesRemaining < urgent.slaMinutesRemaining)
        ? request
        : urgent,
    null
  )
}

const INITIAL_REVIEW_REQUEST = getMostUrgentPending(APPROVALS)

export function ApprovalInbox() {
  const [requests, setRequests] = useState<IApprovalRequest[]>(APPROVALS)

  const [sheetOpen, setSheetOpen] = useState(
    () => INITIAL_REVIEW_REQUEST !== null
  )
  const [activeRequest, setActiveRequest] = useState<IApprovalRequest | null>(
    () => INITIAL_REVIEW_REQUEST
  )

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<RejectTarget | null>(null)
  const [rejectIds, setRejectIds] = useState<string[]>([])
  const [rejectReason, setRejectReason] = useState("")
  const [focusedCoverage, setFocusedCoverage] = useState<string | null>(null)

  const total = requests.length
  const pending = useMemo(
    () => requests.filter((request) => request.status === "pending"),
    [requests]
  )
  const pendingCount = pending.length
  const overSlaCount = pending.filter(
    (request) => request.slaMinutesRemaining < 0
  ).length
  const approvedToday =
    APPROVED_TODAY_BASE + requests.filter((r) => r.status === "approved").length
  const mostUrgentPending = useMemo(
    () => getMostUrgentPending(pending),
    [pending]
  )

  const closeSheetFor = useCallback((id: string) => {
    setActiveRequest((current) => {
      if (current?.id === id) {
        setSheetOpen(false)
        return null
      }
      return current
    })
  }, [])

  const handleReview = useCallback((request: IApprovalRequest) => {
    setActiveRequest(request)
    setSheetOpen(true)
  }, [])

  const approveIds = useCallback((ids: string[]) => {
    setRequests((current) =>
      current.map((request) =>
        ids.includes(request.id) && request.status === "pending"
          ? { ...request, status: "approved", decidedAt: "Just now" }
          : request
      )
    )
  }, [])

  const handleApprove = useCallback(
    (request: IApprovalRequest) => {
      if (request.status !== "pending") return
      approveIds([request.id])
      toast.success("Request approved", {
        description: `${request.id} returned to ${request.agent} to run.`,
        icon: TOAST_SUCCESS_ICON,
      })
      closeSheetFor(request.id)
    },
    [approveIds, closeSheetFor]
  )

  const openRejectSingle = useCallback(
    (request: IApprovalRequest) => {
      if (request.status !== "pending") return
      setRejectIds([request.id])
      setRejectTarget({ kind: "single", label: request.id, count: 1 })
      setRejectReason("")
      setRejectOpen(true)
      closeSheetFor(request.id)
    },
    [closeSheetFor]
  )

  const handleBulkApprove = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      approveIds(ids)
      toast.success(`${ids.length} requests approved`, {
        description: "Returned to their agents to run.",
        icon: TOAST_SUCCESS_ICON,
      })
    },
    [approveIds]
  )

  const handleBulkReject = useCallback((ids: string[]) => {
    if (ids.length === 0) return
    setRejectIds(ids)
    setRejectTarget({
      kind: "bulk",
      label: `${ids.length} requests`,
      count: ids.length,
    })
    setRejectReason("")
    setRejectOpen(true)
  }, [])

  const handleConfirmReject = useCallback(() => {
    const reason = rejectReason.trim()
    if (reason.length === 0 || rejectIds.length === 0) return

    setRequests((current) =>
      current.map((request) =>
        rejectIds.includes(request.id) && request.status === "pending"
          ? {
              ...request,
              status: "rejected",
              decidedAt: "Just now",
              decidedReason: reason,
            }
          : request
      )
    )

    const isBulk = rejectTarget?.kind === "bulk"

    toast.info(
      isBulk ? `${rejectIds.length} requests rejected` : "Request rejected",
      {
        description: isBulk ? reason : `${rejectIds[0]}: ${reason}`,
        icon: TOAST_INFO_ICON,
      }
    )

    setRejectOpen(false)
  }, [rejectIds, rejectReason, rejectTarget])

  const handleReviewNext = useCallback(() => {
    if (mostUrgentPending) {
      handleReview(mostUrgentPending)
      return
    }
    toast.info("Queue is clear", {
      description: "No pending requests to review.",
      icon: TOAST_INFO_ICON,
    })
  }, [handleReview, mostUrgentPending])

  const handleRefresh = useCallback(() => {
    toast.info("Queue refreshed", {
      description: "Showing the latest pending requests.",
      icon: TOAST_INFO_ICON,
    })
  }, [])

  const handleExport = useCallback(() => {
    toast.success("Decision log queued", {
      description: "Your approval decision log will download shortly.",
      icon: TOAST_SUCCESS_ICON,
    })
  }, [])

  const handleCoverageSelect = useCallback((rule: IPolicyRule) => {
    setFocusedCoverage(rule.title)
    toast.info("Coverage focused", {
      description: `${rule.title}: ${rule.description}.`,
      icon: TOAST_INFO_ICON,
    })
  }, [])

  return (
    <div className="bg-background flex min-h-svh w-full flex-col">
      <div className="mx-auto w-full max-w-[1320px] p-3 md:p-4">
        <div className="@container w-full">
          <AgentToolbar
            total={total}
            pending={pendingCount}
            overSla={overSlaCount}
            onReviewNext={handleReviewNext}
            onRefresh={handleRefresh}
            onExport={handleExport}
          />

          <div className="mt-4 flex flex-col gap-4">
            <ApprovalSummary
              counts={{
                pending: pendingCount,
                overSla: overSlaCount,
                approvedToday,
              }}
            />

            <ApprovalQueue
              requests={requests}
              onReview={handleReview}
              onApprove={handleApprove}
              onRejectSingle={openRejectSingle}
              onBulkApprove={handleBulkApprove}
              onBulkReject={handleBulkReject}
              onExport={handleExport}
            />

            <div className="grid grid-cols-1 gap-4 @2xl:grid-cols-2 @4xl:grid-cols-3">
              <RecentDecisions className="h-full" />
              <ApprovalPolicy className="h-full" />
              <ReviewCoverage
                activeCoverage={focusedCoverage}
                className="h-full"
                onSelectCoverage={handleCoverageSelect}
              />
            </div>
          </div>
        </div>
      </div>

      <RequestDetailSheet
        request={activeRequest}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onApprove={handleApprove}
        onReject={openRejectSingle}
      />

      <RejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        target={rejectTarget}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleConfirmReject}
      />
    </div>
  )
}