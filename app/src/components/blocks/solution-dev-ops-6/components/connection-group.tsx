"use client"

// Reads the TanStack table instance directly, which React Compiler cannot see.
"use no memo"

// One category: a tinted band, its own header row, its rows. A hook per group,
// so each is a component; the view owns what they share, keeping one grid.
import { Badge } from "@/components/reui/badge"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
  type DataGridLayoutProps,
} from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type OnChangeFn,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"

import {
  CATEGORIES,
  linkedOf,
  plural,
  type Connection,
  type IntegrationCategory,
} from "./data"

export function ConnectionGroup({
  category,
  rows,
  columns,
  sorting,
  onSortingChange,
  rowSelection,
  onRowSelectionChange,
  columnVisibility,
  tableLayout,
  tableClassNames,
  onRowClick,
}: {
  category: IntegrationCategory
  /** Already filtered and sorted by the grid view. */
  rows: Connection[]
  columns: ColumnDef<DataGridFeatures, Connection>[]
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  rowSelection: RowSelectionState
  onRowSelectionChange: OnChangeFn<RowSelectionState>
  columnVisibility: ColumnVisibilityState
  tableLayout: DataGridLayoutProps<Connection>["tableLayout"]
  tableClassNames: DataGridLayoutProps<Connection>["tableClassNames"]
  onRowClick: (connection: Connection) => void
}) {
  const table = useTable({
    features: dataGridFeatures,
    // The view sorts once across every group, so stepping follows the
    // same order the reader sees; the headers only flip the shared state.
    manualSorting: true,
    // Every row renders: the data is already the page.
    manualPagination: true,
    data: rows,
    columns,
    // Ids are unique across groups, so the one shared selection stays coherent.
    getRowId: (row) => row.id,
    state: { sorting, rowSelection, columnVisibility },
    onSortingChange,
    onRowSelectionChange,
    enableRowSelection: true,
  })

  const datasets = rows.reduce((sum, row) => sum + row.datasets.length, 0)
  const linked = rows.reduce((sum, row) => sum + linkedOf(row).length, 0)
  const failing = rows.filter(
    (row) => !row.paused && row.health === "failing"
  ).length
  const headingId = `devops-6-group-${category}`

  return (
    <section aria-labelledby={headingId}>
      {/* The band rules itself top and bottom, so it reads as a label on the
          table rather than a row floating above it. */}
      <div className="bg-muted/50 flex items-center gap-2.5 border-y px-(--frame-panel-header-px) py-2">
        <span className="text-muted-foreground flex [&_svg:not([class*=size-])]:size-4">
          {CATEGORIES[category].icon}
        </span>
        <span id={headingId} className="text-sm font-semibold">
          {CATEGORIES[category].plural}
        </span>
        <Badge variant="outline" className="tabular-nums">
          {rows.length}
        </Badge>
        <span className="text-muted-foreground ms-auto flex items-center gap-1.5 text-xs tabular-nums">
          {failing > 0 ? (
            <span className="text-destructive font-medium">
              {failing} failing,
            </span>
          ) : null}
          {linked} of {plural(datasets, "dataset")} linked
        </span>
      </div>

      <DataGrid
        table={table}
        recordCount={rows.length}
        onRowClick={onRowClick}
        tableLayout={tableLayout}
        tableClassNames={tableClassNames}
      >
        <DataGridContainer>
          <DataGridScrollArea>
            <DataGridTable />
          </DataGridScrollArea>
        </DataGridContainer>
      </DataGrid>
    </section>
  )
}