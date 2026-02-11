const express = require("express");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/leaderboard
// @desc    Get leaderboard with filters
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { filter = "overall", page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortField = "reputation";

    // Different sorting based on filter
    switch (filter) {
      case "weekly":
        sortField = "weeklyPoints";
        break;
      case "achievements":
        // Will sort by achievements count
        break;
      default:
        sortField = "reputation";
    }

    let users;

    if (filter === "achievements") {
      // Aggregate to count achievements
      users = await User.aggregate([
        {
          $project: {
            name: 1,
            avatar: 1,
            reputation: 1,
            role: 1,
            achievementCount: { $size: { $ifNull: ["$achievements", []] } },
          },
        },
        { $sort: { achievementCount: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) },
      ]);
    } else {
      users = await User.find()
        .sort({ [sortField]: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .select("name avatar reputation weeklyPoints role achievements");
    }

    // Get total count
    const total = await User.countDocuments();

    // Add rank to each user
    const rankedUsers = users.map((user, index) => ({
      rank: skip + index + 1,
      ...(user.toObject ? user.toObject() : user),
    }));

    res.json({
      success: true,
      data: rankedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/leaderboard/my-rank
// @desc    Get current user's rank
// @access  Private
router.get("/my-rank", protect, async (req, res, next) => {
  try {
    const userReputation = req.user.reputation;

    // Count users with higher reputation
    const higherCount = await User.countDocuments({
      reputation: { $gt: userReputation },
    });

    const rank = higherCount + 1;
    const total = await User.countDocuments();

    res.json({
      success: true,
      data: {
        rank,
        total,
        percentile: Math.round(((total - rank) / total) * 100),
        reputation: userReputation,
        weeklyPoints: req.user.weeklyPoints,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
