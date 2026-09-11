"use client"

import type {
  ColumnDef,
  PaginationState,
  RowData,
  SortingState,
} from "@tanstack/react-table"
import { useTable } from "@tanstack/react-table"
import * as React from "react"

import type { DataTableFeatures } from "@/components/data-table/features"
import { features } from "@/components/data-table/features"
import { DataTablePagination } from "@/components/data-table/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DEFAULT_PAGE_SIZE } from "@/constants/app"

interface InstanceTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[]
  data: TData[]
  fetchNextPage: () => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
}

export function InstanceTable<TData extends RowData>({
  columns,
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: InstanceTableProps<TData>) {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [rowSelection, setRowSelection] = React.useState({})
  const loadedPageCount = Math.ceil(data.length / pagination.pageSize)

  const table = useTable({
    columns,
    data,
    features,
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    pageCount: loadedPageCount + (hasNextPage ? 1 : 0),
    state: {
      pagination,
      rowSelection,
      sorting,
    },
  })

  React.useEffect(() => {
    if (
      pagination.pageIndex >= loadedPageCount &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage()
    }
  }, [
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    loadedPageCount,
    pagination.pageIndex,
  ])

  return (
    <>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                data-state={row.getIsSelected() && "selected"}
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    <table.FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={columns.length}>
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="mt-4">
        <DataTablePagination table={table} />
      </div>
    </>
  )
}
