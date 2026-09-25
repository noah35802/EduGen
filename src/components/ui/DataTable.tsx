import { useMemo, useState } from "react";
import { ArrowDownAZ, Download, Search } from "lucide-react";
import { Input } from "./Input";
import { Button } from "./Button";

export type Column<T> = { key: keyof T; header: string; render?: (row: T) => React.ReactNode };

export function DataTable<T extends { id: string }>({ data, columns }: { data: T[]; columns: Column<T>[] }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof T>(columns[0]?.key ?? "id");
  const [statusFilter, setStatusFilter] = useState("All");
  const statusOptions = useMemo(() => {
    const values = data.map((row) => String((row as Record<string, unknown>).status ?? "")).filter(Boolean);
    return ["All", ...Array.from(new Set(values))];
  }, [data]);
  const filtered = useMemo(() => {
    return data
      .filter((row) => JSON.stringify(row).toLowerCase().includes(query.toLowerCase()))
      .filter((row) => statusFilter === "All" || String((row as Record<string, unknown>).status) === statusFilter)
      .sort((a, b) => String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, { numeric: true }));
  }, [data, query, sortKey, statusFilter]);
  const pageItems = filtered.slice((page - 1) * 5, page * 5);
  const pages = Math.max(1, Math.ceil(filtered.length / 5));
  const exportTable = () => {
    const header = columns.map((column) => column.header).join(",");
    const rows = filtered.map((row) => columns.map((column) => JSON.stringify(String(row[column.key] ?? ""))).join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "edugen-table-export.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="surface overflow-hidden rounded-lg">
      <div className="grid gap-3 border-b border-slate-200 p-4 dark:border-slate-800 lg:grid-cols-[1fr_180px_180px_auto]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
          <Input aria-label="Search table" className="pl-10" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search, filter or sort..." />
        </div>
        {statusOptions.length > 1 && (
          <select className="field" aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }}>
            {statusOptions.map((status) => <option key={status}>{status}</option>)}
          </select>
        )}
        <select className="field" aria-label="Sort table" value={String(sortKey)} onChange={(event) => setSortKey(event.target.value as keyof T)}>
          {columns.map((column) => <option key={String(column.key)} value={String(column.key)}>Sort by {column.header}</option>)}
        </select>
        <Button variant="secondary" onClick={exportTable}><Download size={16} /> Export</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>{columns.map((column) => <th key={String(column.key)} className="px-4 py-3">{column.header}{sortKey === column.key && <ArrowDownAZ className="ml-1 inline" size={14} />}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {pageItems.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {columns.map((column) => <td key={String(column.key)} className="px-4 py-3">{column.render ? column.render(row) : String(row[column.key])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between border-t border-slate-200 p-4 text-sm dark:border-slate-800">
        <span>Page {page} of {pages}</span>
        <div className="flex gap-2">
          <Button variant="secondary" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
          <Button variant="secondary" disabled={page === pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
        </div>
      </div>
    </div>
  );
}
