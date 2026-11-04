import { FormEvent, useEffect, useRef, useState } from "react";
import {
  Check,
  FileText,
  LoaderCircle,
  Mic,
  Paperclip,
  Send,
  Trash2,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { Input, Select } from "../../components/ui/Input";
import { aiTutorCourses } from "../../config/aiTutorCourses";
import {
  aiTutorService,
  CourseMaterial,
  TutorConversation,
  TutorDocument,
  TutorMessage,
} from "../../services/aiTutorService";

const QUICK_PROMPTS = [
  "Explain recursion",
  "Give me a quiz",
  "Simplify this concept",
  "Give me coding practice",
];

function renderInline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-slate-100 px-1 dark:bg-slate-800">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function SafeAnswer({ text }: { text: string }) {
  const parts = text.split(/```([^\n]*)\n([\s\S]*?)```/g);
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (index % 3 === 1) return null;
        if (index % 3 === 2) {
          return (
            <pre key={index} className="overflow-x-auto rounded-md bg-slate-950 p-3 text-xs text-white">
              <code>{part}</code>
            </pre>
          );
        }
        return part ? (
          <p key={index} className="whitespace-pre-wrap">
            {renderInline(part)}
          </p>
        ) : null;
      })}
    </div>
  );
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SourceList({ sources }: { sources: TutorMessage["sources"] }) {
  if (!sources?.length) return null;
  return (
    <div className="mt-3 border-t border-slate-200 pt-3 dark:border-slate-700">
      <p className="text-xs font-semibold uppercase text-slate-500">Sources</p>
      <ul className="mt-1 space-y-1 text-xs text-slate-600 dark:text-slate-300">
        {sources.map((source, index) => (
          <li key={`${source.doc_id}-${index}`}>
            {source.filename}{source.page ? `, p.${source.page}` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AITutorPage() {
  const [courseId, setCourseId] = useState<string>(aiTutorCourses[0]?.id ?? "");
  const [conversations, setConversations] = useState<TutorConversation[]>([]);
  const [conversationId, setConversationId] = useState<number>();
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [documents, setDocuments] = useState<TutorDocument[]>([]);
  const [courseMaterials, setCourseMaterials] = useState<CourseMaterial[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [materialsError, setMaterialsError] = useState("");
  const [limit, setLimit] = useState(2);
  const [maxFileMb, setMaxFileMb] = useState(20);
  const [used, setUsed] = useState(0);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const selectedCourseId = aiTutorCourses.some((course) => course.id === courseId)
    ? courseId
    : aiTutorCourses[0]?.id ?? "";

  useEffect(() => {
    let active = true;
    aiTutorService
      .listConversations()
      .then((conversationList) => {
        if (!active) return;
        setConversations(conversationList);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    aiTutorService
      .listDocuments(selectedCourseId)
      .then((result) => {
        if (!active) return;
        setDocuments(result.private);
        setLimit(result.limit);
        setMaxFileMb(result.maxFileMb);
        setUsed(result.used);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    let active = true;
    setMaterialsLoading(true);
    setMaterialsError("");
    aiTutorService
      .listCourseMaterials(selectedCourseId)
      .then((result) => {
        if (active) setCourseMaterials(result);
      })
      .catch((requestError: Error) => {
        if (active) setMaterialsError(requestError.message);
      })
      .finally(() => {
        if (active) setMaterialsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedCourseId]);

  async function refreshDocuments() {
    const result = await aiTutorService.listDocuments(selectedCourseId);
    setDocuments(result.private);
    setLimit(result.limit);
    setMaxFileMb(result.maxFileMb);
    setUsed(result.used);
  }

  async function refreshConversations() {
    setConversations(await aiTutorService.listConversations());
  }

  async function sendQuestion(question: string, documentIds = selectedDocIds) {
    const text = question.trim();
    if (!text || loading) return;
    setError("");
    setFeedback("");
    setPrompt("");
    setLoading(true);
    setMessages((current) => [
      ...current,
      { id: `pending-${Date.now()}`, role: "student", text },
    ]);
    try {
      const result = await aiTutorService.chat({
        question: text,
        courseId: selectedCourseId,
        ...(conversationId ? { conversationId } : {}),
        ...(documentIds.length ? { docIds: documentIds } : {}),
      });
      setConversationId(result.conversationId);
      setMessages((current) => [
        ...current,
        {
          id: `answer-${Date.now()}`,
          role: "ai",
          text: result.answer,
          sources: result.sources,
          grounded: result.grounded,
        },
      ]);
      await refreshConversations();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The tutor request failed.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    await sendQuestion(prompt);
  }

  async function loadConversation(conversation: TutorConversation) {
    setError("");
    setLoading(true);
    try {
      const result = await aiTutorService.getConversation(conversation.id);
      if (!aiTutorCourses.some((course) => course.id === result.conversation.courseId)) {
        throw new Error("This conversation belongs to a course that is not available.");
      }
      setCourseId(result.conversation.courseId);
      setConversationId(result.conversation.id);
      setMessages(result.messages);
      setSelectedDocIds([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Conversation could not be loaded.");
    } finally {
      setLoading(false);
    }
  }

  async function clearConversation() {
    setError("");
    try {
      if (conversationId) {
        await aiTutorService.deleteConversation(conversationId);
        await refreshConversations();
      }
      setConversationId(undefined);
      setMessages([]);
      setSelectedDocIds([]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Conversation could not be cleared.");
    }
  }

  async function uploadPdf(file?: File) {
    if (!file) return;
    setError("");
    setUploadProgress(0);
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Only PDF files can be uploaded.");
      return;
    }
    if (file.size > maxFileMb * 1024 * 1024) {
      setError(`PDFs must be ${maxFileMb} MB or smaller.`);
      return;
    }
    if (used >= limit) {
      setError("Delete a PDF to upload another.");
      return;
    }

    setUploading(true);
    try {
      await aiTutorService.uploadPdf(file, setUploadProgress);
      setSelectedDocIds([]);
      await refreshDocuments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The PDF could not be uploaded.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function deletePdf(document: TutorDocument) {
    if (document.status !== "ready") return;
    setError("");
    try {
      await aiTutorService.deletePdf(document.id);
      setSelectedDocIds((ids) => ids.filter((id) => id !== document.docId));
      await refreshDocuments();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The PDF could not be deleted.");
    }
  }

  async function summarize(document: TutorDocument) {
    if (!document.docId) return;
    setSelectedDocIds([document.docId]);
    await sendQuestion(
      "Summarize the key ideas from this PDF using the most relevant retrieved excerpts. This may not cover the whole document.",
      [document.docId],
    );
  }

  async function copyAnswer(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopyMessage("Answer copied.");
    } catch {
      setError("Could not copy the answer to the clipboard.");
    }
  }

  function toggleDocument(docId: string) {
    setSelectedDocIds((selected) =>
      selected.includes(docId)
        ? selected.filter((item) => item !== docId)
        : [...selected, docId],
    );
  }

  const canUpload = used < limit && !uploading;

  return (
    <div className="grid min-h-[calc(100vh-120px)] gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <Card>
          <label htmlFor="tutor-course" className="mb-2 block text-sm font-semibold">Course</label>
          <Select
            id="tutor-course"
            aria-label="Select course"
            value={selectedCourseId}
            onChange={(event) => {
              setCourseId(event.target.value);
              setConversationId(undefined);
              setMessages([]);
            }}
          >
            {aiTutorCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </Select>
          <h2 className="mt-5 font-semibold">Conversation History</h2>
          <div className="mt-3 max-h-48 space-y-1 overflow-y-auto">
            {conversations.length ? conversations.map((conversation) => (
              <button
                type="button"
                key={conversation.id}
                onClick={() => void loadConversation(conversation)}
                className={`w-full rounded-md p-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 ${
                  conversation.id === conversationId ? "bg-slate-100 dark:bg-slate-800" : ""
                }`}
              >
                <span className="block truncate">{conversation.title}</span>
                <span className="text-xs text-slate-500">
                  {aiTutorCourses.find((course) => course.id === conversation.courseId)?.title ?? conversation.courseId}
                </span>
              </button>
            )) : <p className="text-sm text-slate-500">Your conversations will appear here.</p>}
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-semibold">Your PDFs ({used}/{limit})</h2>
            <Button
              type="button"
              variant="secondary"
              className="px-3"
              disabled={!canUpload}
              title={used >= limit ? "Delete a PDF to upload another" : "Upload a PDF"}
              onClick={() => fileInput.current?.click()}
            >
              <Paperclip size={16} />
              Upload
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(event) => void uploadPdf(event.target.files?.[0])}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">PDF only, up to {maxFileMb} MB each.</p>
          <p className="mt-1 text-xs text-slate-500">Summaries use relevant excerpts and may not cover the entire PDF.</p>
          {uploading && (
            <p className="mt-3 flex items-center gap-2 text-sm text-brand-700">
              <LoaderCircle size={16} className="animate-spin" />
              {uploadProgress < 100 ? `Uploading ${uploadProgress}%` : "Processing PDF..."}
            </p>
          )}
          <div className="mt-3 space-y-2">
            {documents.map((document) => (
              <div key={document.id} className="rounded-md bg-slate-50 p-2 text-sm dark:bg-slate-800">
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    aria-label={`Ask only about ${document.filename}`}
                    disabled={document.status !== "ready"}
                    checked={Boolean(document.docId && selectedDocIds.includes(document.docId))}
                    onChange={() => document.docId && toggleDocument(document.docId)}
                  />
                  <FileText size={16} className="mt-0.5 shrink-0 text-brand-600" />
                  <div className="min-w-0 flex-1">
                    <p className="break-all">{document.filename}</p>
                    <p className="text-xs text-slate-500">
                      {document.status === "processing" ? "Processing..." : formatBytes(document.sizeBytes)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-8 px-2"
                    aria-label={`Delete ${document.filename}`}
                    disabled={document.status !== "ready"}
                    onClick={() => void deletePdf(document)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </div>
                {document.status === "ready" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-1 min-h-8 w-full justify-start px-2 text-xs"
                    onClick={() => void summarize(document)}
                  >
                    Summarize this PDF
                  </Button>
                )}
              </div>
            ))}
            {!documents.length && <p className="text-sm text-slate-500">No PDFs uploaded yet.</p>}
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Course materials</h2>
          {materialsLoading ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" /> Loading course materials...
            </p>
          ) : materialsError ? (
            <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{materialsError}</p>
          ) : (
            <ul className="mt-3 space-y-2 text-sm">
            {courseMaterials.map((document) => (
              <li key={document.id} className="flex items-start gap-2 break-all">
                <FileText size={15} className="mt-0.5 shrink-0 text-slate-500" />
                <span>{document.filename}</span>
              </li>
            ))}
            {!courseMaterials.length && <li className="text-slate-500">No shared materials for this course yet.</li>}
            </ul>
          )}
        </Card>
      </aside>

      <Card className="flex min-h-[620px] min-w-0 flex-col p-0">
        <div className="border-b border-slate-200 p-4 dark:border-slate-800">
          <h1 className="text-xl font-bold">AI Tutor</h1>
          <p className="text-sm text-slate-500">Ask questions about your materials or any topic.</p>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {!messages.length && !loading && (
            <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
              Ask a question to start a conversation. Your answers can use private PDFs and shared course materials.
            </div>
          )}
          {messages.map((message, index) => {
            const responseQuestion = message.role === "ai"
              ? [...messages.slice(0, index)].reverse().find((item) => item.role === "student")?.text
              : undefined;
            return (
              <div key={message.id} className={message.role === "student" ? "ml-auto max-w-2xl rounded-lg bg-brand-600 p-4 text-sm text-white" : "max-w-3xl"}>
                {message.role === "student" ? (
                  message.text
                ) : (
                  <div className="rounded-lg border border-brand-100 bg-white p-4 dark:border-brand-900 dark:bg-slate-900">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">EduGen AI</span>
                      <Badge tone={message.grounded ? "success" : "info"}>
                        {message.grounded ? "From your materials" : "General answer"}
                      </Badge>
                    </div>
                    <SafeAnswer text={message.text} />
                    <SourceList sources={message.sources} />
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => void copyAnswer(message.text)}>Copy</Button>
                      <Button type="button" variant="secondary" disabled={loading || !responseQuestion} onClick={() => responseQuestion && void sendQuestion(responseQuestion)}>Regenerate</Button>
                      <Button type="button" variant="ghost" onClick={() => setFeedback("Thanks for your feedback.")}>Helpful</Button>
                      <Button type="button" variant="ghost" onClick={() => setFeedback("Thanks for your feedback.")}>Not helpful</Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {loading && (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <LoaderCircle size={16} className="animate-spin" /> EduGen AI is thinking...
            </p>
          )}
          {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
          {feedback && <p className="text-xs text-slate-500">{feedback}</p>}
          {copyMessage && <p className="text-xs text-slate-500">{copyMessage}</p>}
        </div>
        <div className="border-t border-slate-200 p-4 dark:border-slate-800">
          <div className="mb-3 flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((item) => (
              <Button key={item} type="button" variant="secondary" disabled={loading} onClick={() => void sendQuestion(item)}>
                {item}
              </Button>
            ))}
          </div>
          {selectedDocIds.length > 0 && (
            <p className="mb-2 flex items-center gap-1 text-xs text-brand-700">
              <Check size={14} /> Asking only about {selectedDocIds.length} selected PDF{selectedDocIds.length === 1 ? "" : "s"}
            </p>
          )}
          <form className="flex gap-2" onSubmit={(event) => void submit(event)}>
            <Button
              type="button"
              variant="secondary"
              aria-label="Attach PDF"
              disabled={!canUpload}
              title={used >= limit ? "Delete a PDF to upload another" : "Upload a PDF"}
              onClick={() => fileInput.current?.click()}
            >
              <Paperclip size={18} />
            </Button>
            <Button type="button" variant="secondary" aria-label="Voice input unavailable" title="Voice input is not available yet">
              <Mic size={18} />
            </Button>
            <Input
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask EduGen AI anything..."
              aria-label="Your question"
              disabled={loading}
            />
            <Button disabled={loading || !prompt.trim()}>
              <Send size={18} />
              <span className="hidden sm:inline">Send</span>
            </Button>
            <Button type="button" variant="ghost" onClick={() => void clearConversation()}>
              Clear
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
