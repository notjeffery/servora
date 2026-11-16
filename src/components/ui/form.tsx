export const inputClass =
  "w-full rounded-full border border-gray-300 bg-white px-6 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20";

export const textareaClass =
  "w-full rounded-2xl border border-gray-300 bg-white px-6 py-3 text-gray-900 placeholder:text-gray-400 outline-none transition-colors focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20";

export const primaryButton =
  "w-full rounded-full bg-brand-orange px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-orange-dark disabled:opacity-50";

export const outlineButton =
  "block w-full rounded-full border border-gray-300 px-6 py-3 text-center font-semibold text-gray-900 transition-colors hover:bg-gray-50";

export function Label({
  htmlFor,
  required,
  children,
}: {
  htmlFor?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-semibold text-brand-navy"
    >
      {children}
      {required && <span aria-hidden="true"> *</span>}
    </label>
  );
}