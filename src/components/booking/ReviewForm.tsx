"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/ui/Avatar";
import { primaryButton, textareaClass, Label } from "@/components/ui/form";

type Props = {
  bookingId: string;
  customerId: string;
  proId: string;
  proName: string;
  avatarUrl: string | null;
  category: string;
};

const labels = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

export default function ReviewForm({
  bookingId,
  customerId,
  proId,
  proName,
  avatarUrl,
  category,
}: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const shown = hover || rating;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (rating < 1) {
      setError("Choose a star rating.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("reviews").insert({
      booking_id: bookingId,
      reviewer_id: customerId,
      reviewee_id: proId,
      rating,
      comment: comment.trim() || null,
    });

    if (error) {
      console.error(error);
      setError(
        error.code === "23505"
          ? "You've already reviewed this job."
          : "We couldn't save your review. Please try again."
      );
      setLoading(false);
      return;
    }

    router.push("/dashboard/customer?tab=completed");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-lg space-y-6 rounded-3xl border p-8 sm:p-10"
    >
      <div className="flex items-center gap-4">
        <Avatar name={proName} src={avatarUrl} size={64} />
        <div>
          <h1 className="text-2xl font-bold text-brand-navy">How did it go?</h1>
          <p className="text-gray-600">
            Rate {proName}&apos;s {category.toLowerCase()} job
          </p>
        </div>
      </div>

      <div>
        <div
          className="flex gap-1"
          role="radiogroup"
          aria-label="Rating"
          onMouseLeave={() => setHover(0)}
        >
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setRating(n)}
              className="p-1"
            >
              <Star
                size={36}
                className={
                  n <= shown
                    ? "fill-brand-orange text-brand-orange"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-sm text-gray-600">{labels[shown]}</p>
      </div>

      <div>
        <Label htmlFor="comment">Tell others about it (optional)</Label>
        <textarea
          id="comment"
          className={textareaClass}
          rows={5}
          maxLength={1000}
          placeholder="Was the work good? Were they on time and easy to deal with?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <p className="mt-2 text-xs text-gray-500">
          Your review is public and shows your first name and last initial. It
          can&apos;t be edited after you post it.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={loading} className={primaryButton}>
        {loading ? "Posting..." : "Post review"}
      </button>
    </form>
  );
}