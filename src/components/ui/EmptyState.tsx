import { Inbox } from "lucide-react";
import { Card } from "./Card";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <Inbox className="text-slate-400" />
      <h3 className="mt-3 font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500 dark:text-slate-400">{description}</p>
    </Card>
  );
}
