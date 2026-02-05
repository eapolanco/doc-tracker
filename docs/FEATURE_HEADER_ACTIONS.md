# Feature Header Actions Pattern

This document explains how to add header buttons to your feature in a decoupled way.

## Overview

The application uses a decoupled pattern for feature-specific header actions. Each feature can define its own header buttons without coupling to the `Page` component or the main App structure.

## How It Works

### 1. Basic Pattern

Every feature component can pass header actions to the `Page` component via the `actions` prop:

```tsx
import Page from "@/components/Page";

export default function MyFeature() {
  const handleAction = () => {
    // Your action logic
  };

  return (
    <Page
      title="My Feature"
      actions={<button onClick={handleAction}>My Action</button>}
    >
      {/* Feature content */}
    </Page>
  );
}
```

### 2. Conditional Actions

Use the `createConditionalActions` helper for actions that should only appear under certain conditions:

```tsx
import { createConditionalActions } from "@/hooks/useFeatureActions";
import { RefreshCcw, Trash2 } from "lucide-react";

export default function MyFeature() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState([]);

  const headerActions =
    items.length > 0 &&
    createConditionalActions([
      {
        condition: selectedIds.size > 0,
        action: (
          <button onClick={handleRestore}>
            <RefreshCcw size={16} />
            Restore Selected ({selectedIds.size})
          </button>
        ),
      },
      {
        condition: true, // Always show
        action: <button onClick={handleRefresh}>Refresh</button>,
      },
    ]);

  return (
    <Page title="My Feature" actions={headerActions}>
      {/* Feature content */}
    </Page>
  );
}
```

### 3. Multiple Actions

For multiple actions, wrap them in a fragment or div:

```tsx
const headerActions = (
  <>
    <button onClick={handleAction1}>Action 1</button>
    <button onClick={handleAction2}>Action 2</button>
    <button onClick={handleAction3}>Action 3</button>
  </>
);

return (
  <Page title="My Feature" actions={headerActions}>
    ...
  </Page>
);
```

## Real-World Example: Trash Feature

The Trash feature demonstrates this pattern perfectly:

```tsx
// TrashMain.tsx
import { createConditionalActions } from "@/hooks/useFeatureActions";

export default function TrashMain() {
  const [documents, setDocuments] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [loading, setLoading] = useState(false);

  // Define feature-specific header actions
  const headerActions =
    documents.length > 0 &&
    createConditionalActions([
      {
        condition: selectedIds.size > 0,
        action: (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg..."
            onClick={handleRestoreSelected}
            disabled={loading}
          >
            <RefreshCcw size={16} />
            Restore Selected ({selectedIds.size})
          </button>
        ),
      },
      {
        condition: true,
        action: <button onClick={handleRestoreAll}>Restore All</button>,
      },
      {
        condition: true,
        action: <button onClick={handleEmptyTrash}>Empty Trash</button>,
      },
    ]);

  return (
    <Page title="Trash Bin" actions={headerActions}>
      {/* Feature content */}
    </Page>
  );
}
```

## Benefits

1. **Decoupling**: Features don't need to know about the Page component's internal structure
2. **Flexibility**: Each feature can have different actions based on its state
3. **Maintainability**: Actions are defined close to their logic
4. **Reusability**: The `createConditionalActions` helper can be used across features
5. **Type Safety**: Full TypeScript support

## Best Practices

1. **Keep actions close to their logic**: Define header actions in the same component where their handlers are defined
2. **Use conditional rendering**: Only show actions when they're relevant
3. **Provide visual feedback**: Disable buttons during loading states
4. **Use consistent styling**: Follow the app's design system for button styles
5. **Add icons**: Use lucide-react icons for better UX

## API Reference

### `createConditionalActions(conditions)`

Helper function to create conditional header actions.

**Parameters:**

- `conditions`: Array of objects with:
  - `condition`: boolean - Whether to show this action
  - `action`: ReactNode - The action component to render

**Returns:** ReactNode

**Example:**

```tsx
const actions = createConditionalActions([
  { condition: hasSelection, action: <DeleteButton /> },
  { condition: true, action: <RefreshButton /> },
]);
```

### `useFeatureActions(actions)`

Simple hook for defining feature actions (currently just returns the actions, but provides a consistent API for future enhancements).

**Parameters:**

- `actions`: ReactNode - The actions to use

**Returns:** ReactNode

## Migration Guide

If you have an existing feature with inline actions:

**Before:**

```tsx
<Page
  title="My Feature"
  actions={
    <div className="flex gap-3">
      {condition && <button>Action 1</button>}
      <button>Action 2</button>
    </div>
  }
>
```

**After:**

```tsx
const headerActions = createConditionalActions([
  { condition: condition, action: <button>Action 1</button> },
  { condition: true, action: <button>Action 2</button> },
]);

<Page title="My Feature" actions={headerActions}>
```
