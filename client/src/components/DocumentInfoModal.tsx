import { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Calendar, 
  Hash, 
  Tag as TagIcon, 
  Clock, 
  ShieldCheck,
  Plus,
  Trash2,
  HardDrive
} from "lucide-react";
import type { Document } from "@/types";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";

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

export default function DocumentInfoModal({ document, isOpen, onClose, onUpdate }: Props) {
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      try {
        setTags(JSON.parse(document.tags || "[]"));
      } catch (e) {
        setTags([]);
      }
    }
  }, [isOpen, document.tags]);

  if (!isOpen) return null;

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
    } catch (err) {
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
    } catch (err) {
      toast.error("Failed to remove tag");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 truncate max-w-[240px]">Document Info</h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Metadata Layer</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-all"
          >
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-8">
          {/* File Identification */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Identification</h3>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Name</span>
                <span className="font-bold text-gray-900 truncate max-w-[200px]" title={document.name}>{document.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Category</span>
                <span className="bg-white border border-gray-200 px-2.5 py-0.5 rounded-lg font-bold text-[11px] text-blue-600 uppercase tracking-wider">
                  {document.category}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 font-medium">Format</span>
                <span className="font-bold text-gray-900 uppercase">.{document.name.split('.').pop()}</span>
              </div>
            </div>
          </div>

          {/* Storage Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Storage & Security</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-emerald-600 mb-1">
                  <HardDrive size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">File Size</span>
                </div>
                <p className="text-lg font-bold text-emerald-900 font-mono">
                  {formatFileSize(document.fileSize)}
                </p>
              </div>
              <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-1">
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Encryption</span>
                </div>
                <p className="text-sm font-bold text-blue-900">
                  {document.encrypted ? "Secure (AES-256)" : "Standard"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Timeline</h3>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl divide-y divide-gray-50 overflow-hidden">
              <div className="p-3 flex items-center gap-3">
                <Calendar size={16} className="text-amber-500" />
                <div className="flex-1">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Uploaded On</p>
                  <p className="text-xs font-bold text-gray-700">
                    {document.uploadedAt ? format(new Date(document.uploadedAt), "MMMM d, yyyy HH:mm") : "N/A"}
                  </p>
                </div>
              </div>
              <div className="p-3 flex items-center gap-3">
                <Clock size={16} className="text-amber-500" />
                <div className="flex-1">
                  <p className="text-[9px] text-gray-400 font-bold uppercase">Last Modified</p>
                  <p className="text-xs font-bold text-gray-700">
                    {format(new Date(document.lastModified), "MMMM d, yyyy HH:mm")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Management */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-4 bg-purple-500 rounded-full" />
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tags Management</h3>
            </div>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.length > 0 ? (
                tags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="group inline-flex items-center gap-1.5 bg-purple-50 border border-purple-100 text-purple-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-purple-100"
                  >
                    <TagIcon size={12} />
                    {tag}
                    <button 
                      onClick={() => handleRemoveTag(tag)}
                      disabled={loading}
                      className="text-purple-300 hover:text-red-500 transition-colors"
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  </span>
                ))
              ) : (
                <p className="text-xs text-gray-400 py-2">No tags assigned. Better organization starts with tags.</p>
              )}
            </div>
            <div className="relative group">
              <input 
                type="text"
                placeholder="Add organized tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !loading && handleAddTag()}
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-3 text-sm font-semibold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-gray-300"
              />
              <button 
                onClick={handleAddTag}
                disabled={loading || !newTag.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none"
              >
                <Plus size={18} strokeWidth={3} />
              </button>
            </div>
          </div>
        </div>

        <footer className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-300 transition-all"
          >
            Done
          </button>
        </footer>
      </div>
    </div>
  );
}
