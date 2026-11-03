import { useMemo, useState } from "react";
import { Award, BarChart3, CalendarCheck, CheckCircle2, Download, Eye, FileUp, Trash2 } from "lucide-react";
import { ActivityAreaChart, PerformanceLineChart, SubjectBarChart } from "../../components/charts/Charts";
import { AIInsightCard } from "../../components/ai/AIComponents";
import { PageHeader } from "../../components/layout/PageHeader";
import { assignments, notifications, resources, subjectPerformance, weakTopics } from "../../data/mockData";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { deleteNotification, markAllRead, markRead } from "../../store/slices/notificationsSlice";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { DataTable } from "../../components/ui/DataTable";
import { EmptyState } from "../../components/ui/EmptyState";
import { Input, Label, Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StatCard } from "../../components/ui/StatCard";

export function SubjectsPage() {
  return (
    <>
      <PageHeader title="Subjects" subtitle="Subject-wise analytics, attendance and weak topics." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {subjectPerformance.map((subject) => (
          <Card key={subject.subject}>
            <h3 className="font-semibold">{subject.subject}</h3>
            <p className="mt-1 text-sm text-slate-500">Professor: Demo</p>
            <div className="mt-4 space-y-3">
              <div><div className="mb-1 flex justify-between text-sm"><span>Average score</span><span>{subject.score}%</span></div><ProgressBar value={subject.score} /></div>
              <div><div className="mb-1 flex justify-between text-sm"><span>Attendance</span><span>{subject.attendance}%</span></div><ProgressBar value={subject.attendance} /></div>
            </div>
            <p className="mt-4 text-sm text-slate-500">Weak topics: Graphs, Scheduling, Revision tests</p>
          </Card>
        ))}
      </div>
    </>
  );
}

export function AssignmentsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [tab, setTab] = useState("All");
  const filtered = assignments.filter((item) => tab === "All" || item.status === tab);
  return (
    <>
      <PageHeader title="Assignments" subtitle="Track pending, submitted and graded work." />
      <div className="flex flex-wrap gap-2">{["All", "Pending", "Submitted", "Graded"].map((item) => <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>{item}</Button>)}</div>
      {filtered.length === 0 ? <EmptyState title="No assignments yet" description="New assignments will appear here when teachers publish them." /> : (
        <DataTable data={filtered} columns={[
          { key: "title", header: "Title" },
          { key: "subject", header: "Subject" },
          { key: "dueDate", header: "Due date" },
          { key: "status", header: "Status", render: (row) => <Badge tone={row.status === "Pending" ? "warning" : "success"}>{row.status}</Badge> },
          { key: "score", header: "Score", render: (row) => row.score ?? "-" },
          { key: "id", header: "Actions", render: () => <Button variant="secondary"><Eye size={16} /> View</Button> },
        ]} />
      )}
      <Card>
        <h2 className="font-semibold">Assignment Detail</h2>
        <p className="mt-2 text-sm text-slate-500">Upload your solution, confirm instructions, and submit before the due date.</p>
        <div className="mt-4 rounded-lg border border-dashed border-slate-300 p-8 text-center dark:border-slate-700"><FileUp className="mx-auto text-brand-600" /><p className="mt-2 text-sm">Drag and drop file upload</p></div>
        <Button className="mt-4" onClick={() => setSubmitted(true)}>Submit Assignment</Button>
        {submitted && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Submitted successfully</p>}
      </Card>
    </>
  );
}


export function QuizzesPage() {
  const questions = [
    {
      question: "What is the time complexity of Merge Sort?",
      options: ["O(n)", "O(n log n)", "O(n²)", "O(log n)"],
      correct: 1,
      explanation: "Merge Sort divides the array recursively and merges sorted halves, resulting in O(n log n) time."
    },
    {
      question: "Which data structure follows FIFO?",
      options: ["Stack", "Queue", "Tree", "Graph"],
      correct: 1,
      explanation: "A Queue follows First In, First Out (FIFO)."
    },
    {
      question: "What is a primary key in DBMS?",
      options: [
        "A key that allows duplicate values",
        "A key used only for sorting",
        "A unique identifier for each record",
        "A foreign reference"
      ],
      correct: 2,
      explanation: "A primary key uniquely identifies every record in a database table."
    }
  ];

  const [started, setStarted] = useState(false);
  const [question, setQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [review, setReview] = useState<number[]>([]);
  const [done, setDone] = useState(false);
  const [showSubmit, setShowSubmit] = useState(false);

  const current = questions[question];
  const score = questions.filter(
    (q, i) => answers[i] === q.correct
  ).length;

  const selectAnswer = (index: number) => {
    setAnswers(prev => ({ ...prev, [question]: index }));
  };

  const toggleReview = () => {
    setReview(prev =>
      prev.includes(question)
        ? prev.filter(i => i !== question)
        : [...prev, question]
    );
  };

  const submitQuiz = () => {
    setDone(true);
    setShowSubmit(false);
  };

  return (
    <>
      <PageHeader
        title="My Quizzes"
        subtitle="Attempt quizzes and track your learning performance."
      />

      {!started ? (
        <Card>
          <Badge tone="ai">Practice Quiz</Badge>
          <h2 className="mt-3 text-xl font-bold">Data Structures & DBMS</h2>
          <p className="mt-2 text-sm text-slate-500">
            Sample quiz containing 3 multiple-choice questions.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span>3 Questions</span>
            <span>5 Minutes</span>
            <span>Easy</span>
          </div>
          <Button className="mt-5" onClick={() => setStarted(true)}>
            Start Quiz
          </Button>
        </Card>
      ) : !done ? (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <div className="flex justify-between gap-3">
                <Badge tone="warning">Practice Mode</Badge>
                <span className="text-sm">
                  Question {question + 1} of {questions.length}
                </span>
              </div>

              <ProgressBar
                value={((question + 1) / questions.length) * 100}
              />

              <h2 className="mt-6 text-lg font-semibold">
                {current.question}
              </h2>

              <div className="mt-5 grid gap-3">
                {current.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => selectAnswer(index)}
                    className={`rounded-lg border p-4 text-left transition ${
                      answers[question] === index
                        ? "border-brand-600 bg-brand-50 dark:bg-slate-800"
                        : "border-slate-200 hover:border-brand-500 dark:border-slate-700"
                    }`}
                  >
                    <span className="mr-3 font-semibold">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    {option}
                  </button>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  disabled={question === 0}
                  onClick={() => setQuestion(q => q - 1)}
                >
                  Previous
                </Button>

                <Button variant="secondary" onClick={toggleReview}>
                  {review.includes(question)
                    ? "Remove Review"
                    : "Mark for Review"}
                </Button>

                {question < questions.length - 1 ? (
                  <Button onClick={() => setQuestion(q => q + 1)}>
                    Next
                  </Button>
                ) : (
                  <Button onClick={() => setShowSubmit(true)}>
                    Submit Quiz
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <h3 className="font-semibold">Question Navigator</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {questions.map((_, i) => (
                <Button
                  key={i}
                  variant={question === i ? "primary" : "secondary"}
                  onClick={() => setQuestion(i)}
                >
                  {i + 1}
                </Button>
              ))}
            </div>

            <div className="mt-5 space-y-2 text-sm text-slate-500">
              <p>Answered: {Object.keys(answers).length}</p>
              <p>Unanswered: {questions.length - Object.keys(answers).length}</p>
              <p>Marked for review: {review.length}</p>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <h2 className="text-xl font-bold">Quiz Results</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <StatMini label="Score" value={`${Math.round(score / questions.length * 100)}%`} />
            <StatMini label="Correct" value={String(score)} />
            <StatMini label="Incorrect" value={String(questions.length - score)} />
          </div>

          <div className="mt-6 space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="rounded-lg border p-4 dark:border-slate-700">
                <h3 className="font-semibold">
                  {i + 1}. {q.question}
                </h3>
                <p className="mt-2 text-sm">
                  Your answer: {answers[i] !== undefined
                    ? q.options[answers[i]]
                    : "Not answered"}
                </p>
                <p className="mt-1 text-sm text-emerald-600">
                  Correct answer: {q.options[q.correct]}
                </p>
                <p className="mt-2 text-sm text-slate-500">
                  {q.explanation}
                </p>
              </div>
            ))}
          </div>

          <Button className="mt-5" onClick={() => {
            setStarted(false);
            setDone(false);
            setQuestion(0);
            setAnswers({});
            setReview([]);
          }}>
            Back to Quizzes
          </Button>
        </Card>
      )}

      {showSubmit && (
        <Card>
          <h3 className="font-semibold">Submit this quiz?</h3>
          <p className="mt-2 text-sm text-slate-500">
            You have answered {Object.keys(answers).length} of {questions.length} questions.
          </p>
          <div className="mt-4 flex gap-2">
            <Button onClick={submitQuiz}>Confirm Submit</Button>
            <Button variant="secondary" onClick={() => setShowSubmit(false)}>
              Cancel
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md bg-slate-50 p-4 dark:bg-slate-800"><p className="text-sm text-slate-500">{label}</p><p className="text-xl font-bold">{value}</p></div>;
}

export function RecommendationsPage() {
  const sections = ["Based on Your Weak Topics", "Because You Studied React"];
  const [started, setStarted] = useState("");
  return (
    <>
      <PageHeader title="Recommended for You" subtitle="Personalized resources based on learning behavior." />
      {sections.map((section) => (
        <section key={section}>
          <h2 className="mb-4 text-lg font-semibold">{section}</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{resources.map((resource) => <Card key={`${section}-${resource.title}`}><Badge tone="ai">{resource.type}</Badge><h3 className="mt-3 font-semibold">{resource.title}</h3><p className="mt-2 text-sm text-slate-500">{resource.difficulty} | {resource.duration}</p><p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{resource.reason}</p><Button className="mt-4" variant="secondary" onClick={() => setStarted(resource.title)}>Start</Button></Card>)}</div>
        </section>
      ))}
      {started && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Started recommended resource: {started}</p>}
    </>
  );
}

export function PerformancePage() {
  return (
    <>
      <PageHeader title="Performance Analytics" subtitle="Quiz, assignment, subject, attendance and study-hour trends." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Overall Score" value="82%" detail="Good academic standing" icon={Award} />
        <StatCard title="Predicted Score" value="82%" detail="87% confidence" icon={BarChart3} />
        <StatCard title="Attendance" value="91%" detail="Stable trend" icon={CalendarCheck} />
        <StatCard title="Completion Rate" value="76%" detail="4 active courses" icon={CheckCircle2} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2"><Card><h2 className="mb-4 font-semibold">Quiz performance over time</h2><PerformanceLineChart /></Card><Card><h2 className="mb-4 font-semibold">Subject performance</h2><SubjectBarChart /></Card><Card><h2 className="mb-4 font-semibold">Study hours</h2><ActivityAreaChart /></Card><AIInsightCard title="AI Performance Prediction">Predicted Final Score: 82%. Confidence: 87%. Contributing factors include attendance, quiz performance, assignment completion and study hours.</AIInsightCard></div>
    </>
  );
}

export function AttendancePage() {
  return (
    <>
      <PageHeader title="Attendance" subtitle="Overall and subject-wise attendance dashboard." />
      <Card><div className="mb-2 flex justify-between"><h2 className="font-semibold">Overall Attendance</h2><span>91%</span></div><ProgressBar value={91} /></Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{["DBMS - 94%", "OS - 88%", "CN - 91%", "ML - 86%"].map((item) => <Card key={item}><h3 className="font-semibold">{item}</h3><ProgressBar className="mt-4" value={Number(item.match(/\d+/)?.[0] ?? 0)} /></Card>)}</div>
      <Card><h2 className="mb-4 font-semibold">Monthly attendance chart</h2><ActivityAreaChart /></Card>
    </>
  );
}

export function NotificationsPage() {
  const dispatch = useAppDispatch();
  const items = useAppSelector((state) => state.notifications.items);
  return (
    <>
      <PageHeader title="Notifications" subtitle="Review academic, AI and attendance alerts." actions={<Button onClick={() => dispatch(markAllRead())}>Mark all as read</Button>} />
      <div className="space-y-3">{items.map((item) => <Card key={item.id} className={!item.read ? "border-brand-200" : ""}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><Badge tone={item.tone}>{item.read ? "Read" : "New"}</Badge><h3 className="mt-2 font-semibold">{item.title}</h3><p className="text-sm text-slate-500">{item.description}</p></div><div className="flex gap-2"><Button variant="secondary" onClick={() => dispatch(markRead(item.id))}>Mark as read</Button><Button variant="danger" onClick={() => dispatch(deleteNotification(item.id))}><Trash2 size={16} /> Delete</Button></div></div></Card>)}</div>
    </>
  );
}

export function ProfilePage() {
  const user = useAppSelector((state) => state.auth.user);
  const [saved, setSaved] = useState(false);
  return (
    <>
      <PageHeader title="Profile" subtitle="Personal information, learning statistics and achievements." />
      <Card className="flex flex-col gap-5 sm:flex-row sm:items-center"><div className="grid h-20 w-20 place-items-center rounded-lg bg-slate-900 text-2xl font-bold text-white">{user?.name.slice(0, 1)}</div><div><h2 className="text-xl font-bold">{user?.name}</h2><p className="text-slate-500">{user?.email}</p><p className="capitalize text-slate-500">{user?.role} | {user?.department}</p></div><Button className="sm:ml-auto" onClick={() => setSaved(true)}>Update Profile</Button></Card>
      <div className="grid gap-4 md:grid-cols-4">{["Courses: 4", "XP: 2840", "Badges: 4", "Study streak: 12 days"].map((item) => <Card key={item}><p className="font-semibold">{item}</p></Card>)}</div>
      {saved && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Profile changes saved for this demo session.</p>}
    </>
  );
}

export function SettingsPage() {
  const [tab, setTab] = useState("Account");
  const [saved, setSaved] = useState("");
  return (
    <>
      <PageHeader title="Settings" subtitle="Account, appearance, notifications and security." />
      <div className="flex flex-wrap gap-2">{["Account", "Appearance", "Notifications", "Security"].map((item) => <Button key={item} variant={tab === item ? "primary" : "secondary"} onClick={() => setTab(item)}>{item}</Button>)}</div>
      <Card>
        {tab === "Appearance" ? <div className="grid gap-3 sm:grid-cols-3">{["Light", "Dark", "System"].map((item) => <Button key={item} variant="secondary" onClick={() => setSaved(`${item} appearance selected.`)}>{item}</Button>)}</div> : tab === "Notifications" ? <div className="space-y-3">{["Email notifications", "Assignment reminders", "Quiz results", "AI recommendations"].map((item) => <label key={item} className="flex items-center gap-3"><input type="checkbox" defaultChecked onChange={() => setSaved("Notification preferences updated.")} /> {item}</label>)}</div> : tab === "Security" ? <div className="grid gap-4 sm:grid-cols-2"><Input placeholder="New password" type="password" /><Button onClick={() => setSaved("Password changed for demo.")}>Change password</Button><label className="flex items-center gap-3"><input type="checkbox" onChange={() => setSaved("Two-factor authentication preference updated.")} /> Two-factor authentication</label></div> : <div className="grid gap-4 sm:grid-cols-2"><Input placeholder="Full name" defaultValue="Radhika Singhania" /><Input placeholder="Email" defaultValue="student@edugen.ai" /><Button onClick={() => setSaved("Account changes saved.")}>Save changes</Button></div>}
        {saved && <p className="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{saved}</p>}
      </Card>
    </>
  );
}

export function ResourcesPage() {
  const downloadable = useMemo(() => resources.map((item, index) => ({ id: String(index), ...item })), []);
  return (
    <>
      <PageHeader title="Resources" subtitle="Notes, PDFs, videos and practice material." />
      <DataTable data={downloadable} columns={[{ key: "title", header: "Title" }, { key: "type", header: "Type" }, { key: "difficulty", header: "Difficulty" }, { key: "duration", header: "Duration" }, { key: "id", header: "Actions", render: () => <Button variant="secondary"><Download size={16} /> Download</Button> }]} />
    </>
  );
}
