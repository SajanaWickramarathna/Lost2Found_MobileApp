const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d',
  });
};

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(20).toString('hex');

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'user',
      isVerified: false,
      verificationToken,
    });

    if (user) {
      // Create verification url
      const verifyUrl = `${process.env.FRONTEND_URL}/api/auth/verify/${verificationToken}`;

      const message = `You are receiving this email because you (or someone else) have requested the registration of an account.\n\nPlease click on the following link, or paste this into your browser to complete the process:\n\n${verifyUrl}`;
      const html = `<p>You are receiving this email because you registered an account.</p><p>Please click on the following link to complete the process:</p><a href="${verifyUrl}">${verifyUrl}</a>`;

      try {
        await sendEmail({
          email: user.email,
          subject: 'Account Verification - Lost2Found',
          message,
          html,
        });

        res.status(201).json({
          message: 'Registration successful! Please check your email to verify your account before logging in.',
        });
      } catch (err) {
        console.error('Email sending failed: ', err);
        // If email fails to send, we might want to delete the user or handle it
        user.verificationToken = undefined;
        await user.save({ validateBeforeSave: false });

        res.status(500).json({ message: 'Registration successful but email could not be sent. Please try again later.' });
      }
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/verify/:token
router.get('/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({
      verificationToken: req.params.token,
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).send(`
      <html>
        <body>
          <h2>Email Verified Successfully!</h2>
          <p>You can now return to the app and log in.</p>
        </body>
      </html>
    `);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(403).json({ 
        message: 'Account locked due to too many failed attempts. Try again in 15 minutes.' 
      });
    }

    // Check if user is verified
    if (!user.isVerified) {
      return res.status(403).json({ message: 'Please verify your email to log in' });
    }

    // Check password
    if (await user.matchPassword(password)) {
      // Successful login, reset attempts
      if (user.loginAttempts > 0) {
        user.loginAttempts = 0;
        user.lockUntil = undefined;
        await user.save();
      }

      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      // Failed login
      user.loginAttempts += 1;
      
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME_MS;
      }
      await user.save();

      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/auth/profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
