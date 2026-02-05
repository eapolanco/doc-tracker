import Page from "@/components/Page";

interface Field {
  name: string;
  label?: string;
  type?: "text" | "number" | "boolean" | string;
  required?: boolean;
  readonly?: boolean;
}

interface FormViewArch {
  title?: string;
  fields?: Field[];
}

interface FormViewProps {
  arch: FormViewArch;
  model: string;
  context?: Record<string, unknown>;
}

export default function FormView({ arch, model }: FormViewProps) {
  const { title, fields } = arch;

  return (
    <Page title={title || `${model} Form`}>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <form className="space-y-6">
            {fields?.map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {field.label || field.name}
                  {field.required && <span className="text-red-500">*</span>}
                </label>
                {(field.type === "text" || !field.type) && (
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={field.required}
                    readOnly={field.readonly}
                  />
                )}
                {field.type === "number" && (
                  <input
                    type="number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={field.required}
                    readOnly={field.readonly}
                  />
                )}
                {field.type === "boolean" && (
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={field.readonly}
                  />
                )}
              </div>
            ))}
          </form>
        </div>
      </div>
    </Page>
  );
}
