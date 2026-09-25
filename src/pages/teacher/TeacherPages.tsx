import { useState } from "react";
import { BarChart3, FileUp, Plus, Users, ClipboardCheck, CalendarCheck } from "lucide-react";
import { AIInsightCard } from "../../components/ai/AIComponents";
import { ActivityAreaChart, DistributionChart, PerformanceLineChart, SubjectBarChart } from "../../components/charts/Charts";
import { PageHeader } from "../../components/layout/PageHeader";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { Input, Label, Select } from "../../components/ui/Input";
import { Modal } from "../../components/ui/Modal";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";
import { assignments, courses, students, weakTopics } from "../../data/mockData";
import { AIQuizGeneratorPage } from "../student/AIFeaturePages";
import { NotificationsPage, ProfilePage, ResourcesPage, SettingsPage } from "../student/StudentUtilityPages";

export function TeacherDashboard() {
  return (
    <>
      <PageHeader title="Teacher Dashboard" subtitle="Class performance, attendance, quizzes and recent activity." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Students" value="148" detail="Across active courses" icon={Users} />
        <StatCard title="Average Class Score" value="76%" detail="+6% over last month" icon={BarChart3} />
        <StatCard title="Assignment Completion" value="82%" detail="24 pending reviews" icon={ClipboardCheck} />
        <StatCard title="Average Attendance" value="89%" detail="3 students below threshold" icon={CalendarCheck} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 font-semibold">Class performance</h2><PerformanceLineChart /></Card><Card><h2 className="mb-4 font-semibold">Attendance</h2><ActivityAreaChart /></Card><Card><h2 className="mb-4 font-semibold">Quiz performance</h2><SubjectBarChart /></Card><Card><h2 className="mb-4 font-semibold">Recent activity</h2><div className="space-y-3">{assignments.map((item) => <div key={item.id} className="rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800">{item.title} • {item.status}</div>)}</div></Card></div>
    </>
  );
}

export function TeacherCoursesPage() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeader title="Course Management" subtitle="Create courses, add modules and upload resources." actions={<Button onClick={() => setOpen(true)}><Plus size={18} /> Create course</Button>} />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <Card key={course.id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{course.title}</h3><p className="text-sm text-slate-500">{course.students} students</p></div><Badge tone={course.status === "Active" ? "success" : "warning"}>{course.status}</Badge></div><ProgressBar className="mt-4" value={course.progress} /><div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" onClick={() => setMessage(`${course.title} opened for editing.`)}>Edit</Button><Button variant="secondary" onClick={() => setMessage(`New module added to ${course.title}.`)}>Add modules</Button><Button variant="secondary" onClick={() => setMessage(`Upload queue opened for ${course.title}.`)}>Upload notes</Button><Button variant="danger" onClick={() => setMessage(`${course.title} moved to archived draft for demo.`)}>Delete</Button></div></Card>)}</div>
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      <Modal open={open} title="Create Course" onClose={() => setOpen(false)}>
        <div className="grid gap-4"><div><Label>Course title</Label><Input placeholder="Computer Networks" /></div><div><Label>Description</Label><Input placeholder="Course description" /></div><Button onClick={() => { setOpen(false); setMessage("Course created and saved as active draft."); }}>Save course</Button></div>
      </Modal>
    </>
  );
}

export function TeacherStudentsPage() {
  return (
    <>
      <PageHeader title="Students" subtitle="Select a student to inspect attendance, progress and predicted performance." />
      <DataTable data={students} columns={[{ key: "name", header: "Name" }, { key: "email", header: "Email" }, { key: "course", header: "Course" }, { key: "progress", header: "Progress", render: (row) => <div className="min-w-32"><ProgressBar value={row.progress} /></div> }, { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "Active" ? "success" : "warning"}>{row.status}</Badge> }, { key: "id", header: "Actions", render: () => <Button variant="secondary">View analytics</Button> }]} />
      <Card><h2 className="mb-4 font-semibold">Selected Student Analytics</h2><div className="grid gap-6 lg:grid-cols-2"><PerformanceLineChart /><AIInsightCard title="AI predicted performance">Student is likely to score 74%. Weak topics: Graphs, Dynamic Programming. Recommended action: targeted practice set and attendance follow-up.</AIInsightCard></div></Card>
    </>
  );
}

export function TeacherAssignmentsPage() {
  const [message, setMessage] = useState("");
  return (
    <>
      <PageHeader title="Assignments" subtitle="Create assignments and review student submissions." actions={<Button onClick={() => setMessage("Assignment creation form opened for demo.")}><Plus size={18} /> Create assignment</Button>} />
      <DataTable data={assignments} columns={[{ key: "title", header: "Title" }, { key: "subject", header: "Subject" }, { key: "dueDate", header: "Due date" }, { key: "status", header: "Status" }, { key: "id", header: "Actions", render: (row) => <Button variant="secondary" onClick={() => setMessage(`Reviewing ${row.title}.`)}>Review</Button> }]} />
      {message && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
    </>
  );
}

export function TeacherUploadPage() {
  const [processing, setProcessing] = useState(false);
  const [action, setAction] = useState("");
  return (
    <>
      <PageHeader title="Resources" subtitle="Upload PDF, PPT, DOC and process them with AI." />
      <Card className="border-dashed text-center"><FileUp className="mx-auto text-brand-600" size={34} /><h2 className="mt-3 font-semibold">Teacher file upload</h2><p className="mt-1 text-sm text-slate-500">Accepted: PDF, PPT, PPTX, DOC, DOCX</p><Button className="mt-4" onClick={() => setProcessing(true)}>Upload file</Button></Card>
      {processing && <Card><h2 className="font-semibold">Processing status</h2><ProgressBar className="mt-4" value={72} /><div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => setAction("Summary generated for uploaded file.")}>Generate Summary</Button><Button variant="secondary" onClick={() => setAction("Quiz generated for uploaded file.")}>Generate Quiz</Button><Button variant="secondary" onClick={() => setAction("Flashcards generated for uploaded file.")}>Generate Flashcards</Button></div>{action && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{action}</p>}</Card>}
      <ResourcesPage />
    </>
  );
}

export function TeacherAIReportsPage() {
  return (
    <>
      <PageHeader title="AI Reports" subtitle="Class weak topics and students requiring attention." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card><h2 className="mb-4 font-semibold">Class Weak Topics</h2>{weakTopics.slice(3).map((topic) => <div key={topic.topic} className="mb-4"><div className="mb-1 flex justify-between text-sm"><span>{topic.topic}</span><span>{topic.score}%</span></div><ProgressBar value={topic.score} /></div>)}</Card>
        <Card><h2 className="mb-4 font-semibold">Students At Risk</h2>{students.filter((student) => student.status !== "Active").map((student) => <div key={student.id} className="mb-3 rounded-md bg-slate-50 p-3 dark:bg-slate-800"><p className="font-semibold">{student.name}</p><p className="text-sm text-slate-500">{student.status}</p></div>)}</Card>
      </div>
    </>
  );
}

export function TeacherAnalyticsPage() {
  return (
    <>
      <PageHeader title="Analytics" subtitle="Class trends, resource usage and assessment health." />
      <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 font-semibold">Class trend</h2><PerformanceLineChart /></Card><Card><h2 className="mb-4 font-semibold">Performance distribution</h2><DistributionChart /></Card></div>
    </>
  );
}

export { AIQuizGeneratorPage as TeacherAIQuizGeneratorPage, NotificationsPage as TeacherNotificationsPage, ProfilePage as TeacherProfilePage, SettingsPage as TeacherSettingsPage };
