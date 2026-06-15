const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Item = require('../models/Item');
const { protect } = require('../middleware/auth');

// Setup multer for local storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images only!'));
  }
}

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});

// @route   POST /api/items
// @desc    Create a new item
// @access  Private
router.post('/', protect, upload.array('images', 10), async (req, res) => {
  try {
    const { type, title, description, category, latitude, longitude, locationName, radius } = req.body;
    
    const imagePaths = req.files ? req.files.map((file) => `/uploads/${file.filename}`) : [];

    const itemData = {
      user: req.user._id,
      type,
      title,
      description,
      category,
      images: imagePaths,
      location: {
        type: 'Point',
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      locationName,
      status: 'active',
    };

    if (type === 'lost' && radius) {
      itemData.radius = parseFloat(radius);
    }

    const item = await Item.create(itemData);
    
    // Emit real-time event to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('newItem', item);
    }

    res.status(201).json(item);
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/items
// @desc    Get items (with optional filters: type, category, status)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { type, category, status } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;
    if (status) filter.status = status;
    else filter.status = 'active';

    const items = await Item.find(filter).populate('category', 'name icon').populate('user', 'name').sort('-createdAt');
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/items/:id
// @desc    Get single item
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id).populate('category').populate('user', 'name email');
    if (item) {
      res.json(item);
    } else {
      res.status(404).json({ message: 'Item not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
