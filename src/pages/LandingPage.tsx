import { Link } from "react-router-dom";
import { ArrowRight, BarChart3, Brain, CheckCircle2, FileText, MessageCircle, Sparkles, Target, Zap } from "lucide-react";
import { PerformanceLineChart } from "../components/charts/Charts";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";

const features = [
  ["AI Tutor", MessageCircle],
  ["PDF Summarizer", FileText],
  ["AI Quiz Generator", Brain],
  ["Personalized Study Planner", Target],
  ["Smart Recommendations", Sparkles],
  ["Performance Prediction", BarChart3],
  ["Weak Topic Detection", Zap],
  ["AI Flashcards", CheckCircle2],
] as const;

export function LandingPage() {
  return (
    <div className="bg-white text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3 font-bold">
            <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-600 text-white">E</span>
            EduGen AI
          </Link>
          <div className="flex gap-2">
            <Link to="/login"><Button variant="secondary">Login</Button></Link>
            <Link to="/register"><Button>Get Started</Button></Link>
          </div>
        </nav>
      </header>
      <main>
        <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_0.92fr]">
            <div className="max-w-3xl">
              <p className="mb-4 text-sm font-semibold uppercase text-brand-600">Personalized learning powered by Artificial Intelligence</p>
              <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">Personalized Learning Powered by AI</h1>
              <p className="mt-5 max-w-2xl text-lg text-slate-600 dark:text-slate-300">
                EduGen AI combines intelligent recommendations, AI tutoring, automated assessments and performance analytics to create a personalized learning experience.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/login"><Button>Get Started <ArrowRight size={18} /></Button></Link>
                <a href="#features"><Button variant="secondary">Explore Features</Button></a>
              </div>
            </div>
            <div className="surface rounded-lg p-4 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Student Dashboard</p>
                  <h2 className="font-semibold">Radhika's AI learning plan</h2>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">Live demo</span>
              </div>
              <PerformanceLineChart />
            </div>
          </div>
        </section>
        <section id="features" className="mx-auto max-w-7xl px-4 py-16">
          <h2 className="text-2xl font-bold">AI-powered learning workflows</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(([feature, Icon]) => (
              <Card key={feature} className="min-h-32">
                <Icon className="text-brand-600" />
                <h3 className="mt-4 font-semibold">{feature}</h3>
              </Card>
            ))}
          </div>
        </section>
        <section className="bg-slate-50 py-16 dark:bg-slate-900">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold">Learn, practice, analyze, improve</h2>
              <div className="mt-6 grid gap-3">
                {["Learn", "Practice", "Analyze", "Improve"].map((step, index) => (
                  <div key={step} className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
                    <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-50 font-bold text-brand-700">{index + 1}</span>
                    <span className="font-semibold">{step}</span>
                  </div>
                ))}
              </div>
            </div>
            <Card>
              <p className="text-sm font-semibold uppercase text-brand-600">Your personal AI learning assistant</p>
              <h2 className="mt-3 text-2xl font-bold">Analytics that lead to action</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Weak topics, predicted performance, study plans and recommendations are surfaced together so students know what to do next.</p>
              <PerformanceLineChart />
            </Card>
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200 py-8 text-sm dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-wrap gap-4 px-4 text-slate-500">
          {["About", "Features", "Contact", "Documentation", "GitHub", "Privacy", "Terms"].map((item) => <a key={item} href="#features">{item}</a>)}
        </div>
      </footer>
    </div>
  );
}
