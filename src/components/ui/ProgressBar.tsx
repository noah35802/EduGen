import { cn } from "../../utils/cn";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}>
      <div className="h-full rounded-full bg-mint transition-all" style={{ width: `${Math.min(value, 100)}%` }} />
    </div>
  );
}
