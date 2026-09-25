import { Activity, BookOpen, GraduationCap, Users } from "lucide-react";
import { useState } from "react";
import { ActivityAreaChart, DistributionChart, PerformanceLineChart, SubjectBarChart } from "../../components/charts/Charts";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { StatCard } from "../../components/ui/StatCard";
import { courses, students, teachers } from "../../data/mockData";
import { NotificationsPage, SettingsPage } from "../student/StudentUtilityPages";

export function AdminDashboard() {
  return (
    <>
      <PageHeader title="Admin Dashboard" subtitle="Platform health, user growth and academic activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value="1,248" detail="+12% this term" icon={Users} />
        <StatCard title="Total Teachers" value="84" detail="7 departments" icon={GraduationCap} />
        <StatCard title="Total Courses" value="126" detail="98 active courses" icon={BookOpen} />
        <StatCard title="Active Users" value="914" detail="Last 24 hours" icon={Activity} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 font-semibold">User growth</h2><PerformanceLineChart /></Card><Card><h2 className="mb-4 font-semibold">Course enrollment</h2><SubjectBarChart /></Card><Card><h2 className="mb-4 font-semibold">Platform activity</h2><ActivityAreaChart /></Card><Card><h2 className="mb-4 font-semibold">Performance distribution</h2><DistributionChart /></Card></div>
    </>
  );
}

export function AdminStudentsPage() {
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeader title="Students" subtitle="Search, filter, sort and manage student records." />
      <DataTable data={students} columns={[{ key: "name", header: "Name" }, { key: "email", header: "Email" }, { key: "course", header: "Course" }, { key: "progress", header: "Progress" }, { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "Active" ? "success" : "warning"}>{row.status}</Badge> }, { key: "id", header: "Actions", render: (row) => <Actions label={row.name} onAction={setMessage} /> }]} />
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    </>
  );
}

export function AdminTeachersPage() {
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeader title="Teachers" subtitle="Manage teacher profiles and course assignments." />
      <DataTable data={teachers} columns={[{ key: "name", header: "Name" }, { key: "email", header: "Email" }, { key: "department", header: "Department" }, { key: "courses", header: "Courses" }, { key: "status", header: "Status" }, { key: "id", header: "Actions", render: (row) => <Actions label={row.name} onAction={setMessage} /> }]} />
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    </>
  );
}

export function AdminCoursesPage() {
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeader title="Courses" subtitle="Manage courses, teachers, enrollment and status." />
      <DataTable data={courses.map((course) => ({ ...course, teacher: course.instructor, studentCount: course.students ?? 0 }))} columns={[{ key: "title", header: "Course" }, { key: "teacher", header: "Teacher" }, { key: "studentCount", header: "Students" }, { key: "status", header: "Status" }, { key: "id", header: "Actions", render: (row) => <Actions label={row.title} onAction={setMessage} /> }]} />
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    </>
  );
}

export function AdminSubjectsPage() {
  return (
    <>
      <PageHeader title="Subjects" subtitle="Academic subject catalog and ownership." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["DBMS", "Operating Systems", "Computer Networks", "Machine Learning"].map((subject) => <Card key={subject}><h3 className="font-semibold">{subject}</h3><p className="mt-2 text-sm text-slate-500">Department: CSE</p><Button className="mt-4" variant="secondary">View</Button></Card>)}</div>
    </>
  );
}

export function AdminAnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Institution-level performance and engagement analytics." />
      <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 font-semibold">Activity</h2><ActivityAreaChart /></Card><Card><h2 className="mb-4 font-semibold">Performance</h2><DistributionChart /></Card></div>
    </>
  );
}

export function AdminActivityPage() {
  return (
    <>
      <PageHeader title="System Activity" subtitle="Audit-ready activity feed for platform operations." />
      <Card><div className="space-y-3">{["Course Data Structures updated", "Teacher Demo uploaded notes", "Admin exported attendance report", "AI summary generated for OS notes"].map((item) => <div key={item} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">{item}</div>)}</div></Card>
    </>
  );
}

function Actions({ label, onAction }: { label: string; onAction: (message: string) => void }) {
  return <div className="flex gap-2"><Button variant="secondary" onClick={() => onAction(`Viewing ${label}.`)}>View</Button><Button variant="secondary" onClick={() => onAction(`Editing ${label}.`)}>Edit</Button><Button variant="danger" onClick={() => onAction(`${label} archived for demo.`)}>Delete</Button></div>;
}

export { NotificationsPage as AdminNotificationsPage, SettingsPage as AdminSettingsPage };
