const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    interactionType: {
      type: String,
      enum: ['view', 'like', 'add_to_cart', 'remove_from_cart', 'purchase', 'search'],
      required: true,
    },
    // Properly typed metadata per interaction type
    metadata: {
      searchQuery: { type: String, default: null },   // for 'search'
      timeSpent:   { type: Number, default: null },   // seconds on product page
      source:      { type: String, default: null },   // 'homepage', 'search', 'recommendation'
    },
  },
  {
    timestamps: true, // createdAt = interaction timestamp
  }
);

// Index for recommendation engine queries
userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ productId: 1, interactionType: 1 });

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
