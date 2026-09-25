import { LucideIcon } from "lucide-react";
import { Card } from "./Card";

export function StatCard({ title, value, detail, icon: Icon }: { title: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <Card className="min-h-32">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="mt-2 text-2xl font-bold tracking-normal text-slate-950 dark:text-white">{value}</p>
        </div>
        <span className="rounded-md bg-brand-50 p-2 text-brand-600 dark:bg-brand-950">
          <Icon size={20} />
        </span>
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
    </Card>
  );
}
