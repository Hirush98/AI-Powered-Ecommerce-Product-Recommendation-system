const { GoogleGenerativeAI } = require('@google/generative-ai');
const Purchase        = require('../models/Purchase');
const UserInteraction = require('../models/UserInteraction');
const Product         = require('../models/Product');
const { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } = require('../utils/cache');

// ─── Gemini client ────────────────────────────────────────────────────────────
let genAI  = null;
let model  = null;

const getModel = () => {
  if (!model) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
  }
  return model;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build a compact user context object from DB.
 * Solves V1's N+1 problem — single aggregation per data type.
 */
const buildUserContext = async (userId) => {
  // Run all DB queries in parallel
  const [purchases, interactions] = await Promise.all([
    Purchase.find({ userId })
      .populate('productId', 'name category brand price tags')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),

    UserInteraction.find({ userId })
      .populate('productId', 'name category brand tags')
      .sort({ createdAt: -1 })
      .limit(50)
      .lean(),
  ]);

  // Aggregate category preferences from interactions + purchases
  const categoryScore = {};

  purchases.forEach(({ productId: p, quantity = 1 }) => {
    if (!p?.category) return;
    categoryScore[p.category] = (categoryScore[p.category] || 0) + quantity * 3; // purchases weight 3x
  });

  interactions.forEach(({ productId: p, interactionType }) => {
    if (!p?.category) return;
    const weight = interactionType === 'like'
      ? 2
      : interactionType === 'add_to_cart'
      ? 2
      : interactionType === 'view'
      ? 1
      : 0;
    categoryScore[p.category] = (categoryScore[p.category] || 0) + weight;
  });

  // Top 5 categories by score
  const topCategories = Object.entries(categoryScore)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  // Recently interacted product IDs (to exclude from recommendations)
  const recentProductIds = new Set([
    ...purchases.map((p) => p.productId?._id?.toString()).filter(Boolean),
    ...interactions.map((i) => i.productId?._id?.toString()).filter(Boolean),
  ]);

  // Liked / carted products
  const likedProducts = interactions
    .filter((i) => ['like', 'add_to_cart'].includes(i.interactionType) && i.productId)
    .map((i) => ({ name: i.productId.name, category: i.productId.category }))
    .slice(0, 10);

  // Purchase summary
  const purchaseSummary = purchases
    .filter((p) => p.productId)
    .map((p) => ({ name: p.productId.name, category: p.productId.category, brand: p.productId.brand }))
    .slice(0, 10);

  return { topCategories, recentProductIds, likedProducts, purchaseSummary };
};

/**
 * Fetch candidate products smartly — only from user's top categories.
 * Fixes V1's approach of sending all 50 products to Gemini.
 */
const fetchCandidateProducts = async (topCategories, recentProductIds, limit = 30) => {
  const filter = { isActive: true };

  // Prioritise top categories if we have them
  if (topCategories.length > 0) {
    filter.category = { $in: topCategories };
  }

  // Exclude recently seen products
  if (recentProductIds.size > 0) {
    filter._id = { $nin: [...recentProductIds] };
  }

  let products = await Product.find(filter)
    .sort({ rating: -1 })
    .limit(limit)
    .lean();

  // If not enough results, backfill with top-rated products from any category
  if (products.length < 10) {
    const backfillFilter = {
      isActive: true,
      _id: { $nin: [...recentProductIds, ...products.map((p) => p._id)] },
    };

    const backfill = await Product.find(backfillFilter)
      .sort({ rating: -1 })
      .limit(limit - products.length)
      .lean();

    products = [...products, ...backfill];
  }

  return products;
};

/**
 * Build a lean prompt — only essential fields sent to Gemini.
 * Fixes V1's raw JSON dump of full product objects.
 */
const buildPrompt = (userContext, products, userProfile) => {
  const productList = products.map((p) => ({
    id:       p._id.toString(),
    name:     p.name,
    category: p.category,
    brand:    p.brand,
    price:    p.price,
    rating:   p.rating,
    tags:     p.tags?.slice(0, 5) || [],
  }));

  return `
You are an expert e-commerce recommendation engine.

USER PROFILE:
- Name: ${userProfile.firstName} ${userProfile.lastName}
- Age: ${userProfile.age || 'unknown'}
- Location: ${userProfile.location || 'unknown'}
- Interests: ${userProfile.interests?.join(', ') || 'none listed'}

SHOPPING BEHAVIOUR:
- Top categories: ${userContext.topCategories.join(', ') || 'none yet'}
- Recent purchases: ${JSON.stringify(userContext.purchaseSummary)}
- Liked / carted: ${JSON.stringify(userContext.likedProducts)}

AVAILABLE PRODUCTS (candidates only):
${JSON.stringify(productList)}

TASK:
Select exactly 6 products from the list above that this user would most likely enjoy.
For each, write a short 1-sentence personalised reason.

RESPOND WITH VALID JSON ONLY — no markdown, no explanation, no extra text:
{
  "recommendations": [
    {
      "productId": "<id from the list>",
      "reason": "<personalised reason>"
    }
  ]
}
`.trim();
};

// ─── Main exported function ───────────────────────────────────────────────────

/**
 * Get AI-powered recommendations for a user.
 * Checks Redis cache first — only calls Gemini on cache miss.
 *
 * @param {Object} userProfile  — User mongoose document
 * @param {boolean} forceRefresh — Skip cache and re-generate
 */
const getRecommendations = async (userProfile, forceRefresh = false) => {
  const userId   = userProfile._id.toString();
  const cacheKey = CacheKeys.recommendations(userId);

  // ── 1. Cache check ──────────────────────────────────────────────────────────
  if (!forceRefresh) {
    const cached = await cacheGet(cacheKey);
    if (cached) {
      const parsed = typeof cached === 'string' ? JSON.parse(cached) : cached;
      return { ...parsed, cached: true };
    }
  }

  // ── 2. Build user context (parallel DB queries) ──────────────────────────
  const userContext = await buildUserContext(userId);

  // ── 3. Fetch smart candidate products ────────────────────────────────────
  const candidates = await fetchCandidateProducts(
    userContext.topCategories,
    userContext.recentProductIds
  );

  if (candidates.length === 0) {
    // New user — return top rated products as fallback
    const fallback = await Product.find({ isActive: true })
      .sort({ rating: -1 })
      .limit(6)
      .lean();

    return {
      recommendations: fallback.map((p) => ({
        product: p,
        reason: 'Highly rated product — explore what others love.',
      })),
      cached: false,
      fallback: true,
    };
  }

  // ── 4. Call Gemini ────────────────────────────────────────────────────────
  const prompt = buildPrompt(userContext, candidates, userProfile);
  const aiModel = getModel();

  let parsedAI;
  try {
    const result   = await aiModel.generateContent(prompt);
    const rawText  = result.response.text().trim();

    // Strip markdown code fences if Gemini wraps in ```json
    const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsedAI = JSON.parse(clean);
  } catch (error) {
    console.error('Gemini response parse error:', error.message);
    throw new Error('AI service returned an unexpected response. Please try again.');
  }

  // ── 5. Hydrate product data from DB (trust our DB, not AI output) ─────────
  const productMap = new Map(candidates.map((p) => [p._id.toString(), p]));

  const recommendations = parsedAI.recommendations
    .filter((r) => productMap.has(r.productId))  // discard hallucinated IDs
    .map((r) => ({
      product: productMap.get(r.productId),
      reason:  r.reason,
    }))
    .slice(0, 6);

  const result = { recommendations, cached: false, fallback: false };

  // ── 6. Cache the result ───────────────────────────────────────────────────
  await cacheSet(cacheKey, result, TTL.RECOMMENDATIONS);

  return result;
};

/**
 * Invalidate a user's recommendation cache.
 * Call this after a new purchase or significant interaction.
 */
const invalidateUserRecommendations = async (userId) => {
  await cacheDel(CacheKeys.recommendations(userId.toString()));
};

module.exports = { getRecommendations, invalidateUserRecommendations };

