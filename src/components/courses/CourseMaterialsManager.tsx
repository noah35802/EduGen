import { ChangeEvent, useEffect, useRef, useState } from "react";
import { FileText, LoaderCircle, Trash2, Upload } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Select } from "../ui/Input";
import { aiTutorCourses } from "../../config/aiTutorCourses";
import { aiTutorService, SharedMaterial } from "../../services/aiTutorService";

const ACCEPTED_EXTENSIONS = new Set([".pdf", ".docx", ".pptx", ".txt", ".md"]);
const MAX_FILE_MB = 20;

function extensionOf(filename: string) {
  return filename.slice(filename.lastIndexOf(".")).toLowerCase();
}

export function CourseMaterialsManager() {
  const [courseId, setCourseId] = useState<string>(aiTutorCourses[0].id);
  const [materials, setMaterials] = useState<SharedMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    aiTutorService
      .listMaterials(courseId)
      .then((result) => {
        if (active) setMaterials(result);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [courseId]);

  async function reload() {
    setMaterials(await aiTutorService.listMaterials(courseId));
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (!ACCEPTED_EXTENSIONS.has(extensionOf(file.name))) {
      setError("Upload a PDF, DOCX, PPTX, TXT, or MD file.");
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setError(`Files must be ${MAX_FILE_MB} MB or smaller.`);
      return;
    }

    setUploading(true);
    try {
      await aiTutorService.uploadMaterial(file, courseId);
      await reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The material could not be uploaded.");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function remove(material: SharedMaterial) {
    setError("");
    try {
      await aiTutorService.deleteMaterial(material.id);
      await reload();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The material could not be deleted.");
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Shared course materials</h2>
          <p className="text-sm text-slate-500">Documents are available to students in the selected course.</p>
        </div>
        <div className="flex gap-2">
          <Select aria-label="Course for shared materials" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
            {aiTutorCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
          </Select>
          <Button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
            {uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}
            {uploading ? "Uploading..." : "Upload"}
          </Button>
          <input
            ref={inputRef}
            className="hidden"
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.md"
            onChange={(event) => void upload(event)}
          />
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {error ? null : loading ? (
        <p className="mt-4 text-sm text-slate-500">Loading course materials...</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-200 dark:divide-slate-800">
          {materials.map((material) => (
            <li key={material.id} className="flex items-center gap-3 py-3">
              <FileText size={18} className="shrink-0 text-brand-600" />
              <span className="min-w-0 flex-1 break-all text-sm">{material.filename}</span>
              {material.canDelete && (
                <Button
                  type="button"
                  variant="danger"
                  className="min-h-9 px-3"
                  aria-label={`Delete ${material.filename}`}
                  onClick={() => void remove(material)}
                >
                  <Trash2 size={15} />
                  Delete
                </Button>
              )}
            </li>
          ))}
          {!materials.length && <li className="py-3 text-sm text-slate-500">No shared materials for this course yet.</li>}
        </ul>
      )}
    </Card>
  );
}
