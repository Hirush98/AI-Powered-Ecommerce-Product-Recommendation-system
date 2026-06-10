import { Link } from 'react-router-dom';
import { useRecommendations, useRefreshRecommendations } from '@/hooks/useRecommendations';
import { useLogInteraction } from '@/hooks/useProducts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CATEGORY_EMOJI = {
  Fitness:'🏋️', Technology:'💻', Gaming:'🎮',
  Fashion:'👟', Cooking:'🍳', Outdoor:'🏕️',
};

function RecommendationCard({ product, reason, onInteraction }) {
  return (
    <div className="card-hover group flex flex-col gap-4">
      <Link
        to={`/products/${product._id}`}
        onClick={() => onInteraction(product._id, 'view', { source: 'recommendation' })}
        className="block"
      >
        <div className="w-full h-44 rounded-xl bg-gradient-to-br
                        from-primary-50 to-indigo-100
                        flex items-center justify-center text-5xl">
          {CATEGORY_EMOJI[product.category] || '📦'}
        </div>
      </Link>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <Link
            to={`/products/${product._id}`}
            onClick={() => onInteraction(product._id, 'view', { source: 'recommendation' })}
          >
            <h3 className="text-sm font-semibold text-slate-800 leading-snug
                           group-hover:text-primary-600 line-clamp-2 transition-colors">
              {product.name}
            </h3>
          </Link>
          <span className="text-base font-bold text-primary-600 shrink-0">
            ${product.price}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="text-amber-400">★</span>
          <span>{product.rating}</span>
          <span>·</span>
          <span className="badge-primary">{product.category}</span>
        </div>

        {/* AI reason */}
        <div className="bg-primary-50 border border-primary-100
                        rounded-lg px-3 py-2 mt-1">
          <p className="text-xs text-primary-700 leading-relaxed italic">
            ✦ {reason}
          </p>
        </div>

        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onInteraction(product._id, 'like', { source: 'recommendation' })}
            className="btn-ghost px-3 py-1.5 text-xs text-slate-400 hover:text-red-400"
          >
            ♥ Like
          </button>
          <Link
            to={`/products/${product._id}`}
            onClick={() => onInteraction(product._id, 'view', { source: 'recommendation' })}
            className="btn-primary flex-1 text-xs text-center"
          >
            View product
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { data, isLoading, isError } = useRecommendations();
  const { mutate: refresh, isPending: refreshing } = useRefreshRecommendations();
  const { mutate: logInteraction } = useLogInteraction();

  const handleInteraction = (productId, type, metadata = {}) => {
    logInteraction({ productId, interactionType: type, metadata });
  };

  return (
    <div className="page-container">
      <div className="page-header flex flex-col sm:flex-row
                      sm:items-start justify-between gap-4">
        <div>
          <h1 className="page-title">✦ Picked for you</h1>
          <p className="page-subtitle">
            AI-powered recommendations based on your behaviour
            {data?.cached && (
              <span className="ml-2 badge bg-green-100 text-green-600">
                cached
              </span>
            )}
            {data?.fallback && (
              <span className="ml-2 badge bg-amber-100 text-amber-600">
                top rated — keep browsing for personalised picks
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => refresh()}
          disabled={refreshing}
          className="btn-secondary shrink-0 flex items-center gap-2"
        >
          {refreshing ? (
            <><LoadingSpinner size="sm" /> Regenerating…</>
          ) : (
            '↻ Refresh picks'
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <LoadingSpinner size="xl" />
          <p className="text-sm text-slate-500 animate-pulse">
            Gemini AI is analysing your preferences…
          </p>
        </div>
      ) : isError ? (
        <div className="card text-center py-16">
          <p className="text-3xl mb-2">⚠️</p>
          <p className="text-sm text-slate-500 mb-4">
            Failed to load recommendations.
          </p>
          <button onClick={() => refresh()} className="btn-primary">
            Try again
          </button>
        </div>
      ) : !data?.data?.length ? (
        <div className="card text-center py-16 text-slate-400">
          <p className="text-3xl mb-2">🤖</p>
          <p className="text-sm mb-4">
            Browse and interact with products to get personalised picks.
          </p>
          <Link to="/products" className="btn-primary inline-flex">
            Start browsing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.data.map(({ product, reason }) => (
            <RecommendationCard
              key={product._id}
              product={product}
              reason={reason}
              onInteraction={handleInteraction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
