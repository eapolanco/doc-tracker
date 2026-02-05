import { useState, useCallback } from "react";

export type ViewType = "grid" | "list" | "compact";
export type SortField = "name" | "date" | "category";
export type SortOrder = "asc" | "desc";

interface ViewOptions {
  viewType: ViewType;
  sortField: SortField;
  sortOrder: SortOrder;
}

export function useViewOptions(initialView: ViewType = "grid") {
  const [options, setOptions] = useState<ViewOptions>({
    viewType: initialView,
    sortField: "date",
    sortOrder: "desc",
  });

  const setViewType = useCallback((viewType: ViewType) => {
    setOptions((prev) => ({ ...prev, viewType }));
  }, []);

  const handleSort = useCallback((field: SortField) => {
    setOptions((prev) => {
      if (prev.sortField === field) {
        return {
          ...prev,
          sortOrder: prev.sortOrder === "asc" ? "desc" : "asc",
        };
      }
      return { ...prev, sortField: field, sortOrder: "asc" };
    });
  }, []);

  return {
    ...options,
    setViewType,
    handleSort,
  };
}
