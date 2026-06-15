const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['lost', 'found'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  images: [{
    type: String, // Path or URL to the image
  }],
  // GeoJSON for location
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    }
  },
  locationName: {
    type: String, // Formatted address from Nominatim
  },
  radius: {
    type: Number, // In kilometers, primarily used for 'lost' items to show search area
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'resolved'],
    default: 'active',
  }
}, { timestamps: true });

// Create a 2dsphere index for geospatial queries (e.g. finding nearby items)
itemSchema.index({ location: '2dsphere' });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
