import { useState } from "react";
import { Shuffle } from "lucide-react";
import { AIInsightCard } from "../../components/ai/AIComponents";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Label, Select } from "../../components/ui/Input";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { aiService } from "../../services/aiService";
import {
  quizService,
  type GeneratedQuestion,
  type QuizDifficulty,
} from "../../services/quizService";

export function AIQuizGeneratorPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState<QuizDifficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [duration, setDuration] = useState(15);

  async function generate() {
    if (files.length === 0) {
      setError("Please upload at least one study material.");
      return;
    }

    setLoading(true);
    setError("");
    setWarnings([]);
    setQuestions([]);

    try {
      const result = await quizService.generateQuiz(
        files,
        numQuestions,
        difficulty,
      );

      setQuestions(result.questions);
      setWarnings(result.warnings || []);

      if (result.questions.length === 0) {
        setError("No questions were generated. Try different material.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Quiz generation failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="AI Quiz Generator"
        subtitle="Generate MCQ assessments directly from your study materials."
      />

      <Card className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Quiz Title</Label>
            <Input
              placeholder="e.g. Data Structures - Unit 1 Assessment"
              value={quizTitle}
              onChange={(event) => setQuizTitle(event.target.value)}
            />
          </div>

          <div>
            <Label>Subject</Label>
            <Input
              placeholder="e.g. Data Structures"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            />
          </div>

          <div>
            <Label>Duration (minutes)</Label>
            <Input
              type="number"
              min="1"
              max="180"
              value={duration}
              onChange={(event) => setDuration(Number(event.target.value))}
            />
          </div>
        </div>

        <div>
          <Label>Upload study materials</Label>
          <Input
            type="file"
            accept=".pdf,.ppt,.pptx,.doc,.docx,.txt"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files || []))}
          />

          <p className="mt-2 text-xs text-slate-500">
            Maximum 10 files, 25 MB per file.
          </p>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm dark:bg-slate-800"
                >
                  <span>{file.name}</span>
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() =>
                      setFiles((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Difficulty</Label>
            <Select
              value={difficulty}
              onChange={(event) =>
                setDifficulty(event.target.value as QuizDifficulty)
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
              <option value="mixed">Mixed</option>
            </Select>
          </div>

          <div>
            <Label>Number of questions</Label>
            <Select
              value={String(numQuestions)}
              onChange={(event) => setNumQuestions(Number(event.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
              <option value="20">20</option>
              <option value="30">30</option>
              <option value="50">50</option>
            </Select>
          </div>
        </div>

        <Button onClick={generate} disabled={loading || files.length === 0}>
          {loading ? "Generating questions..." : "Generate Quiz with AI"}
        </Button>

        {loading && (
          <p className="text-sm text-slate-500">
            Extracting your material and generating questions. This may take a
            little while.
          </p>
        )}
      </Card>

      {error && (
        <Card>
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {warnings.length > 0 && (
        <Card>
          <h3 className="font-semibold">Generation warnings</h3>
          {warnings.map((warning, index) => (
            <p key={index} className="mt-2 text-sm text-amber-600">
              {warning}
            </p>
          ))}
        </Card>
      )}

      {questions.length > 0 && (
        <div className="space-y-4">
          <PageHeader
            title="Generated Questions"
            subtitle={`${questions.length} questions generated successfully. Review them before using the quiz.`}
          />

          {questions.map((question, index) => (
            <Card key={`${question.source_material_id}-${index}`}>
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">
                  Q{index + 1}. {question.question}
                </h3>

                <span className="shrink-0 rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700 dark:bg-brand-900/30 dark:text-brand-300">
                  MCQ
                </span>
              </div>

              <div className="mt-4 space-y-2">
                {question.options.map((option, optionIndex) => {
                  const correct = optionIndex === question.correct_index;

                  return (
                    <div
                      key={optionIndex}
                      className={`rounded-md border p-3 text-sm ${
                        correct
                          ? "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300"
                          : "border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      <span className="mr-2 font-semibold">
                        {String.fromCharCode(65 + optionIndex)}.
                      </span>
                      {option}
                      {correct && (
                        <span className="ml-2 font-semibold">
                          ✓ Correct answer
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 rounded-md bg-slate-50 p-3 dark:bg-slate-800">
                <p className="text-sm font-semibold">Explanation</p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {question.explanation}
                </p>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Source: {question.source_name} | Pages: {question.source_pages}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export function FlashcardsPage() {
  const cards = [
    [
      "What is deadlock?",
      "A situation where processes wait indefinitely for resources held by each other.",
    ],
    [
      "What is paging?",
      "A memory management scheme that eliminates contiguous allocation.",
    ],
    [
      "What is normalization?",
      "A process of organizing database tables to reduce redundancy.",
    ],
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
      <PageHeader
        title="Flashcards"
        subtitle={`Card ${index + 1} of ${cards.length}${difficult.length ? ` | ${difficult.length} marked difficult` : ""}`}
        actions={
          <Button onClick={shuffle}>
            <Shuffle size={18} /> Generate Flashcards with AI
          </Button>
        }
      />
      <button
        className="surface min-h-80 w-full rounded-lg p-8 text-center text-xl font-semibold"
        onClick={() => setFlipped((value) => !value)}
      >
        {flipped ? cards[index][1] : cards[index][0]}
      </button>
      <ProgressBar value={((index + 1) / cards.length) * 100} />
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            setIndex(Math.max(0, index - 1));
            setFlipped(false);
          }}
        >
          Previous
        </Button>
        <Button
          onClick={() => {
            setIndex(Math.min(cards.length - 1, index + 1));
            setFlipped(false);
          }}
        >
          Next
        </Button>
        <Button variant="secondary" onClick={shuffle}>
          Shuffle
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            setDifficult((items) =>
              items.includes(cards[index][0])
                ? items
                : [...items, cards[index][0]],
            )
          }
        >
          Mark difficult
        </Button>
      </div>
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
      <PageHeader
        title="Intelligent Study Planner"
        subtitle="Generate a calendar-style plan from exam date, hours and weak topics."
      />
      <Card className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div>
          <Label>Exam date</Label>
          <Input type="date" />
        </div>
        <div>
          <Label>Study hours</Label>
          <Input type="number" defaultValue={2} />
        </div>
        <div>
          <Label>Subjects</Label>
          <Input defaultValue="OS, DBMS, DS" />
        </div>
        <div>
          <Label>Skill level</Label>
          <Select>
            <option>Intermediate</option>
            <option>Beginner</option>
            <option>Advanced</option>
          </Select>
        </div>
        <div>
          <Label>Weak topics</Label>
          <Input defaultValue="Graphs, DP" />
        </div>
        <div className="xl:col-span-5">
          <Button onClick={generate}>
            {loading
              ? "Creating plan..."
              : plan.length
                ? "Regenerate Plan"
                : "Create Study Plan"}
          </Button>
        </div>
      </Card>
      {plan.length > 0 && (
        <Card>
          <h2 className="mb-4 text-lg font-semibold">12-Day Study Plan</h2>
          <div className="space-y-3">
            {plan.map((day, index) => (
              <div
                key={day}
                className="rounded-md border border-slate-200 p-4 dark:border-slate-800"
              >
                <p className="font-semibold">Day {index + 1}</p>
                <p className="mt-1 text-sm text-slate-500">{day}</p>
                <div className="mt-3 flex gap-2">
                  <Button variant="secondary">Mark complete</Button>
                  <Button variant="secondary">Reschedule</Button>
                  <Button variant="secondary">Edit</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
