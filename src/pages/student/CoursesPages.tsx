import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, Circle, Lock, Search } from "lucide-react";
import { courses } from "../../data/mockData";
import { CourseCard } from "../../components/courses/CourseCard";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { Badge } from "../../components/ui/Badge";

export function MyCoursesPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("progress");
  const filtered = useMemo(() => courses.filter((course) => course.title.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title) : b.progress - a.progress), [query, sort]);
  return (
    <>
      <PageHeader title="My Courses" subtitle="Search, filter and continue your learning paths." actions={<Button>Create Study Goal</Button>} />
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="relative"><Search className="absolute left-3 top-2.5 text-slate-400" size={18} /><Input className="pl-10" placeholder="Search courses..." value={query} onChange={(event) => setQuery(event.target.value)} /></div>
        <Select value={sort} onChange={(event) => setSort(event.target.value)}><option value="progress">Sort by progress</option><option value="title">Sort by title</option></Select>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{filtered.map((course) => <CourseCard key={course.id} course={course} />)}</div>
    </>
  );
}

export function CourseDetailPage() {
  const { id } = useParams();
  const course = courses.find((item) => item.id === id) ?? courses[0];
  const modules = ["Introduction", "Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming"];
  return (
    <>
      <PageHeader title={course.title} subtitle={`${course.instructor} • ${course.description}`} actions={<Button>Continue Module</Button>} />
      <Card>
        <div className="mb-2 flex justify-between text-sm"><span>Course progress</span><span>{course.progress}%</span></div>
        <ProgressBar value={course.progress} />
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {modules.map((module, index) => {
          const completed = index < 3;
          const current = index === 3;
          return (
            <Card key={module}>
              <div className="flex items-start gap-3">
                {completed ? <CheckCircle2 className="text-emerald-600" /> : current ? <Circle className="text-brand-600" /> : <Lock className="text-slate-400" />}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold">Module {index + 1} - {module}</h3><Badge tone={completed ? "success" : current ? "ai" : "default"}>{completed ? "Completed" : current ? "Current" : "Locked"}</Badge></div>
                  <p className="mt-2 text-sm text-slate-500">Includes video, PDF notes, quiz and assignment.</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
