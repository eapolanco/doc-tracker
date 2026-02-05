# Migration Guide: Adopting the SaaS Component Structure

This guide helps you migrate existing components to the new shadcn/ui SaaS distribution pattern.

## Overview

We've reorganized components into three categories:

1. **`components/ui/`** - Raw shadcn primitives
2. **`components/blocks/`** - Higher-level compositions
3. **`components/layout/`** - Structural components

## What Changed

### Before

```
src/components/
├── AppSidebar.tsx
├── Button.tsx
├── ConfirmModal.tsx
├── CreateFolderModal.tsx
├── DocumentGrid.tsx
├── Page.tsx
├── PageWithActions.tsx
└── ...
```

### After

```
src/components/
├── ui/              # Primitives
│   ├── button.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   └── ...
├── blocks/          # Compositions
│   ├── EmptyState.tsx
│   ├── PageHeader.tsx
│   └── ...
├── layout/          # Structure
│   ├── DashboardShell.tsx
│   ├── AppSidebar.tsx
│   └── Breadcrumbs.tsx
└── views/           # Views (unchanged)
```

## Migration Steps

### Step 1: Update App.tsx ✅ COMPLETED

**Before:**

```tsx
import { AppSidebar } from "@/components/AppSidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

<SidebarProvider>
  <AppSidebar navItems={navItems} />
  <SidebarInset>
    <header>...</header>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>;
```

**After:**

```tsx
import { DashboardShell, Breadcrumbs } from "@/components/layout";

<DashboardShell navItems={navItems} header={<Breadcrumbs />}>
  {children}
</DashboardShell>;
```

### Step 2: Migrate Existing Components

#### Components to Keep in Root (Feature-Specific)

These are feature-specific and can stay in `components/`:

- `DocumentGrid.tsx` - Feature-specific grid
- `DocumentInfoModal.tsx` - Feature-specific modal
- `HistoryTimeline.tsx` - Feature-specific timeline
- `Settings.tsx` - Feature-specific settings
- `UploadModal.tsx` - Feature-specific upload
- `Visualizer.tsx` - Feature-specific visualizer
- `ConfirmModal.tsx` - Could move to blocks if reusable
- `CreateFolderModal.tsx` - Feature-specific modal

#### Components to Migrate to `blocks/`

These are reusable compositions:

**Page.tsx → blocks/PageContainer.tsx**

```tsx
// Old: components/Page.tsx
// New: components/blocks/PageContainer.tsx
export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>{children}</div>
  );
}
```

**PageWithActions.tsx → Use PageHeader block**

```tsx
// Old: components/PageWithActions.tsx
// New: Use components/blocks/PageHeader.tsx (already created)
<PageHeader
  title="My Page"
  description="Page description"
  actions={<Button>Action</Button>}
/>
```

#### Components Already Migrated ✅

- `AppSidebar.tsx` → `layout/AppSidebar.tsx`
- Created `layout/DashboardShell.tsx`
- Created `layout/Breadcrumbs.tsx`
- Created `blocks/EmptyState.tsx`
- Created `blocks/PageHeader.tsx`

### Step 3: Update Imports

#### Find and Replace Patterns

**AppSidebar:**

```bash
# Find:
import { AppSidebar } from "@/components/AppSidebar"

# Replace:
import { AppSidebar } from "@/components/layout"
```

**UI Components:**

```bash
# Find:
import { Button } from "@/components/Button"

# Replace:
import { Button } from "@/components/ui/button"
```

### Step 4: Add Missing shadcn Components ✅ COMPLETED

We've added:

- ✅ `ui/badge.tsx` - For status indicators
- ✅ `ui/card.tsx` - For content containers
- ✅ `ui/button.tsx` - Already existed
- ✅ `ui/input.tsx` - Already existed
- ✅ `ui/sidebar.tsx` - Already existed

## Recommended Next Steps

### 1. Migrate Modal Components to Blocks

**ConfirmModal.tsx:**

```tsx
// Move to: components/blocks/ConfirmDialog.tsx
// Use shadcn Dialog primitive
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
```

### 2. Create Additional Block Components

**DataTable Block:**

```tsx
// components/blocks/DataTable.tsx
// For data-heavy SaaS features
// Built on TanStack Table
```

**StatsCard Block:**

```tsx
// components/blocks/StatsCard.tsx
// For dashboard statistics
export function StatsCard({ title, value, change, icon }: StatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {change && <p className="text-xs text-muted-foreground">{change}</p>}
      </CardContent>
    </Card>
  );
}
```

### 3. Add More shadcn UI Components

Install as needed:

```bash
# Dialog for modals
npx shadcn@latest add dialog

# Dropdown Menu for actions
npx shadcn@latest add dropdown-menu

# Tabs for tabbed interfaces
npx shadcn@latest add tabs

# Table for data tables
npx shadcn@latest add table

# Command for global search
npx shadcn@latest add command
```

### 4. Implement Theme Toggle

Add to `layout/AppSidebar.tsx` footer:

```tsx
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

<SidebarFooter>
  <Button variant="ghost" size="icon" onClick={() => toggleTheme()}>
    <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
    <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
  </Button>
</SidebarFooter>;
```

## Testing the Migration

1. **Check imports:** Ensure all imports resolve correctly
2. **Test navigation:** Verify sidebar navigation works
3. **Test responsiveness:** Check mobile sidebar collapse
4. **Test theme:** Verify dark mode works
5. **Test animations:** Ensure MotionConfig respects settings

## Rollback Plan

If issues arise, you can revert by:

1. Restore `components/AppSidebar.tsx`
2. Revert `App.tsx` to previous version
3. Remove `components/layout/` and `components/blocks/`

## Benefits of New Structure

✅ **Better organization** - Clear separation of concerns
✅ **Easier maintenance** - Components grouped by purpose
✅ **Improved reusability** - Blocks can be used anywhere
✅ **Scalability** - Easy to add new components
✅ **shadcn/ui alignment** - Follows official patterns
✅ **Better DX** - Clearer import paths

## Questions?

Refer to:

- `COMPONENT_STRUCTURE.md` - Detailed structure documentation
- `components/ExampleDashboardPage.tsx` - Usage examples
- [shadcn/ui docs](https://ui.shadcn.com)
