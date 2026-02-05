# Decoupled Header Actions Implementation Summary

## Overview

Implemented a clean, decoupled pattern for features to add header buttons without coupling to the Page component or App structure.

## What Was Implemented

### 1. Core Infrastructure

#### `ViewRegistry.ts` Enhancement

- Extended `ViewArch` interface to support `headerActions` property
- Features can now define header actions in their view definitions

#### `useFeatureActions.tsx` Hook

- Created `useFeatureActions()` hook for consistent API
- Created `createConditionalActions()` helper for conditional rendering
- Provides clean abstraction for feature-specific actions

#### `PageWithActions.tsx` Component

- Alternative to `Page` component with explicit documentation
- Same functionality, clearer intent for header actions

### 2. Pattern Implementation

#### Trash Feature (Complete Example)

- Demonstrates conditional actions based on state
- Shows multiple buttons with different conditions
- Uses `createConditionalActions()` for clean code
- Actions:
  - "Restore Selected" (conditional: when items selected)
  - "Restore All" (always visible)
  - "Empty Trash" (always visible)

#### History Feature (Simple Example)

- Demonstrates basic single action
- Shows loading state with spinning icon
- Actions:
  - "Refresh" button with loading indicator

### 3. Documentation

#### `FEATURE_HEADER_ACTIONS.md`

- Comprehensive guide for developers
- Real-world examples
- Best practices
- Migration guide
- API reference

## Key Benefits

### 1. **Decoupling**

Features don't need to know about:

- Page component internals
- App-level state management
- Other features' implementations

### 2. **Flexibility**

Each feature can:

- Define any number of actions
- Show/hide actions based on state
- Use any React components as actions
- Style actions independently

### 3. **Maintainability**

- Actions defined close to their logic
- Clear separation of concerns
- Easy to test and modify
- Self-documenting code

### 4. **Consistency**

- Standard pattern across all features
- Reusable helpers
- TypeScript support
- Predictable behavior

## Usage Pattern

```tsx
// 1. Import helpers
import { createConditionalActions } from "@/hooks/useFeatureActions";
import Page from "@/components/Page";

// 2. Define your feature component
export default function MyFeature() {
  const [state, setState] = useState(...);

  // 3. Define header actions
  const headerActions = createConditionalActions([
    {
      condition: someCondition,
      action: <button onClick={handler}>Action 1</button>,
    },
    {
      condition: true, // Always show
      action: <button onClick={handler}>Action 2</button>,
    },
  ]);

  // 4. Pass to Page component
  return (
    <Page title="My Feature" actions={headerActions}>
      {/* Feature content */}
    </Page>
  );
}
```

## File Structure

```
client/src/
├── components/
│   ├── Page.tsx                    # Original page component
│   └── PageWithActions.tsx         # Alternative with clear docs
├── hooks/
│   └── useFeatureActions.tsx       # Action helpers
├── core/
│   └── registry/
│       └── ViewRegistry.ts         # Extended with headerActions
├── features/
│   ├── trash/
│   │   └── components/
│   │       └── TrashMain.tsx       # Complex example
│   └── history/
│       └── components/
│           └── HistoryMain.tsx     # Simple example
└── docs/
    └── FEATURE_HEADER_ACTIONS.md   # Developer guide
```

## Examples in Codebase

### Complex: Trash Feature

- Multiple conditional buttons
- State-dependent rendering
- Loading states
- Confirmation dialogs

### Simple: History Feature

- Single refresh button
- Loading indicator
- Error handling

## Migration Path

For existing features:

1. **Identify header actions** in your feature
2. **Extract to variable** using `createConditionalActions()`
3. **Pass to Page component** via `actions` prop
4. **Test** conditional rendering
5. **Remove** any direct Page component coupling

## Future Enhancements

Potential improvements:

- Action groups/dropdowns
- Keyboard shortcuts
- Action permissions
- Analytics tracking
- Undo/redo support

## Testing

Features can test their actions independently:

```tsx
describe("MyFeature", () => {
  it("shows action when condition is met", () => {
    const { getByText } = render(<MyFeature />);
    // Test action visibility
  });
});
```

## Conclusion

This implementation provides a clean, maintainable, and scalable pattern for feature-specific header actions. Features remain decoupled while maintaining full flexibility in defining their UI.
