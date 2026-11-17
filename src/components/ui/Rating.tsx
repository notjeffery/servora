import { Star } from "lucide-react";

type Props = { average: number | null; count: number };

export default function Rating({ average, count }: Props) {
  if (!average) {
    return <span className="text-sm text-gray-500">New on SERVORA</span>;
  }
  return (
    <span className="flex items-center gap-1 text-sm">
      <Star size={14} className="fill-brand-orange text-brand-orange" />
      <span className="font-semibold">{average.toFixed(1)}</span>
      <span className="text-gray-500">({count})</span>
    </span>
  );
}