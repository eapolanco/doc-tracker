import { useState, useRef, useEffect } from "react";
import { File, Folder, MoreVertical, ExternalLink, Eye, Trash2, Edit2, Download } from "lucide-react";
import type { Document } from "@/types";
import { format } from "date-fns";

interface Props {
  documents: Document[];
  onPreview: (doc: Document) => void;
}

const API_BASE = "http://localhost:3001/api";

export default function DocumentGrid({ documents, onPreview }: Props) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDownload = (e: React.MouseEvent, doc: Document) => {
    e.stopPropagation(); // explicit stop
    const link = document.createElement("a");
    link.href = `${API_BASE}/documents/${doc.id}/view`;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveMenu(null);
  };

  const handleDelete = (doc: Document) => {
    if (confirm(`Are you sure you want to delete ${doc.name}?`)) {
      console.log("Deleting", doc.id);
    }
    setActiveMenu(null);
  };

  return (
    <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
      {documents.map((doc) => (
        <div 
          key={doc.id} 
          className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-4 cursor-pointer hover:shadow-lg hover:border-blue-500/30 transition-all duration-200 relative"
          style={{ zIndex: activeMenu === doc.id ? 999 : 1 }}
          onClick={() => {
            console.log("Card clicked:", doc.name);
            onPreview(doc);
          }}
        >
          <div className="flex justify-between items-start mb-auto relative">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-blue-600 cursor-pointer">
              <File size={20} />
            </div>
            <div className="flex gap-1">
              <button
                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onPreview(doc);
                }}
                title="Preview"
              >
                <Eye size={16} />
              </button>
              <button
                className={`p-1.5 rounded-md transition-colors ${
                  activeMenu === doc.id 
                    ? "bg-gray-100 text-gray-900" 
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveMenu(activeMenu === doc.id ? null : doc.id);
                }}
              >
                <MoreVertical size={16} />
              </button>

              {activeMenu === doc.id && (
                <div
                  ref={menuRef}
                  className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl min-w-[160px] z-[1000] flex flex-col p-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={(e) => {
                       e.stopPropagation();
                       onPreview(doc);
                       setActiveMenu(null);
                    }}
                  >
                    <Eye size={14} /> Preview
                  </div>
                  <div 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md cursor-pointer hover:bg-gray-100"
                    onClick={(e) => handleDownload(e, doc)}
                  >
                    <Download size={14} /> Download
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-900 rounded-md opacity-50 cursor-not-allowed">
                    <Edit2 size={14} /> Rename
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div 
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 rounded-md cursor-pointer hover:bg-red-50"
                    onClick={() => handleDelete(doc)}
                  >
                    <Trash2 size={14} /> Delete
                  </div>
                </div>
              )}
            </div>
          </div>

          <div
            onClick={() => onPreview(doc)}
            className="cursor-pointer flex-1 flex flex-col gap-4"
          >
            <div className="text-base font-semibold text-gray-900 truncate" title={doc.name}>
              {doc.name}
            </div>

            <div className="flex flex-col gap-2 text-xs text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 w-fit">
                {doc.category}
              </span>
              <span className="mt-2">
                Modified {format(new Date(doc.lastModified), "MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <ExternalLink size={12} />
                {doc.cloudSource}
              </span>
            </div>
          </div>
        </div>
      ))}

      {documents.length === 0 && (
        <div className="col-span-full text-center py-16 text-gray-500">
          <Folder size={48} className="mx-auto mb-4 opacity-20" />
          <p>No documents found. Click Sync to scan your directory.</p>
        </div>
      )}
    </div>
  );
}
