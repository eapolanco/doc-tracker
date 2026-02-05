import { useState, useEffect, useRef } from "react";
import {
  FileText,
  Download,
  X,
  ExternalLink,
  Tag as TagIcon,
  Calendar,
  Hash,
  Info,
  Clock,
  Plus,
  ShieldCheck,
} from "lucide-react";
import * as docx from "docx-preview";
import * as XLSX from "xlsx";
import type { Document } from "@/types";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  document: Document;
  onClose: () => void;
}

const API_BASE = "/api";

type SheetCell = string | number | boolean | null;
type SheetRow = SheetCell[];
type SheetData = SheetRow[];

const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return "N/A";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function Visualizer({ document, onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<string | SheetData | null>(null);
  const [type, setType] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showMetadata, setShowMetadata] = useState(false);
  const docxRef = useRef<HTMLDivElement>(null);

  const fileUrl = `${API_BASE}/documents/${document.id}/view`;

  useEffect(() => {
    try {
      setTags(JSON.parse(document.tags || "[]"));
    } catch {
      setTags([]);
    }

    const ext = document.name.split(".").pop()?.toLowerCase();
    setType(ext || "");

    const loadContent = async () => {
      try {
        setLoading(true);
        setError(null);
        setContent(null);

        if (ext === "txt" || ext === "md" || ext === "json") {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("Failed to load file");
          const text = await res.text();
          setContent(text);
        } else if (ext === "docx") {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("Failed to load file");
          const blob = await res.blob();
          setTimeout(async () => {
            if (docxRef.current) {
              const options = {
                className: "docx",
                inWrapper: false,
                ignoreWidth: false,
                ignoreHeight: false,
                breakPages: true,
                useBase64URL: false,
                experimental: false,
              };
              try {
                // Clear previous content
                docxRef.current.innerHTML = "";
                await docx.renderAsync(
                  blob,
                  docxRef.current,
                  undefined,
                  options,
                );
              } catch (e) {
                console.error("DOCX Render error:", e);
                setError("Failed to render DOCX file.");
              }
            }
          }, 100);
        } else if (ext === "xlsx" || ext === "xls") {
          const res = await fetch(fileUrl);
          if (!res.ok) throw new Error("Failed to load file");
          const ab = await res.arrayBuffer();
          const wb = XLSX.read(ab);
          const firstSheetName = wb.SheetNames[0];
          const worksheet = wb.Sheets[firstSheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
          }) as SheetData;
          setContent(data);
        }
        setLoading(false);
      } catch (err) {
        console.error("Visualizer Error:", err);
        setError("Failed to render document preview.");
        setLoading(false);
      }
    };

    loadContent();
  }, [document.id, document.name, fileUrl, document.tags]);

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    const updatedTags = [...tags, newTag.trim()];
    try {
      await axios.put(`${API_BASE}/documents/${document.id}/tags`, {
        tags: updatedTags,
      });
      setTags(updatedTags);
      setNewTag("");
      toast.success("Tag added");
    } catch {
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    try {
      await axios.put(`${API_BASE}/documents/${document.id}/tags`, {
        tags: updatedTags,
      });
      setTags(updatedTags);
      toast.success("Tag removed");
    } catch {
      toast.error("Failed to remove tag");
    }
  };

  const renderContent = () => {
    switch (type) {
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "webp":
        return (
          <img
            src={fileUrl}
            alt={document.name}
            className="w-full rounded-lg shadow-sm"
          />
        );
      case "pdf":
        return (
          <div className="w-full h-[calc(100vh-200px)] bg-background rounded-lg">
            <object
              data={fileUrl}
              type="application/pdf"
              className="w-full h-full rounded-lg"
              title={document.name}
            >
              <embed
                src={fileUrl}
                type="application/pdf"
                className="w-full h-full rounded-lg"
              />
              <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                <FileText size={48} className="text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Your browser cannot display PDFs inline.
                </p>
                <Button asChild>
                  <a href={fileUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} className="mr-2" />
                    Open PDF in New Tab
                  </a>
                </Button>
              </div>
            </object>
          </div>
        );
      case "txt":
      case "md":
      case "json":
        return (
          <pre className="p-4 whitespace-pre-wrap bg-background border rounded-lg font-mono text-sm leading-relaxed overflow-x-auto">
            {content as string}
          </pre>
        );
      case "docx":
        return (
          <div
            ref={docxRef}
            className="docx-container bg-white p-4 rounded-lg border text-xs overflow-x-auto"
          />
        );
      case "xlsx":
      case "xls":
      case "csv":
        return (
          <div className="overflow-x-auto bg-background rounded-lg border">
            <table className="w-full border-collapse text-sm">
              <tbody>
                {Array.isArray(content) &&
                  content.map((row: SheetRow, i: number) => (
                    <tr key={i}>
                      {Array.isArray(row) &&
                        row.map((cell: SheetCell, j: number) => (
                          <td key={j} className="border p-2 whitespace-nowrap">
                            {cell}
                          </td>
                        ))}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center text-muted-foreground mb-6">
              <FileText size={40} />
            </div>
            <p className="text-foreground font-semibold text-lg mb-2">
              Preview not available
            </p>
            <p className="text-muted-foreground mb-8 max-w-[280px]">
              We couldn't generate a preview for <b>.{type}</b> files. You can
              still download it below.
            </p>
            <Button asChild size="lg">
              <a href={fileUrl} download>
                <Download size={18} className="mr-2" /> Download Document
              </a>
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full flex-col dark:bg-slate-900">
      <header className="px-6 py-4 border-b flex justify-between items-center bg-background z-20 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0 dark:bg-blue-900/20 dark:text-blue-400">
            <FileText size={20} strokeWidth={2.5} />
          </div>
          <div className="min-w-0">
            <h2
              className="text-[15px] font-bold truncate"
              title={document.name}
            >
              {document.name}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium">
              <Badge variant="secondary" className="uppercase tracking-wider">
                {document.category}
              </Badge>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="capitalize">
                {document.cloudSource || "local"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showMetadata ? "default" : "ghost"}
            size="icon"
            onClick={() => setShowMetadata(!showMetadata)}
            title={showMetadata ? "Hide Info" : "Show Info"}
          >
            <Info size={18} />
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              title="Open in new tab"
            >
              <ExternalLink size={18} />
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="hover:text-red-500 hover:bg-red-50"
            title="Close Preview"
          >
            <X size={20} />
          </Button>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Main Content Area */}
        <ScrollArea className="flex-1 bg-muted/20">
          <div className="p-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[50vh]">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground text-sm font-medium">
                  Loading content...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center p-4">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4 dark:bg-red-900/20">
                  <Info size={32} />
                </div>
                <p className="font-bold text-lg mb-2">Error Loading Preview</p>
                <p className="text-muted-foreground mb-8 max-w-[300px]">
                  {error}
                </p>
                <Button asChild variant="default">
                  <a href={fileUrl} download>
                    <Download size={18} className="mr-2" /> Download File
                  </a>
                </Button>
              </div>
            ) : (
              <div className="h-full max-w-5xl mx-auto">{renderContent()}</div>
            )}
          </div>
        </ScrollArea>

        {/* Metadata Sidebar (Toggleable) */}
        {showMetadata && (
          <div className="w-80 border-l bg-background p-6 flex flex-col gap-8 shrink-0 animate-in slide-in-from-right duration-300">
            {/* File Info Section */}
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <Info size={14} /> File Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Hash className="text-muted-foreground mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Size
                    </p>
                    <p className="text-sm font-bold font-mono">
                      {formatFileSize(document.fileSize)}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Calendar
                    className="text-muted-foreground mt-0.5"
                    size={16}
                  />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Uploaded At
                    </p>
                    <p className="text-sm font-bold">
                      {document.uploadedAt
                        ? format(
                            new Date(document.uploadedAt),
                            "MMM d, yyyy HH:mm",
                          )
                        : "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="text-muted-foreground mt-0.5" size={16} />
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                      Last Modified
                    </p>
                    <p className="text-sm font-bold">
                      {format(
                        new Date(document.lastModified),
                        "MMM d, yyyy HH:mm",
                      )}
                    </p>
                  </div>
                </div>

                {document.encrypted && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-3 dark:bg-emerald-950/20 dark:border-emerald-900/30">
                    <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                      <ShieldCheck size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                        Encrypted
                      </p>
                      <p className="text-[10px] text-emerald-700 font-medium dark:text-emerald-500">
                        Protected Metadata Layer
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <h3 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                <TagIcon size={14} /> Management Tags
              </h3>
              <div className="bg-muted/30 rounded-2xl p-4 border">
                <div className="flex flex-wrap gap-2 mb-4">
                  {tags.length > 0 ? (
                    tags.map((tag, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="group gap-1.5 pr-1.5"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                        >
                          <X size={12} />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground font-medium italic">
                      No tags assigned yet.
                    </p>
                  )}
                </div>
                <div className="relative flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add new tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                    className="h-9 text-xs font-bold"
                  />
                  <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleAddTag}
                  >
                    <Plus size={14} strokeWidth={3} />
                  </Button>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-6 border-t">
              <div className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  onClick={() => {
                    const link = window.document.createElement("a");
                    link.href = fileUrl;
                    link.download = document.name;
                    link.click();
                  }}
                >
                  <Download size={14} className="mr-2" /> Download File
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
