import { useState } from "react";
import { Upload, X, FolderOpen, CheckCircle, AlertCircle } from "lucide-react";

interface Props {
  onClose: () => void;
  onUploadComplete: () => void;
}

const API_BASE = "http://localhost:3001/api";

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
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content upload-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Upload size={20} />
            <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
              Upload Documents
            </h2>
          </div>
          <button onClick={onClose} className="btn-icon" title="Close">
            <X size={18} />
          </button>
        </header>

        <div className="modal-body" style={{ padding: "1.5rem" }}>
          {/* Category Selection */}
          <div style={{ marginBottom: "1.5rem" }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                marginBottom: "0.5rem",
              }}
            >
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                border: "1px solid var(--border)",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* File Upload Area */}
          <div
            style={{
              border: "2px dashed var(--border)",
              borderRadius: "0.75rem",
              padding: "2rem",
              textAlign: "center",
              backgroundColor: "var(--background)",
              marginBottom: "1.5rem",
            }}
          >
            <input
              type="file"
              id="file-upload"
              multiple
              onChange={handleFileSelect}
              style={{ display: "none" }}
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls,.pptx"
            />
            <label
              htmlFor="file-upload"
              style={{
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "0.75rem",
              }}
            >
              <FolderOpen size={48} style={{ color: "var(--accent)", opacity: 0.5 }} />
              <div>
                <p style={{ fontWeight: 500, marginBottom: "0.25rem" }}>
                  Click to browse files
                </p>
                <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Supports PDF, Word, Excel, PowerPoint, Images, and Text files
                </p>
              </div>
            </label>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div style={{ marginBottom: "1.5rem" }}>
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  marginBottom: "0.75rem",
                }}
              >
                Selected Files ({selectedFiles.length})
              </p>
              <div
                style={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "0.5rem",
                  padding: "0.5rem",
                }}
              >
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      borderRadius: "0.375rem",
                      marginBottom: "0.25rem",
                      backgroundColor:
                        uploadStatus.success.includes(file.name)
                          ? "#f0fdf4"
                          : uploadStatus.failed.includes(file.name)
                            ? "#fef2f2"
                            : "white",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {uploadStatus.success.includes(file.name) && (
                        <CheckCircle size={16} style={{ color: "#22c55e" }} />
                      )}
                      {uploadStatus.failed.includes(file.name) && (
                        <AlertCircle size={16} style={{ color: "#ef4444" }} />
                      )}
                      <span style={{ fontSize: "0.875rem" }}>{file.name}</span>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ({(file.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    {!uploading && !uploadStatus.success.includes(file.name) && (
                      <button
                        onClick={() => removeFile(index)}
                        className="btn-icon-sm"
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
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#f0fdf4",
                border: "1px solid #22c55e",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#15803d" }}>
                ✅ Successfully uploaded {uploadStatus.success.length} file(s)
              </p>
            </div>
          )}

          {uploadStatus.failed.length > 0 && (
            <div
              style={{
                padding: "0.75rem",
                backgroundColor: "#fef2f2",
                border: "1px solid #ef4444",
                borderRadius: "0.5rem",
                marginBottom: "1rem",
              }}
            >
              <p style={{ fontSize: "0.875rem", color: "#dc2626" }}>
                ❌ Failed to upload {uploadStatus.failed.length} file(s)
              </p>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className="btn-primary"
            style={{
              width: "100%",
              padding: "0.75rem",
              fontSize: "0.875rem",
              opacity: selectedFiles.length === 0 || uploading ? 0.5 : 1,
              cursor: selectedFiles.length === 0 || uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? (
              <>
                <div className="spinner" style={{ marginRight: "0.5rem" }} />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} style={{ marginRight: "0.5rem" }} />
                Upload {selectedFiles.length > 0 ? `${selectedFiles.length} file(s)` : ""}
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .upload-modal {
          max-width: 600px;
        }
        
        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid white;
          border-top-color: transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
