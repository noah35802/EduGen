import { NavLink } from "react-router-dom";
import { X } from "lucide-react";
import { Role } from "../../types";
import { cn } from "../../utils/cn";
import { Button } from "../ui/Button";
import { roleNavigation } from "./navigation";

export function Sidebar({ role, open, onClose }: { role: Role; open: boolean; onClose: () => void }) {
  return (
    <>
      <div className={cn("fixed inset-0 z-30 bg-slate-950/40 lg:hidden", open ? "block" : "hidden")} onClick={onClose} />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-950 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <NavLink to="/" className="flex items-center gap-3 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-600 text-white">E</span>
            <span>EduGen AI</span>
          </NavLink>
          <Button variant="ghost" className="h-9 w-9 px-0 lg:hidden" onClick={onClose} aria-label="Close sidebar">
            <X size={18} />
          </Button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {roleNavigation[role].map(([label, href, Icon]) => (
            <NavLink
              key={href}
              to={href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-900",
                  isActive && "bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-100",
                )
              }
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
