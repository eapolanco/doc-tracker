# Odoo-Style Modular View Architecture

## Overview

This implementation provides a metadata-driven, extensible view system inspired by Odoo's architecture. Features can be added or removed without modifying core code.

## Key Components

### 1. View Registry (`core/registry/ViewRegistry.ts`)

- Central manager for all view definitions
- Supports view inheritance and patching
- Caches resolved views for performance

### 2. Manifest System (`core/manifest/`)

- Each feature has a `manifest.ts` file declaring:
  - Dependencies
  - Navigation items
  - View definitions
  - Models
- `ManifestLoader` handles dependency resolution and loading order

### 3. View Renderer (`components/views/ViewRenderer.tsx`)

- Generic component that maps view metadata to concrete implementations
- Supports: List, Form, Kanban, and Main (custom) views

### 4. View Types

- **ListView**: Table-based data display
- **FormView**: Form-based data entry
- **KanbanView**: Card-based workflow display
- **MainView**: Wrapper for custom React components (backward compatibility)

## How It Works

### Adding a New Feature

1. Create folder: `features/my_feature/`
2. Add `manifest.ts`:

```typescript
export const manifest: FeatureManifest = {
  name: "my_feature",
  version: "1.0.0",
  depends: ["base"],
  navItems: [
    /* ... */
  ],
};
```

3. Register views in the manifest
4. Import manifest in `core/init.ts`

### Extending Existing Features

Module B can extend Module A's views without modifying A:

```typescript
viewRegistry.extendView({
  inherit_id: "documents.document_list",
  arch: [
    {
      action: "insert_after",
      xpath: "//field[@name='name']",
      content: { name: "new_field", label: "New Field", type: "text" },
    },
  ],
});
```

### View Definition Example

```typescript
viewRegistry.registerView({
  id: "documents.document_list",
  model: "document",
  type: "list",
  arch: {
    title: "Documents",
    fields: [
      { name: "name", label: "Name", type: "text" },
      { name: "category", label: "Category", type: "text" },
    ],
  },
  priority: 10,
});
```

## Benefits

1. **Hot-Plugging**: Add/remove features by adding/removing folders
2. **No Core Modifications**: Extensions don't touch base modules
3. **Decoupled Data/View**: Views are metadata, not hardcoded JSX
4. **Inheritance**: Modules can extend other modules' views
5. **Dependency Management**: Automatic loading order based on dependencies

## Example: AI Processor Extension

The `ai_processor` module extends the documents list view to add an AI Summary column:

```typescript
// features/ai_processor/manifest.ts
export const manifest: FeatureManifest = {
  name: "ai_processor",
  version: "1.0.0",
  depends: ["documents"],
};

viewRegistry.extendView({
  inherit_id: "documents.document_list",
  arch: [
    {
      action: "insert_after",
      xpath: "//field[@name='name']",
      content: { name: "ai_summary", label: "AI Summary", type: "text" },
    },
  ],
});
```

This adds a new field without modifying the documents module.

## Future Enhancements

1. **Auto-Discovery**: Use Vite's `import.meta.glob` to automatically discover manifests
2. **Model Layer**: Implement ORM-like model definitions
3. **Advanced XPath**: Support more complex view patching operations
4. **View Composition**: Allow views to include other views
5. **Action System**: Define actions (buttons, menus) in metadata
