# Components Directory

This directory follows the **shadcn/ui SaaS Distribution Pattern** for optimal organization and scalability.

## 📁 Structure

```
components/
├── ui/              # Raw shadcn/ui primitives (treat as source code)
├── blocks/          # Higher-level reusable compositions
├── layout/          # Structural/navigation components
└── views/           # Feature-specific view components
```

## 🎯 Quick Reference

### When to use each folder:

| Folder      | Purpose               | Examples                                      |
| ----------- | --------------------- | --------------------------------------------- |
| **ui/**     | shadcn/ui primitives  | `button`, `card`, `badge`, `input`            |
| **blocks/** | Reusable compositions | `EmptyState`, `PageHeader`, `StatsCard`       |
| **layout/** | App structure         | `DashboardShell`, `AppSidebar`, `Breadcrumbs` |
| **views/**  | Feature views         | `ListView`, `FormView`, `KanbanView`          |

## 🚀 Usage

### Import from index files:

```tsx
// ✅ Good - Use barrel exports
import { EmptyState, PageHeader } from "@/components/blocks";
import { DashboardShell } from "@/components/layout";
import { Button, Card } from "@/components/ui/button";

// ❌ Avoid - Direct file imports
import { EmptyState } from "@/components/blocks/EmptyState";
```

## 📖 Documentation

- **[QUICK_START.md](../QUICK_START.md)** - Quick reference and common patterns
- **[COMPONENT_STRUCTURE.md](../COMPONENT_STRUCTURE.md)** - Detailed structure docs
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Migration guide
- **[IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md)** - What was implemented

## 🎨 Component Hierarchy

```
App
└── DashboardShell (layout)
    ├── AppSidebar (layout)
    └── SidebarInset
        ├── Breadcrumbs (layout)
        └── Page Content
            ├── PageHeader (block)
            └── Content
                ├── StatsCard (block)
                ├── Card (ui)
                ├── Button (ui)
                └── EmptyState (block)
```

## 🔧 Adding Components

### Add a UI primitive:

```bash
npx shadcn@latest add [component-name]
```

### Add a block component:

1. Create in `blocks/MyBlock.tsx`
2. Export from `blocks/index.ts`

### Add a layout component:

1. Create in `layout/MyLayout.tsx`
2. Export from `layout/index.ts`

## 📚 Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [shadcn/ui Examples](https://ui.shadcn.com/examples)
- [Radix UI](https://www.radix-ui.com)

---

**See [QUICK_START.md](../QUICK_START.md) for usage examples**
