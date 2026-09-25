import { Bot, Copy, RefreshCw, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";

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

export function AIResponse({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-brand-100 bg-white p-4 dark:border-brand-900 dark:bg-slate-900">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 font-semibold"><Bot size={18} className="text-brand-600" /> EduGen AI</span>
        <Badge tone="ai">Generated</Badge>
      </div>
      <div className="text-sm leading-6">{children}</div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary"><Copy size={16} /> Copy</Button>
        <Button variant="secondary"><RefreshCw size={16} /> Regenerate</Button>
        <Button variant="ghost"><ThumbsUp size={16} /> Helpful</Button>
        <Button variant="ghost"><ThumbsDown size={16} /> Not helpful</Button>
      </div>
    </div>
  );
}
