import { LayoutGrid, List, AlignJustify } from "lucide-react";

interface LayoutSwitcherProps {
  viewType: "grid" | "list" | "compact";
  onViewChange: (view: "grid" | "list" | "compact") => void;
  className?: string;
}

export default function LayoutSwitcher({
  viewType,
  onViewChange,
  className = "",
}: LayoutSwitcherProps) {
  return (
    <div
      className={`flex bg-white border border-gray-200 rounded-lg p-1 shadow-sm ${className}`}
    >
      <button
        className={`p-1.5 rounded-md transition-all ${
          viewType === "grid"
            ? "bg-gray-100 text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
        onClick={() => onViewChange("grid")}
        title="Grid View"
      >
        <LayoutGrid size={18} />
      </button>
      <button
        className={`p-1.5 rounded-md transition-all ${
          viewType === "list"
            ? "bg-gray-100 text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
        onClick={() => onViewChange("list")}
        title="List View"
      >
        <List size={18} />
      </button>
      <button
        className={`p-1.5 rounded-md transition-all ${
          viewType === "compact"
            ? "bg-gray-100 text-blue-600 shadow-sm"
            : "text-gray-500 hover:text-gray-900"
        }`}
        onClick={() => onViewChange("compact")}
        title="Compact View"
      >
        <AlignJustify size={18} />
      </button>
    </div>
  );
}
