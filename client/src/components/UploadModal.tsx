import { useState } from "react";
import { Upload, X, FolderOpen, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onUploadComplete: () => void;
  onProgressUpdate?: (
    progress: { total: number; current: number; fileName: string } | null,
  ) => void;
  defaultCategory?: string;
}

const API_BASE = "/api";

export default function UploadModal({
  onClose,
  onUploadComplete,
  onProgressUpdate,
  defaultCategory,
}: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category] = useState(defaultCategory);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: string[];
    failed: string[];
  }>({ success: [], failed: [] });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadStatus({ success: [], failed: [] });
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const success: string[] = [];
    const failed: string[] = [];

    if (onProgressUpdate) {
      onProgressUpdate({
        total: selectedFiles.length,
        current: 0,
        fileName: "Uploading all files...",
      });
    }

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => formData.append("files", file));
      formData.append("category", category ?? "");

      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.results) {
        data.results.forEach((res: { status: string; name: string }) => {
          if (res.status === "success") {
            success.push(res.name);
          } else {
            failed.push(res.name);
          }
        });
      } else {
        selectedFiles.forEach((file) => failed.push(file.name));
      }
    } catch (error) {
      console.error("Upload error:", error);
      selectedFiles.forEach((file) => failed.push(file.name));
    }

    setUploadStatus({ success, failed });
    setUploading(false);

    if (success.length > 0) {
      await fetch(`${API_BASE}/scan`, { method: "POST" });
      setTimeout(() => {
        onUploadComplete();
        if (onProgressUpdate) onProgressUpdate(null);
        if (failed.length === 0) {
          onClose(); // Close parent
        }
      }, 1500);
    } else {
      if (onProgressUpdate) onProgressUpdate(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Upload Documents
          </DialogTitle>
          <DialogDescription>
            To:{" "}
            <span className="text-blue-600 font-medium">
              {category || "Root"}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragOver
                ? "border-blue-500 bg-blue-50/50 scale-[1.02]"
                : "border-muted-foreground/25 bg-muted/50 hover:border-blue-400 hover:bg-muted/80"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              if (e.dataTransfer.files) {
                setSelectedFiles((prev) => [
                  ...prev,
                  ...Array.from(e.dataTransfer.files),
                ]);
                setUploadStatus({ success: [], failed: [] });
              }
            }}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.pptx"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <FolderOpen
                size={48}
                className={`transition-colors ${
                  dragOver ? "text-blue-500" : "text-muted-foreground/50"
                }`}
              />
              <div>
                <p className="font-medium mb-1">
                  {dragOver
                    ? "Drop files here"
                    : "Click to browse or drag files"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Supports PDF, Word, Excel, PowerPoint, Images, and Text files
                </p>
              </div>
            </label>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Selected Files ({selectedFiles.length})
              </p>
              <ScrollArea className="h-[200px] rounded-md border p-4">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded-md mb-2 last:mb-0 ${
                      uploadStatus.success.includes(file.name)
                        ? "bg-green-50 dark:bg-green-900/20"
                        : uploadStatus.failed.includes(file.name)
                          ? "bg-red-50 dark:bg-red-900/20"
                          : "bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {uploadStatus.success.includes(file.name) && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                      {uploadStatus.failed.includes(file.name) && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                      <span className="text-sm truncate max-w-[200px]">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    {!uploading &&
                      !uploadStatus.success.includes(file.name) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <X size={14} />
                        </Button>
                      )}
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}

          {uploadStatus.failed.length > 0 && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">
                ❌ Failed to upload {uploadStatus.failed.length} file(s)
              </p>
            </div>
          )}
        </div>

        <Button
          variant="secondary"
          onClick={handleUpload}
          disabled={selectedFiles.length === 0 || uploading}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload{" "}
              {selectedFiles.length > 0
                ? `${selectedFiles.length} file(s)`
                : ""}
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
