import { useState } from 'react';
import { usePurchases, useSubmitReview } from '@/hooks/usePurchases';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CATEGORY_EMOJI = {
  Fitness:'🏋️', Technology:'💻', Gaming:'🎮',
  Fashion:'👟', Cooking:'🍳', Outdoor:'🏕️',
};

const STATUS_BADGE = {
  pending:   'badge-warning',
  confirmed: 'badge-primary',
  shipped:   'badge-primary',
  delivered: 'badge-success',
  cancelled: 'badge-danger',
};

function ReviewModal({ purchase, onClose }) {
  const [rating, setRating]   = useState(0);
  const [review, setReview]   = useState('');
  const [hovered, setHovered] = useState(0);
  const { mutate: submit, isPending, isSuccess } = useSubmitReview();

  const handleSubmit = () => {
    submit(
      { purchaseId: purchase._id, rating, review },
      { onSuccess: () => setTimeout(onClose, 800) }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black/40 backdrop-blur-sm px-4"
         onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6"
           onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-slate-800 mb-1">Leave a review</h2>
        <p className="text-sm text-slate-500 mb-5 line-clamp-1">
          {purchase.productId?.name}
        </p>

        {/* Star rating */}
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="text-3xl transition-transform hover:scale-110"
            >
              <span className={star <= (hovered || rating)
                ? 'text-amber-400' : 'text-slate-200'}>
                ★
              </span>
            </button>
          ))}
        </div>

        <textarea
          className="input resize-none h-28"
          placeholder="Share your experience (optional)…"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={1000}
        />
        <p className="text-xs text-slate-400 text-right mt-1">
          {review.length}/1000
        </p>

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || isPending || isSuccess}
            className="btn-primary flex-1"
          >
            {isSuccess ? 'Submitted!' : isPending ? 'Submitting…' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PurchasesPage() {
  const [page, setPage]             = useState(1);
  const [reviewTarget, setReview]   = useState(null);
  const { data, isLoading }         = usePurchases({ page, limit: 10 });

  const purchases  = data?.data || [];
  const pagination = data?.pagination;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">My Orders</h1>
        <p className="page-subtitle">
          {pagination?.total ?? '…'} total orders
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="lg" />
        </div>
      ) : purchases.length === 0 ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-3xl mb-2">🛍️</p>
          <p className="text-sm">No orders yet.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {purchases.map((purchase) => (
              <div key={purchase._id} className="card flex flex-col sm:flex-row
                                                 items-start sm:items-center
                                                 gap-4 p-5">
                {/* Emoji */}
                <div className="text-4xl shrink-0">
                  {CATEGORY_EMOJI[purchase.productId?.category] || '📦'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 text-sm
                                 truncate max-w-xs">
                    {purchase.productId?.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                    <span className="text-xs text-slate-400">
                      {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                        year:'numeric', month:'short', day:'numeric'
                      })}
                    </span>
                    <span className="text-xs text-slate-400">
                      Qty: {purchase.quantity}
                    </span>
                    <span className={`badge ${STATUS_BADGE[purchase.status] || 'badge-warning'}`}>
                      {purchase.status}
                    </span>
                  </div>

                  {/* Existing review */}
                  {purchase.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      {[1,2,3,4,5].map((s) => (
                        <span key={s}
                              className={`text-sm ${s <= purchase.rating
                                ? 'text-amber-400' : 'text-slate-200'}`}>
                          ★
                        </span>
                      ))}
                      {purchase.review && (
                        <span className="text-xs text-slate-500 ml-1 italic line-clamp-1">
                          "{purchase.review}"
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Right side */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="text-base font-bold text-slate-800">
                    ${purchase.totalAmount.toFixed(2)}
                  </span>
                  {purchase.status === 'delivered' && !purchase.rating && (
                    <button
                      onClick={() => setReview(purchase)}
                      className="btn-secondary text-xs px-3 py-1.5"
                    >
                      ★ Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pagination?.pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="btn-secondary px-4"
              >
                ← Prev
              </button>
              <span className="text-sm text-slate-500">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="btn-secondary px-4"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          purchase={reviewTarget}
          onClose={() => setReview(null)}
        />
      )}
    </div>
  );
}
