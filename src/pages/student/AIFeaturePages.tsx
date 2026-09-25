import { FormEvent, useState } from "react";
import { Mic, Paperclip, Send, Shuffle, Upload } from "lucide-react";
import { AIInsightCard, AIResponse } from "../../components/ai/AIComponents";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Label, Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { aiService } from "../../services/aiService";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { clearChat, sendMessage } from "../../store/slices/chatSlice";

export function AITutorPage() {
  const dispatch = useAppDispatch();
  const { messages, status } = useAppSelector((state) => state.chat);
  const [prompt, setPrompt] = useState("");
  const suggestions = ["Explain recursion", "Give me a quiz", "Simplify this concept", "Give me coding practice"];

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!prompt.trim()) return;
    dispatch(sendMessage(prompt));
    setPrompt("");
  }

  return (
    <div className="grid min-h-[calc(100vh-120px)] gap-6 lg:grid-cols-[280px_1fr]">
      <Card className="hidden lg:block">
        <h2 className="font-semibold">Conversation History</h2>
        <div className="mt-4 space-y-2 text-sm">{["Merge Sort basics", "DBMS Normalization", "OS Deadlocks"].map((item) => <button key={item} className="w-full rounded-md p-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800">{item}</button>)}</div>
      </Card>
      <Card className="flex min-h-[620px] flex-col p-0">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800"><PageHeader title="AI Tutor" subtitle="Ask EduGen AI anything..." /></div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.map((message) => (
            <div key={message.id} className={message.role === "student" ? "ml-auto max-w-2xl rounded-lg bg-brand-600 p-4 text-sm text-white" : "max-w-3xl"}>
              {message.role === "ai" ? <AIResponse>{message.content}<pre className="mt-3 overflow-auto rounded-md bg-slate-950 p-3 text-xs text-white">function mergeSort(items) {"{ return items.length <= 1 ? items : splitAndMerge(items); }"}</pre></AIResponse> : message.content}
            </div>
          ))}
          {status === "loading" && <p className="text-sm text-slate-500">EduGen AI is thinking...</p>}
        </div>
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex flex-wrap gap-2">{suggestions.map((item) => <Button key={item} variant="secondary" onClick={() => setPrompt(item)}>{item}</Button>)}</div>
          <form className="flex gap-2" onSubmit={submit}>
            <Button type="button" variant="secondary" aria-label="Attach PDF"><Paperclip size={18} /></Button>
            <Button type="button" variant="secondary" aria-label="Voice input"><Mic size={18} /></Button>
            <Input value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Ask EduGen AI anything..." />
            <Button><Send size={18} /> Send</Button>
            <Button type="button" variant="ghost" onClick={() => dispatch(clearChat())}>Clear</Button>
          </form>
        </div>
      </Card>
    </div>
  );
}

export function AINotesPage() {
  const [processing, setProcessing] = useState(false);
  const [topics, setTopics] = useState<string[]>([]);
  const [action, setAction] = useState("");
  async function generate() {
    setProcessing(true);
    setAction("");
    setTopics(await aiService.generateSummary());
    setProcessing(false);
  }
  return (
    <>
      <PageHeader title="AI Notes Assistant" subtitle="Upload PDF, PPT or notes and generate study material." />
      <Card className="border-dashed text-center">
        <Upload className="mx-auto text-brand-600" size={34} />
        <h2 className="mt-3 font-semibold">Upload PDF, PPT or Notes</h2>
        <p className="mt-1 text-sm text-slate-500">Drag and drop files here or browse from your device.</p>
        <div className="mx-auto mt-4 max-w-md rounded-md bg-slate-50 p-3 text-left text-sm dark:bg-slate-800">
          <p><span className="font-semibold">File:</span> operating-systems-unit-3.pdf</p>
          <p><span className="font-semibold">Type:</span> PDF, 2.4 MB</p>
          <p><span className="font-semibold">Status:</span> {processing ? "Processing" : topics.length ? "Summary generated" : "Ready to analyze"}</p>
        </div>
        <Button className="mt-4" onClick={generate}>{processing ? "Analyzing..." : "Generate Summary"}</Button>
      </Card>
      {processing && <AIInsightCard title="Processing">EduGen AI is analyzing your document...</AIInsightCard>}
      {topics.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold">AI Summary</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {["Key Topics", "Key Points", "Important Definitions", "Exam Notes", "Keywords"].map((section) => <div key={section} className="rounded-md bg-slate-50 p-4 dark:bg-slate-800"><h3 className="font-semibold">{section}</h3><ul className="mt-2 list-disc pl-5 text-sm text-slate-600 dark:text-slate-300">{topics.map((topic) => <li key={`${section}-${topic}`}>{topic}</li>)}</ul></div>)}
          </div>
          <div className="mt-5 flex flex-wrap gap-2"><Button onClick={() => setAction("Summary downloaded for demo.")}>Download Summary</Button><Button variant="secondary" onClick={() => setAction("Quiz generated from this document.")}>Generate Quiz</Button><Button variant="secondary" onClick={() => setAction("Flashcards generated from this document.")}>Generate Flashcards</Button><Button variant="secondary" onClick={() => setAction("Document context added to AI Tutor.")}>Ask AI About This Document</Button></div>
          {action && <p className="mt-3 rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{action}</p>}
        </Card>
      )}
    </>
  );
}

export function AIQuizGeneratorPage() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  async function generate() {
    setLoading(true);
    setSaved(false);
    setQuestions(await aiService.generateQuiz());
    setLoading(false);
  }
  return (
    <>
      <PageHeader title="AI Quiz Generator" subtitle="Generate editable assessment questions from notes or courses." />
      <Card className="grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2"><Label>Upload notes/PDF</Label><Input type="file" /></div>
        <div><Label>Question type</Label><Select><option>MCQ</option><option>True/False</option><option>Fill in the blank</option><option>Coding</option></Select></div>
        <div><Label>Difficulty</Label><Select><option>Medium</option><option>Easy</option><option>Hard</option></Select></div>
        <div><Label>Questions</Label><Select><option>5</option><option>10</option><option>20</option><option>30</option></Select></div>
        <div className="lg:col-span-5"><Button onClick={generate}>{loading ? "Generating..." : "Generate Quiz with AI"}</Button></div>
      </Card>
      <div className="grid gap-4">{questions.map((question, index) => <Card key={`${question}-${index}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><h3 className="font-semibold">Q{index + 1}. {question}</h3><div className="flex gap-2"><Button variant="secondary" onClick={() => setQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? `${item} (edited)` : item))}>Edit</Button><Button variant="secondary" onClick={() => setQuestions((items) => items.map((item, itemIndex) => itemIndex === index ? `Regenerated: ${item}` : item))}>Regenerate</Button><Button variant="danger" onClick={() => setQuestions((items) => items.filter((_, itemIndex) => itemIndex !== index))}>Delete</Button></div></div></Card>)}</div>
      {questions.length > 0 && <Button onClick={() => setSaved(true)}>Save Quiz</Button>}
      {saved && <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">Quiz saved to the assessment library.</p>}
    </>
  );
}

export function FlashcardsPage() {
  const cards = [
    ["What is deadlock?", "A situation where processes wait indefinitely for resources held by each other."],
    ["What is paging?", "A memory management scheme that eliminates contiguous allocation."],
    ["What is normalization?", "A process of organizing database tables to reduce redundancy."],
  ];
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [difficult, setDifficult] = useState<string[]>([]);
  const shuffle = () => {
    setIndex((value) => (value + 2) % cards.length);
    setFlipped(false);
  };
  return (
    <>
      <PageHeader title="Flashcards" subtitle={`Card ${index + 1} of ${cards.length}${difficult.length ? ` | ${difficult.length} marked difficult` : ""}`} actions={<Button onClick={shuffle}><Shuffle size={18} /> Generate Flashcards with AI</Button>} />
      <button className="surface min-h-80 w-full rounded-lg p-8 text-center text-xl font-semibold" onClick={() => setFlipped((value) => !value)}>
        {flipped ? cards[index][1] : cards[index][0]}
      </button>
      <ProgressBar value={((index + 1) / cards.length) * 100} />
      <div className="flex flex-wrap gap-2"><Button variant="secondary" onClick={() => { setIndex(Math.max(0, index - 1)); setFlipped(false); }}>Previous</Button><Button onClick={() => { setIndex(Math.min(cards.length - 1, index + 1)); setFlipped(false); }}>Next</Button><Button variant="secondary" onClick={shuffle}>Shuffle</Button><Button variant="secondary" onClick={() => setDifficult((items) => items.includes(cards[index][0]) ? items : [...items, cards[index][0]])}>Mark difficult</Button></div>
    </>
  );
}

export function StudyPlannerPage() {
  const [plan, setPlan] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  async function generate() {
    setLoading(true);
    setPlan(await aiService.generateStudyPlan());
    setLoading(false);
  }
  return (
    <>
      <PageHeader title="Intelligent Study Planner" subtitle="Generate a calendar-style plan from exam date, hours and weak topics." />
      <Card className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div><Label>Exam date</Label><Input type="date" /></div>
        <div><Label>Study hours</Label><Input type="number" defaultValue={2} /></div>
        <div><Label>Subjects</Label><Input defaultValue="OS, DBMS, DS" /></div>
        <div><Label>Skill level</Label><Select><option>Intermediate</option><option>Beginner</option><option>Advanced</option></Select></div>
        <div><Label>Weak topics</Label><Input defaultValue="Graphs, DP" /></div>
        <div className="xl:col-span-5"><Button onClick={generate}>{loading ? "Creating plan..." : plan.length ? "Regenerate Plan" : "Create Study Plan"}</Button></div>
      </Card>
      {plan.length > 0 && <Card><h2 className="mb-4 text-lg font-semibold">12-Day Study Plan</h2><div className="space-y-3">{plan.map((day, index) => <div key={day} className="rounded-md border border-slate-200 p-4 dark:border-slate-800"><p className="font-semibold">Day {index + 1}</p><p className="mt-1 text-sm text-slate-500">{day}</p><div className="mt-3 flex gap-2"><Button variant="secondary">Mark complete</Button><Button variant="secondary">Reschedule</Button><Button variant="secondary">Edit</Button></div></div>)}</div></Card>}
    </>
  );
}
