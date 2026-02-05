# SaaS Component Distribution Guide

This document explains the component organization following shadcn/ui best practices for SaaS applications.

## Directory Structure

```
src/components/
├── ui/              # Raw shadcn primitives (source code, not a library)
│   ├── button.tsx
│   ├── input.tsx
│   ├── sidebar.tsx
│   ├── badge.tsx
│   ├── card.tsx
│   └── ...
├── blocks/          # Higher-level compositions
│   ├── EmptyState.tsx
│   ├── PageHeader.tsx
│   └── ...
├── layout/          # Structural components
│   ├── DashboardShell.tsx
│   ├── AppSidebar.tsx
│   ├── Breadcrumbs.tsx
│   └── ...
└── views/           # View components (existing)
    ├── ListView.tsx
    ├── FormView.tsx
    └── ...
```

## Component Categories

### 1. UI Components (`components/ui/`)

**Purpose**: Raw shadcn/ui primitives installed via CLI or manually added.

**Characteristics**:

- Treat as source code, not a library
- Can be modified to fit your needs
- Built on Radix UI primitives
- Styled with Tailwind CSS

**Examples**:

- `button.tsx` - Base button component
- `input.tsx` - Form input component
- `sidebar.tsx` - Sidebar primitives
- `badge.tsx` - Badge/label component
- `card.tsx` - Card container component

**Usage**:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
```

### 2. Block Components (`components/blocks/`)

**Purpose**: Higher-level compositions built on top of UI primitives.

**Characteristics**:

- Combine multiple UI components
- Implement specific UX patterns
- Reusable across features
- Domain-agnostic

**Examples**:

- `EmptyState.tsx` - Empty state placeholder with optional CTA
- `PageHeader.tsx` - Standardized page header with title and actions

**Usage**:

```tsx
import { EmptyState } from "@/components/blocks";
import { FileX } from "lucide-react";

<EmptyState
  icon={FileX}
  title="No documents found"
  description="Upload your first document to get started"
  action={{
    label: "Upload Document",
    onClick: handleUpload,
  }}
/>;
```

### 3. Layout Components (`components/layout/`)

**Purpose**: Structural components that define the application shell.

**Characteristics**:

- Define page structure
- Handle navigation
- Manage responsive behavior
- Implement the "Shell" pattern

**Components**:

#### `DashboardShell.tsx`

The foundational layout component implementing the shadcn/ui "Shell" pattern:

- `SidebarProvider`: Manages collapsible state
- `AppSidebar`: Custom sidebar with navigation
- `SidebarInset`: Creates the modern "framed" SaaS look
- Header: Contains trigger, breadcrumbs, and actions

**Usage**:

```tsx
import { DashboardShell } from "@/components/layout";

<DashboardShell navItems={navItems} header={<Breadcrumbs />}>
  {/* Your page content */}
</DashboardShell>;
```

#### `AppSidebar.tsx`

Custom sidebar component with:

- `SidebarHeader`: Workspace/brand identity
- `SidebarContent`: Organized navigation groups
- `SidebarFooter`: User profile and actions
- Collapsible "icon" variant
- "inset" variant for modern appearance

#### `Breadcrumbs.tsx`

Navigation breadcrumb component for context.

## Layout Patterns

### Dashboard Layout (Current Implementation)

The app uses the **Inset Sidebar** variant for a modern, "framed" SaaS look:

```tsx
<SidebarProvider>
  <AppSidebar navItems={navItems} />
  <SidebarInset>
    <header>
      <SidebarTrigger />
      <Separator />
      <Breadcrumbs />
    </header>
    <main>{children}</main>
  </SidebarInset>
</SidebarProvider>
```

**Key Features**:

- Collapsible sidebar (icon mode)
- Inset content area with rounded corners
- Persistent header with breadcrumbs
- Smooth transitions

### Component Hierarchy

```
App.tsx
└── MotionConfig
    └── DashboardShell
        ├── AppSidebar
        │   ├── SidebarHeader (Brand/Logo)
        │   ├── SidebarContent (Navigation)
        │   └── SidebarFooter (User Profile)
        └── SidebarInset
            ├── Header (Trigger + Breadcrumbs)
            └── Main Content (Routes/Views)
```

## Best Practices

### 1. Component Placement

- **UI components**: Only shadcn primitives
- **Blocks**: Reusable compositions (2+ UI components)
- **Layout**: Structural/navigation components
- **Views**: Feature-specific view components

### 2. Import Patterns

```tsx
// UI primitives
import { Button } from "@/components/ui/button";

// Blocks
import { EmptyState, PageHeader } from "@/components/blocks";

// Layout
import { DashboardShell, Breadcrumbs } from "@/components/layout";
```

### 3. Styling Guidelines

- Use Tailwind CSS classes
- Leverage shadcn/ui design tokens
- Maintain consistent spacing (4, 6, 8, 12, 16, 24)
- Use semantic color classes (primary, secondary, muted, etc.)

### 4. Responsive Design

- Mobile-first approach
- Use sidebar collapse on mobile
- Implement responsive grids
- Test at multiple breakpoints

## Adding New Components

### Adding a UI Component

Use the shadcn CLI:

```bash
npx shadcn@latest add [component-name]
```

Or manually create in `components/ui/`.

### Adding a Block Component

1. Create file in `components/blocks/`
2. Build using UI primitives
3. Export from `components/blocks/index.ts`
4. Document usage

### Adding a Layout Component

1. Create file in `components/layout/`
2. Implement structural pattern
3. Export from `components/layout/index.ts`
4. Update this documentation

## Resources

- [shadcn/ui Documentation](https://ui.shadcn.com)
- [shadcn/ui Dashboard Example](https://ui.shadcn.com/examples/dashboard)
- [Radix UI Primitives](https://www.radix-ui.com)
- [Tailwind CSS](https://tailwindcss.com)
