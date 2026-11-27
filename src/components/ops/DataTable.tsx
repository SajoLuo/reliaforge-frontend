import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react"
import { useMemo, useState } from "react"
import type { DataTableColumn, DataTableProps } from "@reliaforge/plugin-sdk"
import { StatePanel } from "@/components/common/StatePanel"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

interface SortState {
  columnId: string | null
  direction: "asc" | "desc"
}

function defaultRowFilter<T>(row: T, columns: DataTableColumn<T>[], normalizedQuery: string): boolean {
  return columns.some((column) => {
    const raw = column.accessor?.(row)
    if (raw === null || raw === undefined) return false
    return String(raw).toLowerCase().includes(normalizedQuery)
  })
}

function compareSortValues(left: string | number, right: string | number): number {
  if (typeof left === "number" && typeof right === "number") return left - right
  return String(left).localeCompare(String(right), undefined, { numeric: true })
}

function sortRows<T>(rows: T[], column: DataTableColumn<T> | undefined, direction: "asc" | "desc"): T[] {
  if (!column) return rows
  const extract = column.sortValue ?? column.accessor
  if (!extract) return rows
  const factor = direction === "asc" ? 1 : -1
  return [...rows].sort((a, b) => {
    const left = extract(a) ?? ""
    const right = extract(b) ?? ""
    if (typeof left === "boolean" || typeof right === "boolean") {
      return factor * String(left).localeCompare(String(right))
    }
    return factor * compareSortValues(left, right)
  })
}

function nextSortState(current: SortState, columnId: string): SortState {
  if (current.columnId !== columnId) return { columnId, direction: "asc" }
  if (current.direction === "asc") return { columnId, direction: "desc" }
  return { columnId: null, direction: "asc" }
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-55" aria-hidden="true" />
  return direction === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
    : <ArrowDown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
}

function TableSearchBar({
  visible,
  query,
  placeholder,
  onChange,
}: {
  visible: boolean
  query: string
  placeholder?: string
  onChange: (value: string) => void
}) {
  const { t } = useLocale()
  if (!visible) return null
  const label = placeholder ?? t("ops.searchPlaceholder")
  return (
    <div className="flex items-center gap-2 border-b bg-canvas/50 px-4 py-2.5">
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder={label}
        aria-label={label}
        className="w-full bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
      />
      {query ? (
        <Button type="button" variant="ghost" size="small" onClick={() => onChange("")} aria-label={t("ops.clearSearch")}>
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      ) : null}
    </div>
  )
}

function TableEmptyState({
  testId,
  emptyTitle,
  emptyDescription,
}: {
  testId: string
  emptyTitle?: string
  emptyDescription?: string
}) {
  const { t } = useLocale()
  return (
    <div className="px-6 py-10 text-center" data-testid={`${testId}-empty`}>
      <p className="text-sm font-semibold text-ink">{emptyTitle ?? t("ops.noResults")}</p>
      <p className="mt-1 text-xs text-muted">{emptyDescription ?? t("ops.noResultsDescription")}</p>
    </div>
  )
}

function TableHeadCell<T>({
  column,
  sort,
  onSort,
}: {
  column: DataTableColumn<T>
  sort: SortState
  onSort: (columnId: string) => void
}) {
  const sortable = Boolean(column.sortValue || column.accessor)
  const active = sort.columnId === column.id
  const ariaSort = !sortable ? undefined : active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className={cn("whitespace-nowrap px-4 py-2.5", column.align === "right" && "text-right", column.className)}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort(column.id)}
          className={cn(
            "inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.12em] hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            column.align === "right" && "flex-row-reverse",
          )}
        >
          <span>{column.header}</span>
          <SortIcon active={active} direction={sort.direction} />
        </button>
      ) : column.header}
    </th>
  )
}

const INTERACTIVE_ROW_TAGS = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"])

function handleRowKeyDown<T>(
  event: React.KeyboardEvent<HTMLTableRowElement>,
  row: T,
  onRowClick?: (row: T) => void,
) {
  if (!onRowClick) return
  if (event.key !== "Enter" && event.key !== " ") return
  const target = event.target as HTMLElement | null
  if (target && target !== event.currentTarget && INTERACTIVE_ROW_TAGS.has(target.tagName)) return
  event.preventDefault()
  onRowClick(row)
}

function TableBodyGrid<T>({
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  onRowClick,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort: SortState
  onSort: (columnId: string) => void
  onRowClick?: (row: T) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b bg-canvas/60 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {columns.map((column) => (
              <TableHeadCell key={column.id} column={column} sort={sort} onSort={onSort} />
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={onRowClick ? (event) => handleRowKeyDown(event, row, onRowClick) : undefined}
              className={cn(
                "transition-colors",
                onRowClick && "cursor-pointer hover:bg-neutral-soft/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              )}
            >
              {columns.map((column) => (
                <td
                  key={column.id}
                  className={cn(
                    "px-4 py-3 align-middle text-ink",
                    column.numeric && "tabular-nums",
                    column.align === "right" && "text-right",
                    column.className,
                  )}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function filterTableRows<T>(
  rows: T[],
  query: string,
  columns: DataTableColumn<T>[],
  filterFn?: (row: T, query: string) => boolean,
): T[] {
  const trimmed = query.trim().toLowerCase()
  if (!trimmed) return rows
  return rows.filter((row) => (filterFn ? filterFn(row, trimmed) : defaultRowFilter(row, columns, trimmed)))
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  searchable = false,
  searchPlaceholder,
  filterFn,
  loading = false,
  emptyTitle,
  emptyDescription,
  initialSortColumnId,
  initialSortDirection = "asc",
  onRowClick,
  className,
  "data-testid": testId = "data-table",
}: DataTableProps<T>) {
  const { t } = useLocale()
  const [query, setQuery] = useState("")
  const [sort, setSort] = useState<SortState>({
    columnId: initialSortColumnId ?? null,
    direction: initialSortDirection,
  })

  const filteredRows = useMemo(
    () => filterTableRows(rows, query, columns, filterFn),
    [columns, filterFn, query, rows],
  )
  const sortColumn = useMemo(
    () => columns.find((column) => column.id === sort.columnId),
    [columns, sort.columnId],
  )
  const sortedRows = useMemo(
    () => sortRows(filteredRows, sortColumn, sort.direction),
    [filteredRows, sort.direction, sortColumn],
  )

  if (loading && rows.length === 0) {
    return <StatePanel kind="loading" title={t("ops.loadingData")} description={t("ops.loadingDescription")} />
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-panel", className)} data-testid={testId}>
      <TableSearchBar visible={searchable} query={query} placeholder={searchPlaceholder} onChange={setQuery} />
      {sortedRows.length === 0 ? (
        <TableEmptyState testId={testId} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
      ) : (
        <TableBodyGrid
          columns={columns}
          rows={sortedRows}
          rowKey={rowKey}
          sort={sort}
          onSort={(columnId) => setSort((prev) => nextSortState(prev, columnId))}
          onRowClick={onRowClick}
        />
      )}
    </div>
  )
}
