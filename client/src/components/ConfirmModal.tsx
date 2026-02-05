import { X, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "info";
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md overflow-hidden bg-white rounded-2xl shadow-2xl dark:bg-slate-900"
        >
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div
                className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                  variant === "danger"
                    ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
                    : "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                }`}
              >
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 mb-1 dark:text-white">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed dark:text-slate-400">
                  {message}
                </p>
              </div>
              <Button
                variant="ghost"
                onClick={onClose}
                icon={X}
                className="shrink-0 p-1"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex flex-col sm:flex-row-reverse gap-3 dark:bg-slate-800/50">
            <Button
              variant={variant === "danger" ? "danger" : "primary"}
              onClick={() => {
                onConfirm();
                onClose();
              }}
            >
              {confirmText}
            </Button>
            <Button variant="outline" onClick={onClose}>
              {cancelText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
