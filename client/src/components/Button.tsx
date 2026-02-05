import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "outline"
  | "outline_danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  children?: ReactNode;
}

export default function Button({
  variant = "primary",
  icon: Icon,
  loading = false,
  children,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants: Record<ButtonVariant, string> = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20",
    secondary:
      "bg-gray-900 text-white hover:bg-gray-800 shadow-md shadow-black/10",
    danger:
      "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20",
    success:
      "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md shadow-emerald-500/20",
    outline:
      "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-slate-700",
    ghost:
      "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
    outline_danger:
      "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300 shadow-sm dark:bg-slate-900 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/20 dark:hover:border-red-800",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {Icon && <Icon size={18} className={loading ? "animate-spin" : ""} />}
      {children}
    </button>
  );
}
