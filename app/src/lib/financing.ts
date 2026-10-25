/**
 * Dòng tiền vốn vay của một căn (mục «Dòng tiền vốn vay» ở /yield, nhận phần của /dau-tu cũ — CONTEXT.md
 * «Mô phỏng đầu tư»). Hàm thuần, server và test cùng dùng. Doanh thu, chi phí vận hành và thu nhập ròng lấy
 * từ ước tính lợi suất (cùng mô hình với phần trên của trang); phần mới là khoản vay trả góp đều (annuity),
 * tách gốc/lãi theo từng năm. Mọi tham số vay là MẶC ĐỊNH SỬA ĐƯỢC trên form, không phải số đo.
 */
import type { YieldEstimate, YieldInputs } from "./yield"

export type LoanInputs = {
  /** Phần giá mua trả bằng vốn tự có, 0–1; phần còn lại là khoản vay. */
  equityPct: number
  /** Lãi suất danh nghĩa/năm, 0–1. */
  ratePct: number
  termYears: number
}

/** Mặc định của bộ mô phỏng /dau-tu cũ: vốn tự có 30%, lãi 9%/năm, 20 năm. */
export const LOAN_DEFAULTS: LoanInputs = { equityPct: 0.3, ratePct: 0.09, termYears: 20 }

/** Số năm hiện trên lưới (cột Năm 1…5). */
export const FINANCING_HORIZON = 5

export type FinancingSectionId = "revenue" | "expense" | "noi" | "debt" | "cash" | "lt"

export type FinancingLine = {
  id: string
  section: FinancingSectionId
  level: "section" | "line"
  label: string
  /** Số của cột «Hằng tháng» (năm 1 ÷ 12), null khi không áp dụng. */
  monthly: number | null
  years: number[]
  /** Âm thì tô đỏ: dòng tiền. */
  signed?: boolean
  subRows?: FinancingLine[]
}

export type FinancingPlan = {
  loan: number
  /** Tiền mặt bỏ ra lúc mua: phần vốn tự có của giá + nội thất ban đầu. */
  cashInvested: number
  /** Trả nợ mỗi tháng (gốc + lãi). */
  payment: number
  rows: FinancingLine[]
  /** Dòng tiền sau nợ ÷ tiền mặt bỏ ra, từng năm. */
  cashOnCash: number[]
  /** (Dòng tiền sau nợ + gốc đã trả) ÷ tiền mặt bỏ ra, từng năm — dòng tổng ghim cuối lưới. */
  totalReturn: number[]
}

/** Trả góp đều mỗi tháng của khoản vay `loan`, lãi `rate`/năm, `termYears` năm. */
export function monthlyPayment(loan: number, rate: number, termYears: number) {
  const months = Math.round(termYears * 12)
  if (loan <= 0 || months <= 0) return 0
  const r = rate / 12
  return r === 0 ? loan / months : (loan * r) / (1 - Math.pow(1 + r, -months))
}

/** Gốc và lãi trả trong từng năm, đi từng tháng (năm sau kỳ hạn: 0). */
export function amortizeByYear(loan: number, rate: number, payment: number, years: number) {
  let balance = loan
  return Array.from({ length: years }, () => {
    let principal = 0
    let interest = 0
    for (let m = 0; m < 12 && balance > 0.5; m++) {
      const i = (balance * rate) / 12
      const p = Math.min(balance, payment - i)
      balance -= p
      principal += p
      interest += i
    }
    return { principal, interest }
  })
}

const flat = (v: number, n: number) => Array.from({ length: n }, () => v)
const section = (s: Omit<FinancingLine, "level">): FinancingLine => ({ ...s, level: "section" })
const line = (s: Omit<FinancingLine, "level">): FinancingLine => ({ ...s, level: "line" })
const perMonth = (years: number[]) => (years.length ? years[0] / 12 : null)

export function financingPlan(
  estimate: YieldEstimate,
  inputs: YieldInputs,
  loanIn: LoanInputs,
  horizon = FINANCING_HORIZON,
): FinancingPlan {
  const loan = inputs.price * (1 - loanIn.equityPct)
  const cashInvested = inputs.price * loanIn.equityPct + inputs.setupCost
  const payment = monthlyPayment(loan, loanIn.ratePct, loanIn.termYears)
  const amort = amortizeByYear(loan, loanIn.ratePct, payment, horizon)
  const principal = amort.map((a) => a.principal)
  const interest = amort.map((a) => a.interest)
  const debt = amort.map((a) => a.principal + a.interest)

  const revenue = flat(estimate.revenue.mid, horizon)
  const { mgmt, platform, tax, fixed, total } = estimate.costs
  const expense = flat(total, horizon)
  const noi = flat(estimate.noi, horizon)
  const cash = noi.map((v, i) => v - debt[i])

  const rows: FinancingLine[] = [
    section({
      id: "section-revenue",
      section: "revenue",
      label: "Doanh thu ngắn hạn",
      monthly: perMonth(revenue),
      years: revenue,
      subRows: [
        line({ id: "revenue-str", section: "revenue", label: "Giá/đêm × công suất × 365", monthly: perMonth(revenue), years: revenue }),
      ],
    }),
    section({
      id: "section-expense",
      section: "expense",
      label: "Chi phí vận hành",
      monthly: perMonth(expense),
      years: expense,
      subRows: [
        line({ id: "expense-mgmt", section: "expense", label: "Phí quản lý", monthly: mgmt / 12, years: flat(mgmt, horizon) }),
        line({ id: "expense-platform", section: "expense", label: "Phí nền tảng", monthly: platform / 12, years: flat(platform, horizon) }),
        line({ id: "expense-tax", section: "expense", label: "Thuế", monthly: tax / 12, years: flat(tax, horizon) }),
        line({ id: "expense-fixed", section: "expense", label: "Chi phí cố định", monthly: fixed / 12, years: flat(fixed, horizon) }),
      ],
    }),
    section({ id: "section-noi", section: "noi", label: "Thu nhập ròng", monthly: perMonth(noi), years: noi, signed: true }),
    section({
      id: "section-debt",
      section: "debt",
      label: "Trả nợ vay",
      monthly: loan > 0 ? payment : 0,
      years: debt,
      subRows: [
        line({ id: "debt-interest", section: "debt", label: "Lãi", monthly: perMonth(interest), years: interest }),
        line({ id: "debt-principal", section: "debt", label: "Gốc", monthly: perMonth(principal), years: principal }),
      ],
    }),
    section({ id: "section-cash", section: "cash", label: "Dòng tiền sau nợ", monthly: perMonth(cash), years: cash, signed: true }),
  ]

  if (estimate.lt) {
    const ltNet = flat(estimate.lt.netIncome, horizon)
    const ltCash = ltNet.map((v, i) => v - debt[i])
    rows.push(
      section({
        id: "section-lt",
        section: "lt",
        label: "So với cho thuê dài hạn",
        monthly: perMonth(ltCash),
        years: ltCash,
        signed: true,
        subRows: [
          line({ id: "lt-net", section: "lt", label: "Thu nhập ròng dài hạn (sau thuế)", monthly: perMonth(ltNet), years: ltNet }),
          line({ id: "lt-cash", section: "lt", label: "Dòng tiền sau nợ (dài hạn)", monthly: perMonth(ltCash), years: ltCash, signed: true }),
        ],
      }),
    )
  }

  const per = (v: number) => (cashInvested > 0 ? v / cashInvested : 0)
  return {
    loan,
    cashInvested,
    payment,
    rows,
    cashOnCash: cash.map(per),
    totalReturn: cash.map((v, i) => per(v + principal[i])),
  }
}
