import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useProduct, useLogInteraction, usePurchase } from '@/hooks/useProducts';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const CATEGORY_EMOJI = {
  Fitness:'🏋️', Technology:'💻', Gaming:'🎮',
  Fashion:'👟', Cooking:'🍳', Outdoor:'🏕️',
};

export default function ProductDetailPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { data: product, isLoading, isError } = useProduct(id);
  const { mutate: logInteraction } = useLogInteraction();
  const { mutate: purchase, isPending: purchasing, isSuccess } = usePurchase();

  const [quantity,    setQuantity]    = useState(1);
  const [feedback,    setFeedback]    = useState('');
  const [liked,       setLiked]       = useState(false);
  const [inCart,      setInCart]      = useState(false);

  // Log view interaction once product loads
  useEffect(() => {
    if (product) {
      logInteraction({
        productId:       product._id,
        interactionType: 'view',
        metadata:        { source: 'direct', timeSpent: 0 },
      });
    }
  }, [product?._id]);

  const handleLike = () => {
    setLiked((v) => !v);
    logInteraction({
      productId:       product._id,
      interactionType: liked ? 'view' : 'like',
      metadata:        { source: 'direct' },
    });
  };

  const handleAddToCart = () => {
    setInCart(true);
    logInteraction({
      productId:       product._id,
      interactionType: 'add_to_cart',
      metadata:        { source: 'direct' },
    });
    setFeedback('Added to cart!');
    setTimeout(() => setFeedback(''), 2000);
  };

  const handlePurchase = () => {
    purchase(
      { productId: product._id, quantity },
      {
        onSuccess: () => {
          setFeedback('Order placed successfully! 🎉');
          setTimeout(() => navigate('/purchases'), 1500);
        },
        onError: (err) => {
          setFeedback(err.response?.data?.message || 'Purchase failed.');
        },
      }
    );
  };

  if (isLoading) return <div className="flex justify-center py-32"><LoadingSpinner size="xl" /></div>;
  if (isError || !product) return (
    <div className="page-container text-center py-20 text-slate-400">
      <p className="text-3xl mb-2">😕</p>
      <p>Product not found.</p>
      <button onClick={() => navigate('/products')} className="btn-primary mt-4">
        Back to products
      </button>
    </div>
  );

  const inStock = product.stock > 0;

  return (
    <div className="page-container max-w-5xl">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="btn-ghost mb-6 text-sm text-slate-500"
      >
        ← Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* ── Image ─────────────────────────────────────────────── */}
        <div className="w-full aspect-square rounded-2xl bg-gradient-to-br
                        from-primary-50 to-primary-100
                        flex items-center justify-center text-8xl">
          {CATEGORY_EMOJI[product.category] || '📦'}
        </div>

        {/* ── Details ───────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="badge-primary">{product.category}</span>
              <span className="text-xs text-slate-400">{product.brand}</span>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 leading-snug">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 mt-2">
              <span className="text-amber-400">★</span>
              <span className="text-sm font-medium text-slate-700">{product.rating}</span>
              <span className="text-slate-300">·</span>
              <span className="text-sm text-slate-500">{product.reviews} reviews</span>
            </div>
          </div>

          <p className="text-3xl font-bold text-primary-600">
            ${product.price}
          </p>

          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description}
          </p>

          {/* Features */}
          {product.features?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Key features
              </p>
              <ul className="space-y-1">
                {product.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="text-primary-400 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Tags */}
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span key={tag} className="badge bg-slate-100 text-slate-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="divider" />

          {/* Stock */}
          <p className={`text-sm font-medium ${inStock ? 'text-green-600' : 'text-red-500'}`}>
            {inStock ? `✓ In stock (${product.stock} left)` : '✗ Out of stock'}
          </p>

          {/* Quantity */}
          {inStock && (
            <div className="flex items-center gap-3">
              <label className="label mb-0">Qty</label>
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-surface-100"
                >−</button>
                <span className="px-4 py-2 text-sm font-medium border-x border-slate-200">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-surface-100"
                >+</button>
              </div>
              <span className="text-sm text-slate-500">
                = ${(product.price * quantity).toFixed(2)}
              </span>
            </div>
          )}

          {/* Feedback message */}
          {feedback && (
            <div className={`text-sm px-4 py-2 rounded-lg font-medium
              ${feedback.includes('failed') || feedback.includes('Out')
                ? 'bg-red-50 text-red-600'
                : 'bg-green-50 text-green-600'
              }`}>
              {feedback}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleLike}
              className={`btn-secondary px-4 ${liked ? 'text-red-500 border-red-200' : ''}`}
            >
              {liked ? '♥ Liked' : '♡ Like'}
            </button>
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="btn-secondary flex-1"
            >
              {inCart ? '✓ In cart' : '+ Add to cart'}
            </button>
            <button
              onClick={handlePurchase}
              disabled={!inStock || purchasing || isSuccess}
              className="btn-primary flex-1"
            >
              {purchasing ? 'Placing…' : isSuccess ? 'Ordered!' : 'Buy now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
