"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Star, MessageSquare } from "lucide-react";
import Link from "next/link";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: Date | string;
  user?: {
    name: string | null;
  } | null;
}

export default function ReviewSection({
  productId,
  reviews,
}: {
  productId: string;
  reviews: ReviewItem[];
}) {
  const { data: session } = useSession();
  const router = useRouter();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit review");
      }

      setComment("");
      setRating(5);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : "0.0";

  return (
    <section className="mt-16 border-t border-neutral-200 pt-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-neutral-900">
            Customer Reviews & Ratings
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Real feedback from verified purchasers
          </p>
        </div>

        <div className="flex items-center gap-3 bg-neutral-100 rounded-2xl px-5 py-3 w-fit">
          <div className="flex items-center gap-1 text-amber-500">
            <Star className="h-6 w-6 fill-amber-400" />
            <span className="text-xl font-black text-neutral-900">{averageRating}</span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Write Review Form */}
        <div className="lg:col-span-5 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-neutral-700" /> Write a Review
          </h3>

          {!session ? (
            <div className="text-center py-6">
              <p className="text-sm text-neutral-600 mb-4">
                Please sign in to share your thoughts about this product.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-xl bg-neutral-900 px-5 py-2.5 text-xs font-bold text-white transition hover:bg-neutral-800"
              >
                Sign In to Review
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-600">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Rating
                </label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-amber-400 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= rating ? "fill-amber-400" : "stroke-neutral-300"
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-neutral-700">
                    {rating} out of 5
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                  Your Review
                </label>
                <textarea
                  rows={4}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="What did you like or dislike about this product?"
                  className="w-full rounded-xl border border-neutral-300 p-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-900"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !comment.trim()}
                className="w-full rounded-xl bg-neutral-900 py-3 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Existing Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          {reviews.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-8 text-center text-sm text-neutral-500">
              No customer reviews yet. Be the first to review this product!
            </div>
          ) : (
            reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-neutral-900">
                      {r.user?.name || "Verified Customer"}
                    </span>
                    <span className="text-xs text-neutral-400">•</span>
                    <span className="text-xs text-neutral-400">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3.5 w-3.5 ${
                          star <= r.rating ? "fill-amber-400" : "stroke-neutral-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-neutral-700 leading-relaxed">{r.comment}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}