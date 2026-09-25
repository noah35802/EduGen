import { HTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export function Card(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("surface rounded-lg p-5", props.className)} />;
}

export function Section(props: HTMLAttributes<HTMLDivElement>) {
  return <section {...props} className={cn("space-y-4", props.className)} />;
}
