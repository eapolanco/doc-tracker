import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Button as ShadcnButton,
  type ButtonProps as ShadcnButtonProps,
} from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "danger"
  | "success"
  | "ghost"
  | "outline"
  | "outline_danger"
  | "link";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  icon?: LucideIcon;
  loading?: boolean;
  children?: ReactNode;
  size?: "default" | "sm" | "lg" | "icon";
}

export default function Button({
  variant = "primary",
  icon: Icon,
  loading = false,
  children,
  className = "",
  disabled,
  size = "default",
  ...props
}: ButtonProps) {
  const mapVariant = (v: ButtonVariant): ShadcnButtonProps["variant"] => {
    switch (v) {
      case "primary":
        return "default";
      case "danger":
        return "destructive";
      case "outline_danger":
        return "outline_destructive";
      default:
        // Use assertion to allow passing through other values that match
        return v as ShadcnButtonProps["variant"];
    }
  };

  return (
    <ShadcnButton
      variant={mapVariant(variant)}
      disabled={disabled || loading}
      className={cn(className)}
      size={size}
      {...props}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {!loading && Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </ShadcnButton>
  );
}
