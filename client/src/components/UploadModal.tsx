import { useState } from "react";
import { Upload, X, FolderOpen, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onClose: () => void;
  onUploadComplete: () => void;
}

const API_BASE = "/api";

const CATEGORIES = [
  "Career",
  "Education",
  "Finance",
  "Health",
  "Housing",
  "Legal",
  "Personal",
  "Projects",
  "Transportation",
  "Travel",
];

export default function UploadModal({ onClose, onUploadComplete }: Props) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("Personal");
  const [uploading, setUploading] = useState(false);
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

    for (const file of selectedFiles) {
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("category", category);

        const response = await fetch(`${API_BASE}/upload`, {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          success.push(file.name);
        } else {
          failed.push(file.name);
        }
      } catch (error) {
        console.error("Upload error:", error);
        failed.push(file.name);
      }
    }

    setUploadStatus({ success, failed });
    setUploading(false);

    if (success.length > 0) {
      // Trigger rescan
      await fetch(`${API_BASE}/scan`, { method: "POST" });
      setTimeout(() => {
        onUploadComplete();
        if (failed.length === 0) {
          onClose();
        }
      }, 1500);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[1000] p-8" 
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Upload size={20} />
            <h2 className="text-lg font-semibold">
              Upload Documents
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-lg text-gray-500 transition-colors flex items-center justify-center hover:bg-gray-100 hover:text-gray-900" 
            title="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="overflow-y-auto p-6">
          {/* Category Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 mb-6">
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
              <FolderOpen size={48} className="text-blue-600 opacity-50" />
              <div>
                <p className="font-medium mb-1">
                  Click to browse files
                </p>
                <p className="text-xs text-gray-500">
                  Supports PDF, Word, Excel, PowerPoint, Images, and Text files
                </p>
              </div>
            </label>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium mb-3">
                Selected Files ({selectedFiles.length})
              </p>
              <div className="max-h-[200px] overflow-y-auto border border-gray-200 rounded-lg p-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-2 rounded-md mb-1 last:mb-0 ${
                      uploadStatus.success.includes(file.name)
                          ? "bg-green-50"
                          : uploadStatus.failed.includes(file.name)
                            ? "bg-red-50"
                            : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {uploadStatus.success.includes(file.name) && (
                        <CheckCircle size={16} className="text-green-500" />
                      )}
                      {uploadStatus.failed.includes(file.name) && (
                        <AlertCircle size={16} className="text-red-500" />
                      )}
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    {!uploading && !uploadStatus.success.includes(file.name) && (
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 rounded-md text-gray-500 transition-colors cursor-pointer flex items-center justify-center hover:bg-gray-100 hover:text-blue-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Status */}
          {uploadStatus.success.length > 0 && (
            <div className="p-3 bg-green-50 border border-green-500 rounded-lg mb-4">
              <p className="text-sm text-green-700">
                ✅ Successfully uploaded {uploadStatus.success.length} file(s)
              </p>
            </div>
          )}

          {uploadStatus.failed.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-500 rounded-lg mb-4">
              <p className="text-sm text-red-700">
                ❌ Failed to upload {uploadStatus.failed.length} file(s)
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className={`w-full p-3 text-sm flex items-center justify-center rounded-lg font-medium transition-all duration-200 ${
              selectedFiles.length === 0 || uploading 
                ? "bg-gray-900 text-white opacity-50 cursor-not-allowed" 
                : "bg-gray-900 text-white hover:opacity-90"
            }`}
          >
            {uploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} className="mr-2" />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
