const express = require('express');
const router = express.Router();
const User = require('../models/user');

console.log('User routes loaded');

// Sync user with Clerk data
router.post('/sync-user', async (req, res) => {
  console.log('Sync user route hit:', req.body);
  try {
    const { clerkId, email, name, profileImage } = req.body;
    
    if (!clerkId || !email || !name) {
      return res.status(400).json({ error: 'Missing required user data' });
    }

    // Find existing user or create new one
    let user = await User.findOne({ clerkId });
    
    if (user) {
      // Update existing user
      user.email = email;
      user.name = name;
      user.profileImage = profileImage;
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user
      user = new User({
        clerkId,
        email,
        name,
        profileImage,
        lastLogin: new Date()
      });
      await user.save();
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        totalQuizzes: user.totalQuizzes,
        averageScore: user.averageScore
      }
    });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ error: 'Failed to sync user data' });
  }
});

// Get user profile
router.get('/profile/:clerkId', async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.params.clerkId });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      name: user.name,
      profileImage: user.profileImage,
      totalQuizzes: user.totalQuizzes,
      averageScore: user.averageScore,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
});

module.exports = router;