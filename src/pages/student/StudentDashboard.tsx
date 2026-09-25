import { Award, CalendarCheck, Flame, Gauge } from "lucide-react";
import { assignments, courses, students, weakTopics } from "../../data/mockData";
import { PerformanceLineChart } from "../../components/charts/Charts";
import { AIInsightCard } from "../../components/ai/AIComponents";
import { CourseCard } from "../../components/courses/CourseCard";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { Button } from "../../components/ui/Button";
import { useAppSelector } from "../../store/hooks";

export function StudentDashboard() {
  const user = useAppSelector((state) => state.auth.user);
  return (
    <>
      <PageHeader title={`Good morning, ${user?.name ?? "Radhika Singhania"}`} subtitle="Here's your learning progress today." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Overall Progress" value="72%" detail="+8% this month" icon={Gauge} />
        <StatCard title="Average Quiz Score" value="84%" detail="Top 18% in class" icon={Award} />
        <StatCard title="Attendance" value="91%" detail="Above required threshold" icon={CalendarCheck} />
        <StatCard title="Study Streak" value="12 days" detail="Keep the streak alive" icon={Flame} />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
        <section>
          <h2 className="mb-4 text-lg font-semibold">Continue Learning</h2>
          <div className="grid gap-4 md:grid-cols-2">{courses.map((course) => <CourseCard key={course.id} course={course} />)}</div>
        </section>
        <section className="space-y-6">
          <Card><h2 className="mb-4 font-semibold">Performance Chart</h2><PerformanceLineChart /></Card>
          <Card>
            <h2 className="mb-4 font-semibold">Weak Topics</h2>
            <div className="space-y-4">
              {weakTopics.map((topic) => (
                <div key={topic.topic}>
                  <div className="mb-1 flex justify-between text-sm"><span>{topic.topic}</span><span>{topic.score}%</span></div>
                  <ProgressBar value={topic.score} />
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="mb-4 font-semibold">Upcoming Tasks</h2>
          <div className="space-y-3">{assignments.slice(0, 3).map((task) => <div key={task.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800"><span>{task.title}</span><span className="text-slate-500">{task.dueDate}</span></div>)}</div>
        </Card>
        <AIInsightCard title="AI Recommendation">
          You are struggling with Dynamic Programming. Spend 45 minutes today reviewing Recursion and Memoization before attempting the next quiz.
          <div className="mt-4"><Button>Start Recommended Study</Button></div>
        </AIInsightCard>
      </div>
      <Card>
        <h2 className="mb-4 font-semibold">Leaderboard</h2>
        <div className="grid gap-3 md:grid-cols-4">{students.map((student, index) => <div key={student.id} className="rounded-md bg-slate-50 p-3 dark:bg-slate-800"><p className="text-xs text-slate-500">Rank {index + 1}</p><p className="font-semibold">{student.name}</p><p className="text-sm">{student.xp} XP</p></div>)}</div>
      </Card>
    </>
  );
}
