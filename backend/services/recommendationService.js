const { GoogleGenerativeAI } = require('@google/generative-ai');
const { Product, Customer, Purchase, UserInteraction } = require('../models/schemas');

class RecommendationService {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  // Get user's purchase history and interests
  async getUserProfile(customerId) {
    try {
      const customer = await Customer.findById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Get purchase history
      const purchases = await Purchase.find({ customerId })
        .populate('productId')
        .sort({ purchaseDate: -1 })
        .limit(20);

      // Get recent interactions (views, likes, cart additions)
      const interactions = await UserInteraction.find({ customerId })
        .populate('productId')
        .sort({ timestamp: -1 })
        .limit(50);

      // Analyze purchase patterns
      const purchasedCategories = {};
      const purchasedBrands = {};
      const priceRange = { min: Infinity, max: 0 };
      
      purchases.forEach(purchase => {
        const product = purchase.productId;
        purchasedCategories[product.category] = (purchasedCategories[product.category] || 0) + 1;
        purchasedBrands[product.brand] = (purchasedBrands[product.brand] || 0) + 1;
        priceRange.min = Math.min(priceRange.min, product.price);
        priceRange.max = Math.max(priceRange.max, product.price);
      });

      // Analyze interaction patterns
      const viewedCategories = {};
      const viewedBrands = {};
      
      interactions.forEach(interaction => {
        const product = interaction.productId;
        if (product) {
          viewedCategories[product.category] = (viewedCategories[product.category] || 0) + 1;
          viewedBrands[product.brand] = (viewedBrands[product.brand] || 0) + 1;
        }
      });

      return {
        customer,
        purchases,
        interactions,
        purchasedCategories,
        purchasedBrands,
        viewedCategories,
        viewedBrands,
        priceRange: priceRange.min === Infinity ? { min: 0, max: 1000 } : priceRange
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }
  }

  // Get product recommendations using Gemini AI
  async getRecommendations(customerId, limit = 10) {
    try {
      const userProfile = await this.getUserProfile(customerId);
      
      // Get all available products (excluding already purchased ones)
      const purchasedProductIds = userProfile.purchases.map(p => p.productId._id.toString());
      const availableProducts = await Product.find({
        _id: { $nin: purchasedProductIds },
        stock: { $gt: 0 }
      });

      // Prepare data for AI analysis
      const userContext = {
        customerInfo: {
          age: userProfile.customer.age,
          gender: userProfile.customer.gender,
          location: userProfile.customer.location,
          interests: userProfile.customer.interests
        },
        purchaseHistory: userProfile.purchases.map(p => ({
          productName: p.productId.name,
          category: p.productId.category,
          brand: p.productId.brand,
          price: p.price,
          rating: p.rating,
          purchaseDate: p.purchaseDate
        })),
        browsingBehavior: {
          topViewedCategories: Object.entries(userProfile.viewedCategories)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5),
          topViewedBrands: Object.entries(userProfile.viewedBrands)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
        },
        pricePreference: userProfile.priceRange
      };

      // Create AI prompt
      const prompt = `
        You are an AI recommendation system for an e-commerce platform. Analyze the following user profile and recommend the most suitable products from the available inventory.

        User Profile:
        ${JSON.stringify(userContext, null, 2)}

        Available Products (first 50 for context):
        ${JSON.stringify(availableProducts.slice(0, 50).map(p => ({
          id: p._id,
          name: p.name,
          category: p.category,
          brand: p.brand,
          price: p.price,
          rating: p.rating,
          tags: p.tags,
          features: p.features
        })), null, 2)}

        Please analyze this user's preferences and behavior patterns, then provide recommendations. Consider:
        1. Category preferences (both purchased and browsed)
        2. Brand loyalty patterns
        3. Price range preferences
        4. Age and demographic factors
        5. Product ratings and reviews
        6. Seasonal/trending factors

        Respond with a JSON array of recommended product IDs in order of relevance (most relevant first). 
        Include exactly ${limit} recommendations and provide a brief explanation for each recommendation.

        Format your response as:
        {
          "recommendations": [
            {
              "productId": "product_id_here",
              "reason": "Brief explanation why this product is recommended",
              "relevanceScore": 0.95
            }
          ]
        }
      `;

      // Get AI recommendations
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      // Parse AI response
      let aiRecommendations;
      try {
        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiRecommendations = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in AI response');
        }
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to rule-based recommendations
        return this.getFallbackRecommendations(userProfile, availableProducts, limit);
      }

      // Get full product details for recommended products
      const recommendedProductIds = aiRecommendations.recommendations.map(r => r.productId);
      const recommendedProducts = await Product.find({
        _id: { $in: recommendedProductIds }
      });

      // Match products with AI reasoning
      const finalRecommendations = aiRecommendations.recommendations.map(aiRec => {
        const product = recommendedProducts.find(p => p._id.toString() === aiRec.productId);
        return {
          product,
          reason: aiRec.reason,
          relevanceScore: aiRec.relevanceScore || 0.5,
          aiGenerated: true
        };
      }).filter(rec => rec.product); // Remove any products not found

      return {
        recommendations: finalRecommendations,
        userProfile: {
          customerInfo: userProfile.customer,
          totalPurchases: userProfile.purchases.length,
          favoriteCategories: Object.keys(userProfile.purchasedCategories),
          priceRange: userProfile.priceRange
        }
      };

    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      
      // Fallback to rule-based recommendations
      const userProfile = await this.getUserProfile(customerId);
      const purchasedProductIds = userProfile.purchases.map(p => p.productId._id.toString());
      const availableProducts = await Product.find({
        _id: { $nin: purchasedProductIds },
        stock: { $gt: 0 }
      });
      
      return this.getFallbackRecommendations(userProfile, availableProducts, limit);
    }
  }

  // Fallback rule-based recommendations
  getFallbackRecommendations(userProfile, availableProducts, limit = 10) {
    const recommendations = [];
    
    // Rule 1: Recommend products from favorite categories
    const favoriteCategories = Object.keys(userProfile.purchasedCategories)
      .concat(userProfile.customer.interests)
      .concat(Object.keys(userProfile.viewedCategories));
    
    const categoryProducts = availableProducts.filter(p => 
      favoriteCategories.includes(p.category)
    ).sort((a, b) => b.rating - a.rating);
    
    // Rule 2: Consider price range
    const priceFilteredProducts = categoryProducts.filter(p => 
      p.price >= userProfile.priceRange.min * 0.5 && 
      p.price <= userProfile.priceRange.max * 2
    );
    
    // Rule 3: High-rated products
    const finalProducts = priceFilteredProducts.length > 0 ? priceFilteredProducts : 
      availableProducts.sort((a, b) => b.rating - a.rating);
    
    // Select top products
    const selectedProducts = finalProducts.slice(0, limit);
    
    selectedProducts.forEach((product, index) => {
      recommendations.push({
        product,
        reason: `Recommended based on your interest in ${product.category} and high rating (${product.rating}/5)`,
        relevanceScore: Math.max(0.1, 1 - (index * 0.1)),
        aiGenerated: false
      });
    });

    return {
      recommendations,
      userProfile: {
        customerInfo: userProfile.customer,
        totalPurchases: userProfile.purchases.length,
        favoriteCategories: Object.keys(userProfile.purchasedCategories),
        priceRange: userProfile.priceRange
      }
    };
  }

  // Get trending products for homepage
  async getTrendingProducts(limit = 20) {
    try {
      // Get products with high ratings and recent purchases
      const trendingProducts = await Product.aggregate([
        {
          $lookup: {
            from: 'purchases',
            localField: '_id',
            foreignField: 'productId',
            as: 'recentPurchases'
          }
        },
        {
          $addFields: {
            recentPurchaseCount: {
              $size: {
                $filter: {
                  input: '$recentPurchases',
                  cond: {
                    $gte: ['$$this.purchaseDate', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
                  }
                }
              }
            },
            trendingScore: {
              $add: [
                { $multiply: ['$rating', 0.4] },
                { $multiply: ['$reviews', 0.0001] },
                { $multiply: [{ $size: '$recentPurchases' }, 0.3] }
              ]
            }
          }
        },
        {
          $match: { stock: { $gt: 0 } }
        },
        {
          $sort: { trendingScore: -1 }
        },
        {
          $limit: limit
        }
      ]);

      return trendingProducts;
    } catch (error) {
      console.error('Error getting trending products:', error);
      // Fallback to highest rated products
      return await Product.find({ stock: { $gt: 0 } })
        .sort({ rating: -1, reviews: -1 })
        .limit(limit);
    }
  }

  // Get personalized homepage recommendations
  async getHomepageRecommendations(customerId = null) {
    try {
      const result = {
        trending: await this.getTrendingProducts(10),
        categories: await this.getCategoryHighlights(),
        newArrivals: await this.getNewArrivals(8)
      };

      if (customerId) {
        const personalizedRecs = await this.getRecommendations(customerId, 8);
        result.personalizedForYou = personalizedRecs.recommendations;
        result.userProfile = personalizedRecs.userProfile;
      }

      return result;
    } catch (error) {
      console.error('Error getting homepage recommendations:', error);
      throw error;
    }
  }

  // Get category highlights
  async getCategoryHighlights() {
    try {
      const categories = await Product.distinct('category');
      const highlights = {};

      for (const category of categories) {
        const topProduct = await Product.findOne({ 
          category, 
          stock: { $gt: 0 } 
        }).sort({ rating: -1, reviews: -1 });
        
        if (topProduct) {
          highlights[category] = topProduct;
        }
      }

      return highlights;
    } catch (error) {
      console.error('Error getting category highlights:', error);
      return {};
    }
  }

  // Get new arrivals
  async getNewArrivals(limit = 10) {
    try {
      return await Product.find({ stock: { $gt: 0 } })
        .sort({ createdAt: -1 })
        .limit(limit);
    } catch (error) {
      console.error('Error getting new arrivals:', error);
      return [];
    }
  }
}

module.exports = RecommendationService;
