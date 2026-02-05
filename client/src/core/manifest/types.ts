export interface FeatureManifest {
  name: string;
  version: string;
  depends: string[];
  views?: string[]; // Paths to view definition files
  models?: string[]; // Paths to model definition files
  navItems?: NavItemDefinition[];
  category?: string;
}

export interface NavItemDefinition {
  id: string;
  label: string;
  icon?: string;
  section?: string;
  order?: number;
  action?: {
    type: "view" | "url" | "custom";
    model?: string;
    viewType?: string;
    url?: string;
  };
}

export interface ModelDefinition {
  name: string;
  fields: FieldDefinition[];
  methods?: {
    [key: string]: (...args: any[]) => any;
  };
}

export interface FieldDefinition {
  name: string;
  type: "string" | "number" | "boolean" | "date" | "relation";
  label?: string;
  required?: boolean;
  readonly?: boolean;
  relation?: string; // For relation fields
}
