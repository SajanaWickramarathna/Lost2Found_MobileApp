const express = require('express');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes here require admin role
router.use(protect, authorize('admin'));

// @route   GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      await User.deleteOne({ _id: user._id });
      res.json({ message: 'User removed' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', async (req, res) => {
  try {
    const { durationDays } = req.body;
    const user = await User.findById(req.params.id);

    if (user) {
      const days = durationDays || 7;
      user.lockUntil = Date.now() + days * 24 * 60 * 60 * 1000;
      user.loginAttempts = 0; // reset attempts
      await user.save();
      res.json({ message: `User banned for ${days} days` });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.lockUntil = undefined;
      user.loginAttempts = 0;
      await user.save();
      res.json({ message: 'User unbanned' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ==========================================
// CATEGORY MANAGEMENT
// ==========================================

const Category = require('../models/Category');

// @route   POST /api/admin/categories
router.post('/categories', async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    
    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const category = await Category.create({ name, icon, description });
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/categories/:id
router.put('/categories/:id', async (req, res) => {
  try {
    const { name, icon, description } = req.body;
    const category = await Category.findById(req.params.id);

    if (category) {
      category.name = name || category.name;
      category.icon = icon || category.icon;
      category.description = description || category.description;

      const updatedCategory = await category.save();
      res.json(updatedCategory);
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/categories/:id
router.delete('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (category) {
      await Category.deleteOne({ _id: category._id });
      res.json({ message: 'Category removed' });
    } else {
      res.status(404).json({ message: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
