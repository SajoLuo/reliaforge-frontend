import { ArrowDown, ArrowUp, ArrowUpDown, Search, X } from "lucide-react"
import { useMemo, useState, type CSSProperties, type ReactNode } from "react"
import type {
  DataTableBreakpoint,
  DataTableColumn,
  DataTableDensity,
  DataTableProps,
} from "@reliaforge/plugin-sdk"
import { StatePanel } from "@/components/common/StatePanel"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/i18n/useLocale"
import { cn } from "@/lib/utils"

interface SortState {
  columnId: string | null
  direction: "asc" | "desc"
}

const HIDE_BELOW_CLASSES: Record<DataTableBreakpoint, string> = {
  sm: "hidden sm:table-cell",
  md: "hidden md:table-cell",
  lg: "hidden lg:table-cell",
  xl: "hidden xl:table-cell",
}

const INTERACTIVE_ROW_TAGS = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"])

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

function columnStyle<T>(column: DataTableColumn<T>): CSSProperties | undefined {
  if (column.width === undefined && column.minWidth === undefined) return undefined
  return {
    ...(column.width !== undefined ? { width: column.width } : {}),
    ...(column.minWidth !== undefined ? { minWidth: column.minWidth } : {}),
  }
}

function columnVisibilityClass<T>(column: DataTableColumn<T>): string | undefined {
  return column.hideBelow ? HIDE_BELOW_CLASSES[column.hideBelow] : undefined
}

function SortIcon({ active, direction }: { active: boolean; direction: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50" aria-hidden="true" />
  return direction === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
    : <ArrowDown className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
}

function TableToolbar({
  searchable,
  toolbar,
  query,
  placeholder,
  shownCount,
  totalCount,
  onChange,
}: {
  searchable: boolean
  toolbar?: ReactNode
  query: string
  placeholder?: string
  shownCount: number
  totalCount: number
  onChange: (value: string) => void
}) {
  const { t } = useLocale()
  if (!searchable && !toolbar) return null
  const label = placeholder ?? t("ops.searchPlaceholder")
  const countLabel = shownCount === totalCount ? String(totalCount) : `${shownCount} / ${totalCount}`

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-line bg-panel-inset px-3 py-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {searchable ? (
          <div className="flex min-w-[12rem] max-w-xs flex-1 items-center gap-1.5 rounded-md border border-line bg-panel px-2.5 py-1">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => onChange(event.target.value)}
              placeholder={label}
              aria-label={label}
              className="w-full bg-transparent text-xs text-ink placeholder:text-muted focus:outline-none"
            />
            {query ? (
              <Button
                type="button"
                variant="ghost"
                size="small"
                onClick={() => onChange("")}
                aria-label={t("ops.clearSearch")}
                className="h-5 w-5 p-0"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </Button>
            ) : null}
          </div>
        ) : null}
        {toolbar}
      </div>
      <span className="shrink-0 text-xs font-medium text-muted tabular-nums" data-testid="data-table-count">
        {countLabel}
      </span>
    </div>
  )
}

function TableEmptyState({
  testId,
  emptyText,
  emptyTitle,
  emptyDescription,
}: {
  testId: string
  emptyText?: string
  emptyTitle?: string
  emptyDescription?: string
}) {
  const { t } = useLocale()
  return (
    <div className="px-4 py-8 text-center" data-testid={`${testId}-empty`}>
      <p className="text-sm font-medium text-muted">{emptyText ?? emptyTitle ?? t("ops.noResults")}</p>
      {emptyDescription ? <p className="mt-1 text-xs text-muted">{emptyDescription}</p> : null}
    </div>
  )
}

function TableHeadCell<T>({
  column,
  density,
  sort,
  onSort,
}: {
  column: DataTableColumn<T>
  density: DataTableDensity
  sort: SortState
  onSort: (columnId: string) => void
}) {
  const sortable = Boolean(column.sortValue || column.accessor)
  const active = sort.columnId === column.id
  const ariaSort = !sortable ? undefined : active ? (sort.direction === "asc" ? "ascending" : "descending") : "none"
  const padClass = density === "compact" ? "px-3 py-2" : "px-4 py-2.5"
  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      style={columnStyle(column)}
      className={cn(
        "whitespace-nowrap text-xs font-medium text-muted",
        padClass,
        column.align === "right" && "text-right",
        column.sticky === "right" && "sticky right-0 z-20 bg-panel-inset shadow-[-8px_0_12px_-10px_rgb(var(--shadow)/0.14)]",
        columnVisibilityClass(column),
        column.className,
      )}
    >
      {sortable ? (
        <button
          type="button"
          onClick={() => onSort(column.id)}
          className={cn(
            "inline-flex items-center gap-1 font-medium hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
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

function renderCellContent<T>(column: DataTableColumn<T>, row: T): ReactNode {
  const content = column.cell(row)
  if (!column.truncate) return content
  const raw = column.accessor?.(row)
  const tooltip = typeof raw === "string" || typeof raw === "number" ? String(raw) : undefined
  return (
    <div
      className={cn("truncate", column.width === undefined && "max-w-[18rem]")}
      style={column.width !== undefined ? { maxWidth: column.width } : undefined}
      title={tooltip}
    >
      {content}
    </div>
  )
}

function TableCell<T>({
  column,
  row,
  density,
  clickable,
}: {
  column: DataTableColumn<T>
  row: T
  density: DataTableDensity
  clickable: boolean
}) {
  const padClass = density === "compact" ? "px-3 py-2 text-[13px] leading-5" : "px-4 py-3 text-sm"
  return (
    <td
      style={columnStyle(column)}
      className={cn(
        "align-middle text-ink",
        padClass,
        column.numeric && "tabular-nums",
        column.nowrap && "whitespace-nowrap",
        column.align === "right" && "text-right",
        column.sticky === "right" && cn(
          "sticky right-0 z-10 bg-panel shadow-[-8px_0_12px_-10px_rgb(var(--shadow)/0.14)]",
          clickable && "group-hover:bg-panel-inset",
        ),
        columnVisibilityClass(column),
        column.className,
      )}
    >
      {renderCellContent(column, row)}
    </td>
  )
}

function TableBodyGrid<T>({
  columns,
  rows,
  rowKey,
  density,
  sort,
  onSort,
  onRowClick,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  density: DataTableDensity
  sort: SortState
  onSort: (columnId: string) => void
  onRowClick?: (row: T) => void
}) {
  const clickable = Boolean(onRowClick)
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-panel-inset">
            {columns.map((column) => (
              <TableHeadCell key={column.id} column={column} density={density} sort={sort} onSort={onSort} />
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
                "group transition-colors",
                clickable && "cursor-pointer hover:bg-panel-inset focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent",
              )}
            >
              {columns.map((column) => (
                <TableCell key={column.id} column={column} row={row} density={density} clickable={clickable} />
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
  toolbar,
  density = "compact",
  loading = false,
  emptyText,
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
    return <StatePanel kind="loading" title={t("ops.loadingData")} />
  }

  return (
    <div className={cn("overflow-hidden rounded-lg border border-line bg-panel shadow-panel", className)} data-testid={testId}>
      <TableToolbar
        searchable={searchable}
        toolbar={toolbar}
        query={query}
        placeholder={searchPlaceholder}
        shownCount={sortedRows.length}
        totalCount={rows.length}
        onChange={setQuery}
      />
      {sortedRows.length === 0 ? (
        <TableEmptyState
          testId={testId}
          emptyText={emptyText}
          emptyTitle={emptyTitle}
          emptyDescription={emptyDescription}
        />
      ) : (
        <TableBodyGrid
          columns={columns}
          rows={sortedRows}
          rowKey={rowKey}
          density={density}
          sort={sort}
          onSort={(columnId) => setSort((prev) => nextSortState(prev, columnId))}
          onRowClick={onRowClick}
        />
      )}
    </div>
  )
}
