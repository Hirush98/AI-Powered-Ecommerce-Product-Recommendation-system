import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useProducts, useCategories, useLogInteraction } from '@/hooks/useProducts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ProductCard({ product, onInteraction }) {
  const getCategoryEmoji = (cat) => {
    const map = { Fitness:'🏋️', Technology:'💻', Gaming:'🎮',
                  Fashion:'👟', Cooking:'🍳', Outdoor:'🏕️' };
    return map[cat] || '📦';
  };

  return (
    <div className="card-hover flex flex-col gap-3 group">
      {/* Image area */}
      <Link
        to={`/products/${product._id}`}
        onClick={() => onInteraction(product._id, 'view', { source: 'category' })}
        className="block"
      >
        <div className="w-full h-40 rounded-lg bg-gradient-to-br
                        from-primary-50 to-primary-100
                        flex items-center justify-center text-4xl">
          {getCategoryEmoji(product.category)}
        </div>
      </Link>

      <div className="flex-1 flex flex-col gap-2">
        <Link
          to={`/products/${product._id}`}
          onClick={() => onInteraction(product._id, 'view', { source: 'category' })}
        >
          <h3 className="text-sm font-semibold text-slate-800 leading-snug
                         group-hover:text-primary-600 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="text-amber-400">★</span>
          <span>{product.rating}</span>
          <span className="text-slate-300">·</span>
          <span>{product.reviews} reviews</span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="badge-primary">{product.category}</span>
          <span className="text-xs text-slate-400">{product.brand}</span>
        </div>

        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-base font-bold text-primary-600">
            ${product.price}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onInteraction(product._id, 'like', { source: 'category' })}
              className="btn-ghost p-2 text-slate-400 hover:text-red-400"
              title="Like"
            >
              ♥
            </button>
            <button
              onClick={() => onInteraction(product._id, 'add_to_cart', { source: 'category' })}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              + Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [filters, setFilters] = useState({
    category: '', search: '', minPrice: '',
    maxPrice: '', sort: '', page: 1,
  });

  const [searchInput, setSearchInput] = useState('');

  const { data: categories } = useCategories();
  const { data, isLoading, isFetching } = useProducts({
    ...filters,
    limit: 12,
  });

  const { mutate: logInteraction } = useLogInteraction();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchInput, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleInteraction = (productId, type, metadata = {}) => {
    logInteraction({ productId, interactionType: type, metadata });
  };

  const products    = data?.data || [];
  const pagination  = data?.pagination;

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Products</h1>
        <p className="page-subtitle">
          {pagination?.total ?? '…'} products available
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">

        {/* ── Sidebar filters ───────────────────────────────────── */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="card flex flex-col gap-5 sticky top-24">

            {/* Search */}
            <div>
              <label className="label">Search</label>
              <input
                type="text"
                className="input"
                placeholder="Search products…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>

            {/* Category */}
            <div>
              <label className="label">Category</label>
              <select
                className="input"
                value={filters.category}
                onChange={(e) => handleFilter('category', e.target.value)}
              >
                <option value="">All categories</option>
                {categories?.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Price range */}
            <div>
              <label className="label">Price range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number" placeholder="Min" min="0"
                  className="input"
                  value={filters.minPrice}
                  onChange={(e) => handleFilter('minPrice', e.target.value)}
                />
                <span className="text-slate-400 text-sm">–</span>
                <input
                  type="number" placeholder="Max" min="0"
                  className="input"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilter('maxPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Sort */}
            <div>
              <label className="label">Sort by</label>
              <select
                className="input"
                value={filters.sort}
                onChange={(e) => handleFilter('sort', e.target.value)}
              >
                <option value="">Newest</option>
                <option value="price_asc">Price: Low → High</option>
                <option value="price_desc">Price: High → Low</option>
                <option value="rating">Top rated</option>
              </select>
            </div>

            {/* Reset */}
            <button
              className="btn-secondary w-full text-sm"
              onClick={() => {
                setFilters({ category:'', search:'', minPrice:'',
                             maxPrice:'', sort:'', page: 1 });
                setSearchInput('');
              }}
            >
              Reset filters
            </button>
          </div>
        </aside>

        {/* ── Product grid ──────────────────────────────────────── */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner size="lg" />
            </div>
          ) : products.length === 0 ? (
            <div className="card text-center py-16 text-slate-400">
              <p className="text-3xl mb-2">🔍</p>
              <p className="text-sm">No products match your filters.</p>
              <button
                onClick={() => setFilters({ category:'', search:'',
                              minPrice:'', maxPrice:'', sort:'', page:1 })}
                className="btn-secondary mt-4"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              {/* Loading overlay on filter change */}
              <div className={`relative ${isFetching ? 'opacity-60 pointer-events-none' : ''}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {products.map((product) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      onInteraction={handleInteraction}
                    />
                  ))}
                </div>
              </div>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    disabled={filters.page <= 1}
                    onClick={() => handleFilter('page', filters.page - 1)}
                    className="btn-secondary px-4"
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-slate-500">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    disabled={filters.page >= pagination.pages}
                    onClick={() => handleFilter('page', filters.page + 1)}
                    className="btn-secondary px-4"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
