import { type ReactNode } from "react";

/**
 * Hook for defining feature-specific header actions.
 * This provides a clean, decoupled way for features to define their header buttons
 * without coupling to the Page component or App structure.
 *
 * @example
 * ```tsx
 * function MyFeature() {
 *   const headerActions = useFeatureActions(
 *     <button onClick={handleAction}>My Action</button>
 *   );
 *
 *   return <Page title="My Feature" actions={headerActions}>...</Page>;
 * }
 * ```
 */
export function useFeatureActions(actions: ReactNode): ReactNode {
  return actions;
}

/**
 * Helper to create conditional header actions based on state.
 *
 * @example
 * ```tsx
 * const actions = createConditionalActions([
 *   { condition: selectedIds.size > 0, action: <RestoreButton /> },
 *   { condition: true, action: <RefreshButton /> },
 * ]);
 * ```
 */
export function createConditionalActions(
  conditions: Array<{ condition: boolean; action: ReactNode }>,
): ReactNode {
  return (
    <>
      {conditions
        .filter((c) => c.condition)
        .map((c, idx) => (
          <span key={idx}>{c.action}</span>
        ))}
    </>
  );
}
