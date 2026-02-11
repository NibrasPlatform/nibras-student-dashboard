const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get("/me", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .populate("achievements")
      .populate("enrolledCourses.course", "title thumbnail");

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/me
// @desc    Update user profile
// @access  Private
router.put("/me", protect, async (req, res, next) => {
  try {
    const { name, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, avatar },
      { new: true, runValidators: true },
    );

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (public profile)
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select("name avatar reputation achievements role")
      .populate("achievements");

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
