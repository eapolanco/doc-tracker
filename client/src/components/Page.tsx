import { type ReactNode } from "react";

interface PageProps {
  title: ReactNode;
  subtitle?: string;
  actions?: ReactNode;
  headerExtras?: ReactNode;
  children: ReactNode;
  className?: string;
}

export default function Page({
  title,
  subtitle,
  actions,
  headerExtras,
  children,
  className = "",
}: PageProps) {
  return (
    <div
      id={`page-${typeof title === "string" ? title.toLowerCase().replace(/\s+/g, "-") : "content"}`}
      className={`flex h-full w-full overflow-hidden flex-col ${className}`}
    >
      <header className="px-8 pt-8 pb-4 shrink-0 border-b border-gray-100 bg-white/50 backdrop-blur-md top-0dark:border-slate-800 dark:bg-slate-900/90">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex gap-3 items-center">{actions}</div>}
        </div>
        {headerExtras && <div className="mt-2">{headerExtras}</div>}
      </header>

      <div className="flex-1 overflow-hidden relative flex flex-col">
        {children}
      </div>
    </div>
  );
}
