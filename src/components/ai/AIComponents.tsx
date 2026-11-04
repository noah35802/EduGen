import { Sparkles } from "lucide-react";
import { Card } from "../ui/Card";

export function AIInsightCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-brand-100 bg-brand-50/60 dark:border-brand-900 dark:bg-brand-950/40">
      <div className="mb-3 flex items-center gap-2 text-brand-700 dark:text-brand-100">
        <Sparkles size={18} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="text-sm leading-6 text-slate-700 dark:text-slate-200">{children}</div>
    </Card>
  );
}
