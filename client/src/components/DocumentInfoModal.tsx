import { useState, useEffect } from "react";
import {
  X,
  FileText,
  Calendar,
  Tag as TagIcon,
  Clock,
  ShieldCheck,
  Plus,
  HardDrive,
} from "lucide-react";
import type { Document } from "@/types";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

interface Props {
  document: Document;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: () => void;
}

const API_BASE = "/api";

const formatFileSize = (bytes?: number) => {
  if (bytes === undefined || bytes === null) return "N/A";
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export default function DocumentInfoModal({
  document,
  isOpen,
  onClose,
  onUpdate,
}: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        setTags(JSON.parse(document.tags || "[]"));
      } catch {
        setTags([]);
      }
    }
  }, [isOpen, document.tags]);

  const handleAddTag = async () => {
    if (!newTag.trim() || tags.includes(newTag.trim())) return;
    const updatedTags = [...tags, newTag.trim()];

    try {
      setLoading(true);
      await axios.put(`${API_BASE}/documents/${document.id}/tags`, {
        tags: updatedTags,
      });
      setTags(updatedTags);
      setNewTag("");
      toast.success("Tag added");
      onUpdate?.();
    } catch {
      toast.error("Failed to add tag");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedTags = tags.filter((t) => t !== tagToRemove);
    try {
      setLoading(true);
      await axios.put(`${API_BASE}/documents/${document.id}/tags`, {
        tags: updatedTags,
      });
      setTags(updatedTags);
      toast.success("Tag removed");
      onUpdate?.();
    } catch {
      toast.error("Failed to remove tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md gap-0 p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <FileText size={20} />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold leading-none">
                {document.name}
              </DialogTitle>
              <DialogDescription className="mt-1 text-xs uppercase tracking-wider font-semibold">
                Metadata Layer
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 pt-2 space-y-6">
          {/* File Identification */}
          <div>
            <h3 className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
              Identification
            </h3>
            <div className="bg-muted/40 rounded-lg p-3 space-y-2 text-sm border">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Name</span>
                <span
                  className="font-semibold truncate max-w-[200px]"
                  title={document.name}
                >
                  {document.name}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">
                  Category
                </span>
                <Badge
                  variant="secondary"
                  className="text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                >
                  {document.category}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">
                  Format
                </span>
                <span className="font-semibold uppercase">
                  .{document.name.split(".").pop()}
                </span>
              </div>
            </div>
          </div>

          {/* Storage Details */}
          <div>
            <h3 className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              Storage & Security
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
                  <HardDrive size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    File Size
                  </span>
                </div>
                <p className="text-lg font-bold text-emerald-900 dark:text-emerald-300 font-mono">
                  {formatFileSize(document.fileSize)}
                </p>
              </div>
              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Encryption
                  </span>
                </div>
                <p className="text-sm font-bold text-blue-900 dark:text-blue-300">
                  {document.encrypted ? "Secure (AES-256)" : "Standard"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <h3 className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
              Timeline
            </h3>
            <div className="rounded-xl border divide-y overflow-hidden">
              <div className="p-3 flex items-center gap-3 bg-card">
                <Calendar size={16} className="text-amber-500" />
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">
                    Uploaded On
                  </p>
                  <p className="text-xs font-bold">
                    {document.uploadedAt
                      ? format(
                          new Date(document.uploadedAt),
                          "MMMM d, yyyy HH:mm",
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>
              <div className="p-3 flex items-center gap-3 bg-card">
                <Clock size={16} className="text-amber-500" />
                <div className="flex-1">
                  <p className="text-[9px] text-muted-foreground font-bold uppercase">
                    Last Modified
                  </p>
                  <p className="text-xs font-bold">
                    {format(
                      new Date(document.lastModified),
                      "MMMM d, yyyy HH:mm",
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Management */}
          <div>
            <h3 className="mb-3 text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-4 bg-purple-500 rounded-full" />
              Tags Management
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.length > 0 ? (
                tags.map((tag, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="gap-1 bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800"
                  >
                    <TagIcon size={10} />
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="ml-1 text-purple-400 hover:text-red-500 transition-colors rounded-full p-0.5 hover:bg-purple-200/50"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  No tags assigned.
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add new tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !loading && handleAddTag()
                }
                disabled={loading}
                className="h-9"
              />
              <Button
                size="sm"
                onClick={handleAddTag}
                disabled={loading || !newTag.trim()}
                className="h-9 w-9 p-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus size={16} />
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter className="p-4 border-t bg-muted/40">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full sm:w-auto"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
