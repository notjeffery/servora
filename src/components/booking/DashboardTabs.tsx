import Link from "next/link";

export type TabDef = { key: string; label: string; count: number };

export default function DashboardTabs({
  tabs,
  active,
  basePath,
}: {
  tabs: TabDef[];
  active: string;
  basePath: string;
}) {
  return (
    <nav className="flex gap-1 overflow-x-auto border-b">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${basePath}?tab=${t.key}`}
          className={`-mb-px whitespace-nowrap border-b-2 px-4 py-2 text-sm font-semibold ${
            active === t.key
              ? "border-brand-orange text-brand-orange"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {t.label} ({t.count})
        </Link>
      ))}
    </nav>
  );
}