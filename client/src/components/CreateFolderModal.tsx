import { useState } from "react";
import { FolderPlus, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function CreateFolderModal({
  isOpen,
  onClose,
  onCreate,
}: Props) {
  const [folderName, setFolderName] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-2000 p-4 animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 dark:text-white">
              <FolderPlus className="text-blue-600 dark:text-blue-400" />
              New Folder
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-500 transition-colors dark:hover:bg-slate-800 dark:text-slate-400"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-400">
                Folder Name
              </label>
              <input
                type="text"
                value={folderName}
                onChange={(e) => setFolderName(e.target.value)}
                placeholder="e.g. Finances"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && folderName.trim()) {
                    onCreate(folderName);
                  }
                  if (e.key === "Escape") {
                    onClose();
                  }
                }}
              />
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors dark:text-slate-400 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => onCreate(folderName)}
                disabled={!folderName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                Create Folder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
