# HOWTO: Introducing New Features

This guide explains how to add new features to DocTracker using its modular view architecture, Zustand state management, and React Query for server data.

---

## 1. Feature Directory Structure

Create a folder under `src/features/[feature_name]`. A typical feature follows this structure:

```
src/features/my_feature/
├── components/       # Reusable UI components for this feature
├── controllers/      # API communication logic (Controller pattern)
├── models/           # Data models/interfaces
├── views/            # Main view implementations
└── manifest.ts       # Module declaration (REQUIRED)
```

---

## 2. Create the Manifest

The `manifest.ts` file tells DocTracker how to integrate your feature.

```typescript
import type { FeatureManifest } from "@/core/manifest/types";
import { viewRegistry } from "@/core/registry/ViewRegistry";
import MyFeatureMainView from "./views/MyFeatureMainView";

export const manifest: FeatureManifest = {
  name: "my_feature", // Unique technical name
  version: "1.0.0",
  depends: ["base"], // Ensure 'base' is loaded first
  navItems: [
    {
      id: "my_feature_main", // Unique ID used in URLs (?viewid=...)
      label: "My Feature", // Sidebar label
      icon: "FileText", // Lucide icon name (must be in Sidebar.tsx Map)
      section: "SYSTEM", // Sidebar section (DOCUMENTS, STORAGE, SYSTEM)
      order: 10,
      action: {
        type: "view",
        model: "my_model", // The model this view operates on
        viewType: "main", // 'main' for custom React components
      },
    },
  ],
};

// Register your view implementation
viewRegistry.registerView({
  id: "my_feature.main_view",
  model: "my_model",
  type: "main",
  arch: {
    component: MyFeatureMainView,
    props: {},
  },
});
```

---

## 3. Implement the View

Use **React Query** for data and **Zustand** for global UI state.

```tsx
// src/features/my_feature/views/MyFeatureMainView.tsx
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUIStore } from "@/store/uiStore";
import Page from "@/components/Page";

export default function MyFeatureMainView() {
  // 1. Get UI state from Zustand
  const { searchQuery } = useUIStore();

  // 2. Fetch data from React Query
  const { data, isLoading } = useQuery({
    queryKey: ["my_data", searchQuery],
    queryFn: () => myController.fetch(searchQuery),
  });

  return (
    <Page title="My Feature">
      {isLoading ? <p>Loading...</p> : <div>{/* Render data */}</div>}
    </Page>
  );
}
```

---

## 4. State Management Patterns

### Server State (React Query)

- **Queries**: Use `useQuery` for all `GET` operations.
- **Mutations**: Use `useMutation` for `POST/PUT/DELETE`.
- **Invalidation**: Always call `queryClient.invalidateQueries(...)` in `onSuccess` to keep the UI in sync.

### Client State (Zustand)

- Use `uiStore` for search, filters, and cross-feature UI state.
- Create a feature-specific store in `store/` if you need to manage complex local state that persists or needs to be shared across multiple components within your feature.

---

## 5. Register the Feature

Finally, import your feature manifest in `src/core/init.ts` to activate it.

```typescript
// src/core/init.ts
import { manifest as my_feature } from "@/features/my_feature/manifest";

export async function initializeModules() {
  const coreManifests = [
    // ... existing manifests ...
    { m: my_feature, path: "/features/my_feature" },
  ];

  for (const item of coreManifests) {
    await manifestLoader.loadManifest(item.m, item.path);
  }
}
```

---

## 6. Routing & Navigation

Navigation is automatic:

- Adding a `navItem` in the manifest makes it appear in the sidebar.
- Clicking that item updates the URL to `/app?viewid=[your_nav_id]`.
- The `App.tsx` bridge detects this change and tells the `ViewRenderer` to show your registered view.

---

## Best Practices

1.  **Don't Modify Core**: Never modify `App.tsx` or `Sidebar.tsx` to add a feature. Use the manifest.
2.  **Optimistic UI**: For a premium feel, implement optimistic updates in your mutations.
3.  **Addressable State**: If your view has sub-sections, use URL parameters to make them linkable.
4.  **Lucide Icons**: If using a new icon, ensure it's added to the `IconMap` in `src/components/Sidebar.tsx`.
