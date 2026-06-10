import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/api/axios';
import useAuthStore from '@/store/authStore';
import { useRecommendations } from '@/hooks/useRecommendations';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// ── Small product card used only on homepage ──────────────────────────────────
function ProductCard({ product, reason }) {
  return (
    <Link
      to={`/products/${product._id}`}
      className="card-hover group flex flex-col gap-3"
    >
      {/* Image placeholder */}
      <div className="w-full h-36 rounded-lg bg-gradient-to-br
                      from-primary-50 to-primary-100
                      flex items-center justify-center text-3xl">
        {getCategoryEmoji(product.category)}
      </div>

      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-800 leading-snug
                         group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-primary-600 shrink-0">
            ${product.price}
          </span>
        </div>

        <div className="flex items-center gap-1 mt-1">
          <span className="text-amber-400 text-xs">★</span>
          <span className="text-xs text-slate-500">{product.rating}</span>
          <span className="text-xs text-slate-300 mx-1">·</span>
          <span className="badge-primary text-xs">{product.category}</span>
        </div>

        {reason && (
          <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2
                        italic border-l-2 border-primary-200 pl-2">
            {reason}
          </p>
        )}
      </div>
    </Link>
  );
}

function getCategoryEmoji(category) {
  const map = {
    Fitness:    '🏋️',
    Technology: '💻',
    Gaming:     '🎮',
    Fashion:    '👟',
    Cooking:    '🍳',
    Outdoor:    '🏕️',
  };
  return map[category] || '📦';
}

// ── Stat card for quick overview ──────────────────────────────────────────────
function StatCard({ label, value, sub }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuthStore();

  const { data: recData, isLoading: recLoading } = useRecommendations();

  const { data: purchaseData } = useQuery({
    queryKey: ['purchases', { limit: 3 }],
    queryFn:  async () => {
      const { data } = await api.get('/purchases', { params: { limit: 3 } });
      return data;
    },
  });

  const recommendations = recData?.data?.slice(0, 4) || [];
  const totalSpent = purchaseData?.data
    ?.reduce((sum, p) => sum + p.totalAmount, 0)
    .toFixed(2);

  return (
    <div className="page-container">

      {/* ── Welcome ──────────────────────────────────────────── */}
      <div className="page-header flex flex-col sm:flex-row
                      sm:items-center justify-between gap-4">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.firstName} 👋
          </h1>
          <p className="page-subtitle">
            Here's what we picked for you today
          </p>
        </div>
        <Link to="/recommendations" className="btn-primary shrink-0">
          View all recommendations
        </Link>
      </div>

      {/* ── Stats row ─────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total orders"
          value={purchaseData?.pagination?.total ?? '—'}
          sub="all time"
        />
        <StatCard
          label="Total spent"
          value={totalSpent ? `$${totalSpent}` : '—'}
          sub="across all orders"
        />
        <StatCard
          label="AI picks"
          value={recData?.count ?? '—'}
          sub={recData?.cached ? 'from cache' : 'freshly generated'}
        />
        <StatCard
          label="Your interests"
          value={user?.interests?.length ?? 0}
          sub="tracked preferences"
        />
      </div>

      {/* ── AI Recommendations preview ────────────────────────── */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">✦ Picked for you</h2>
          <Link to="/recommendations"
                className="text-sm text-primary-600 hover:underline font-medium">
            See all →
          </Link>
        </div>

        {recLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="card text-center py-10 text-slate-400">
            <p className="text-2xl mb-2">🤖</p>
            <p className="text-sm">
              Start browsing products to get personalised recommendations.
            </p>
            <Link to="/products" className="btn-primary mt-4 inline-flex">
              Browse products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map(({ product, reason }) => (
              <ProductCard
                key={product._id}
                product={product}
                reason={reason}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Recent orders ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="section-title mb-0">Recent orders</h2>
          <Link to="/purchases"
                className="text-sm text-primary-600 hover:underline font-medium">
            View all →
          </Link>
        </div>

        {!purchaseData?.data?.length ? (
          <div className="card text-center py-10 text-slate-400">
            <p className="text-sm">No orders yet.</p>
            <Link to="/products" className="btn-primary mt-4 inline-flex">
              Shop now
            </Link>
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 p-0 overflow-hidden">
            {purchaseData.data.map((purchase) => (
              <div key={purchase._id}
                   className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">
                    {getCategoryEmoji(purchase.productId?.category)}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-slate-800 line-clamp-1">
                      {purchase.productId?.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(purchase.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge ${
                    purchase.status === 'delivered' ? 'badge-success' :
                    purchase.status === 'shipped'   ? 'badge-primary' :
                    'badge-warning'
                  }`}>
                    {purchase.status}
                  </span>
                  <span className="text-sm font-semibold text-slate-700">
                    ${purchase.totalAmount}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
