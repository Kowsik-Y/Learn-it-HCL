import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T;
  render?: (item: T) => React.ReactNode;
  headerClassName?: string;
  cellClassName?: string | ((item: T) => string);
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  emptyMessage?: React.ReactNode;
}

export function DataTable<T>({ 
  columns, 
  data, 
  keyExtractor, 
  emptyMessage = "No data found." 
}: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col, index) => (
              <TableHead key={index} className={col.headerClassName}>
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell 
                colSpan={columns.length} 
                className="h-24 text-center text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={keyExtractor(item)} className="group">
                {columns.map((col, index) => (
                  <TableCell key={index} className={typeof col.cellClassName === 'function' ? col.cellClassName(item) : col.cellClassName}>
                    {col.render ? col.render(item) : (col.accessor ? String(item[col.accessor]) : null)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
