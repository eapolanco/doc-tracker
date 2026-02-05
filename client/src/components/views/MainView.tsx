import type { ComponentType } from "react";

interface MainViewArch {
  component?: ComponentType<Record<string, unknown>>;
  props?: Record<string, unknown>;
  [key: string]: unknown;
}

interface MainViewProps {
  arch: MainViewArch;
  model: string;
  context?: Record<string, unknown>;
}

export default function MainView({ arch, context }: MainViewProps) {
  // MainView is for custom component rendering
  // The arch.component should point to the actual React component to render
  const Component = arch.component;

  if (!Component) {
    return (
      <div className="p-8 text-center text-gray-500">
        No component specified for main view
      </div>
    );
  }

  return <Component {...arch.props} context={context} />;
}
