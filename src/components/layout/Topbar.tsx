import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Moon, Search, Sun } from "lucide-react";
import { assignments, courses, resources } from "../../data/mockData";
import { logout } from "../../store/slices/authSlice";
import { toggleTheme } from "../../store/slices/themeSlice";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { Button } from "../ui/Button";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const user = useAppSelector((state) => state.auth.user);
  const dark = useAppSelector((state) => state.theme.mode === "dark");
  const unread = useAppSelector((state) => state.notifications.items.filter((item) => !item.read).length);
  const results = useMemo(() => {
    if (query.trim().length < 2) return [];
    const value = query.toLowerCase();
    return [
      ...courses.filter((item) => item.title.toLowerCase().includes(value)).map((item) => ({ group: "Courses", label: item.title, to: `/${user?.role ?? "student"}/courses` })),
      ...resources.filter((item) => item.title.toLowerCase().includes(value)).map((item) => ({ group: "Notes", label: item.title, to: user?.role === "teacher" ? "/teacher/resources" : "/student/ai-notes" })),
      ...assignments.filter((item) => item.title.toLowerCase().includes(value)).map((item) => ({ group: "Assignments", label: item.title, to: `/${user?.role ?? "student"}/assignments` })),
    ].slice(0, 6);
  }, [query, user?.role]);

  function signOut() {
    dispatch(logout());
    navigate("/login");
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <Button variant="ghost" className="h-10 w-10 px-0 lg:hidden" onClick={onMenu} aria-label="Open sidebar">
        <Menu size={20} />
      </Button>
      <div className="relative hidden flex-1 md:block">
        <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
        <input className="field max-w-xl pl-10" placeholder="Search courses, notes, assignments, quizzes..." aria-label="Global search" value={query} onChange={(event) => setQuery(event.target.value)} />
        {query.length > 1 && (
          <div className="absolute left-0 top-12 z-30 w-full max-w-xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900">
            {results.length > 0 ? results.map((result) => (
              <Link key={`${result.group}-${result.label}`} to={result.to} onClick={() => setQuery("")} className="block px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800">
                <p className="text-xs font-semibold uppercase text-slate-500">{result.group}</p>
                <p className="text-sm font-medium">{result.label}</p>
              </Link>
            )) : <p className="px-4 py-3 text-sm text-slate-500">No results found.</p>}
          </div>
        )}
      </div>
      <Button variant="ghost" className="h-10 w-10 px-0" onClick={() => dispatch(toggleTheme())} aria-label="Toggle theme" title="Toggle theme">
        {dark ? <Sun size={19} /> : <Moon size={19} />}
      </Button>
      <Link to={`/${user?.role ?? "student"}/notifications`} className="relative inline-flex h-10 w-10 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Notifications">
        <Bell size={19} />
        {unread > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-coral" />}
      </Link>
      <div className="hidden min-w-0 items-center gap-3 border-l border-slate-200 pl-3 dark:border-slate-800 sm:flex">
        <div className="grid h-9 w-9 place-items-center rounded-md bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">{user?.name.slice(0, 1) ?? "U"}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{user?.name}</p>
          <p className="text-xs capitalize text-slate-500">{user?.role}</p>
        </div>
      </div>
      <Button variant="ghost" className="h-10 w-10 px-0" onClick={signOut} aria-label="Log out" title="Log out">
        <LogOut size={18} />
      </Button>
    </header>
  );
}
