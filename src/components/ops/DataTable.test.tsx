import { cleanup, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import type { DataTableColumn } from "@reliaforge/plugin-sdk"
import { DataTable } from "@/components/ops/DataTable"

interface NodeRow {
  name: string
  cpu: number
}

const columns: DataTableColumn<NodeRow>[] = [
  { id: "name", header: "Node", accessor: (row) => row.name, cell: (row) => row.name },
  { id: "cpu", header: "CPU %", accessor: (row) => row.cpu, cell: (row) => `${row.cpu}%`, numeric: true, align: "right" },
]

afterEach(cleanup)

describe("DataTable", () => {
  it("renders rows, supports sorting, search filtering, and row click", async () => {
    const user = userEvent.setup()
    const onRowClick = vi.fn()
    const rows: NodeRow[] = [
      { name: "pve-02", cpu: 45 },
      { name: "pve-01", cpu: 12 },
    ]

    render(
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.name}
        searchable
        onRowClick={onRowClick}
      />,
    )

    const cpuButton = screen.getByRole("button", { name: "CPU %" })
    await user.click(cpuButton)
    const cellsAsc = screen.getAllByRole("cell").map((c) => c.textContent)
    expect(cellsAsc).toEqual(["pve-01", "12%", "pve-02", "45%"])

    await user.click(cpuButton)
    const cellsDesc = screen.getAllByRole("cell").map((c) => c.textContent)
    expect(cellsDesc).toEqual(["pve-02", "45%", "pve-01", "12%"])

    const searchInput = screen.getByRole("searchbox")
    await user.type(searchInput, "pve-01")
    expect(screen.getAllByRole("row")).toHaveLength(2)
    expect(screen.getByText("pve-01")).toBeInTheDocument()

    await user.click(screen.getByText("pve-01"))
    expect(onRowClick).toHaveBeenCalledWith({ name: "pve-01", cpu: 12 })

    const row = screen.getByText("pve-01").closest("tr")!
    row.focus()
    await user.keyboard("{Enter}")
    await user.keyboard(" ")
    expect(onRowClick).toHaveBeenCalledTimes(3)

    await user.click(screen.getByRole("button", { name: "Clear filter" }))
    expect(screen.getAllByRole("row")).toHaveLength(3)
  })

  it("renders loading and empty states", () => {
    const { rerender } = render(
      <DataTable columns={columns} rows={[]} rowKey={(row) => row.name} loading />,
    )
    expect(screen.getByTestId("loading-state")).toBeInTheDocument()

    rerender(
      <DataTable
        columns={columns}
        rows={[]}
        rowKey={(row) => row.name}
        emptyTitle="Nothing here"
        emptyDescription="Zero records"
      />,
    )
    expect(screen.getByTestId("data-table-empty")).toHaveTextContent("Nothing here")
  })
})
