import { useState, useEffect, type ReactNode } from "react";
import Page from "@/components/Page";

interface Field {
  name: string;
  label?: string;
}

interface ListViewArch {
  title?: string;
  fields?: Field[];
  actions?: ReactNode;
}

interface ListViewProps {
  arch: ListViewArch;
  model: string;
  context?: Record<string, unknown>;
}

export default function ListView({ arch, model }: ListViewProps) {
  const [records] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real implementation, this would fetch data based on the model
    // For now, we'll just simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [model]);

  const { title, fields, actions } = arch;

  return (
    <Page title={title || `${model} List`} actions={actions}>
      <div className="flex-1 overflow-y-auto p-8">
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {fields?.map((field) => (
                    <th
                      key={field.name}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {field.label || field.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={fields?.length || 1}
                      className="px-6 py-4 text-center text-gray-500"
                    >
                      No records found
                    </td>
                  </tr>
                ) : (
                  records.map((record, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      {fields?.map((field) => (
                        <td key={field.name} className="px-6 py-4 text-sm">
                          {String(record[field.name] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Page>
  );
}
