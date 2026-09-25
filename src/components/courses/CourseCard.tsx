import { Link } from "react-router-dom";
import { Course } from "../../types";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

export function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="flex min-h-56 flex-col">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-md bg-slate-900 text-sm font-bold text-white dark:bg-white dark:text-slate-900">{course.icon}</span>
        <div className="min-w-0">
          <h3 className="font-semibold">{course.title}</h3>
          <p className="text-sm text-slate-500">{course.instructor}</p>
        </div>
      </div>
      <p className="mt-4 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{course.description}</p>
      <div className="mt-auto pt-5">
        <div className="mb-2 flex justify-between text-sm"><span>{course.modules} modules</span><span>{course.progress}%</span></div>
        <ProgressBar value={course.progress} />
        <Link to={`/student/courses/${course.id}`}><Button className="mt-4 w-full">Continue</Button></Link>
      </div>
    </Card>
  );
}
