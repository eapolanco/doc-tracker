# DocTracker Architecture

## Overview

DocTracker uses a metadata-driven, extensible modular architecture inspired by Odoo, combined with modern React patterns for state management and routing.

---

## 1. Modular View System

### View Registry (`core/registry/ViewRegistry.ts`)

- Central manager for all view definitions.
- Supports view inheritance and declarative patching (insert_after, replace, etc.).

### Manifest System (`core/manifest/`)

- Each feature defines a `manifest.ts` file declaring dependencies, navigation items, and view metadata.
- `ManifestLoader` resolves the loading order based on feature dependencies.

### View Renderer (`components/views/ViewRenderer.tsx`)

- A dynamic engine that maps view metadata to concrete UI implementations (List, Form, Kanban, etc.).

---

## 2. State Management Strategy

We distinguish between **Client State** (transient UI settings) and **Server State** (data persisted on the backend).

### Client State (Zustand)

Located in `store/`, we use specialized stores for predictable state updates:

- **`uiStore`**: Manages global UI state (active tab, sidebar state, view types, search queries). Uses `localStorage` persistence for preferences.
- **`settingsStore`**: Synchronizes application-wide settings (theme, animations, app name).
- **`documentStore`**: Handles transient document state like current selection and clipboard data (copy/move).

### Server State (React Query)

We use **TanStack Query** for data fetching, caching, and synchronization:

- **Fetching**: Documents, accounts, and settings are fetched via `useQuery` hooks.
- **Mutations**: Operations like file uploads, deletions, and updates use `useMutation`.
- **Cache Invalidation**: On successful mutations, we invalidate related queries (e.g., `['documents']`) to trigger automatic background updates.
- **Optimistic Updates**: Used for settings and toggles to provide immediate UI feedback before server confirmation.

---

## 3. Navigation & Routing

### React Router

- **Addressable URLs**: Every view in the modular system is addressable via the `/app?viewid={tab_id}` pattern.
- **Deep Linking**: URL parameters like `viewid` and `id` (for previews) are synchronized with the `uiStore`, allowing users to bookmark or share specific states.
- **Back/Forward Support**: Leverages the browser's history API for standard navigation behavior.

### Store-Router Bridge

The `App.tsx` component acts as a bridge:

- It monitors URL changes via `useLocation`.
- It synchronizes the state in `uiStore` to match the URL.
- This ensures that navigating via standard `<Link>` components correctly updates the modular `ViewRenderer`.

---

## 4. Modernizing a Component (Example)

When building or updating a view, follow these patterns:

```typescript
// 1. Use Zustand for UI state
const { activeTab, navigate } = useUIStore();

// 2. Use React Query for data
const { data: documents, isLoading } = useQuery({
  queryKey: ["documents", filter],
  queryFn: fetchDocuments,
});

// 3. Use Mutations for actions
const moveMutation = useMutation({
  mutationFn: moveFiles,
  onSuccess: () => queryClient.invalidateQueries(["documents"]),
});
```

---

## 5. Benefits of this Architecture

1.  **Strict Separation of Concerns**: Views (metadata), Data (React Query), and UI State (Zustand) are clearly decoupled.
2.  **Extensibility**: New features can be added by creating a manifest and a view implementation without touching core files.
3.  **Performance**: Efficient caching via React Query and atomic state updates via Zustand.
4.  **UX**: Instant feedback through optimistic updates and shareable application states through addressable URLs.

## Future Enhancements

1.  **Auto-Discovery**: Move from manual imports in `core/init.ts` to Vite's `import.meta.glob`.
2.  **Advanced ORM**: Implement a consistent model layer for features to define data schemas.
3.  **Real-time Sync**: Integrate WebSockets to trigger React Query invalidations from the server.
