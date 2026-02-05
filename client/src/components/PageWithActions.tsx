import { type ReactNode } from "react";

interface PageWithActionsProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Page component with support for feature-specific header actions.
 * Features can pass their header actions through the `actions` prop,
 * keeping the implementation decoupled from the Page component itself.
 */
export default function PageWithActions({
  title,
  subtitle,
  actions,
  children,
  className = "",
}: PageWithActionsProps) {
  return (
    <div className={`flex h-full w-full overflow-hidden flex-col ${className}`}>
      <header className="px-8 pt-8 pb-4 shrink-0">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex gap-3 items-center">{actions}</div>}
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
