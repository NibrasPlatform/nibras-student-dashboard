const express = require("express");
const Achievement = require("../models/Achievement");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/achievements
// @desc    Get all achievements
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { category, rarity } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (rarity) filter.rarity = rarity;

    const achievements = await Achievement.find(filter).sort({ points: -1 });

    res.json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/achievements/my
// @desc    Get user's achievements
// @access  Private
router.get("/my", protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate("achievements");

    const allAchievements = await Achievement.find();

    // Map achievements with unlock status
    const achievementsWithStatus = allAchievements.map((ach) => {
      const isUnlocked = user.achievements.some(
        (userAch) => userAch._id.toString() === ach._id.toString(),
      );
      return {
        ...ach.toObject(),
        unlocked: isUnlocked,
      };
    });

    res.json({
      success: true,
      data: {
        earned: user.achievements.length,
        total: allAchievements.length,
        achievements: achievementsWithStatus,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/achievements/seed
// @desc    Seed default achievements (admin only)
// @access  Private
router.post("/seed", protect, authorize("admin"), async (req, res, next) => {
  try {
    const defaultAchievements = [
      {
        name: "First Steps",
        description: "Complete your first lesson",
        icon: "fa-shoe-prints",
        category: "course",
        points: 10,
        rarity: "common",
      },
      {
        name: "Scholar",
        description: "Complete 5 courses",
        icon: "fa-graduation-cap",
        category: "course",
        points: 50,
        requirement: 5,
        rarity: "uncommon",
      },
      {
        name: "Speed Demon",
        description: "Complete a course in one day",
        icon: "fa-bolt",
        category: "course",
        points: 30,
        rarity: "rare",
      },
      {
        name: "Top 10",
        description: "Reach top 10 on leaderboard",
        icon: "fa-ranking-star",
        category: "competition",
        points: 100,
        rarity: "epic",
      },
      {
        name: "Champion",
        description: "Win a competition",
        icon: "fa-trophy",
        category: "competition",
        points: 150,
        rarity: "legendary",
      },
      {
        name: "Helpful",
        description: "Answer 10 community questions",
        icon: "fa-hands-helping",
        category: "community",
        points: 40,
        requirement: 10,
        rarity: "uncommon",
      },
      {
        name: "Streak Master",
        description: "Maintain a 30-day streak",
        icon: "fa-fire",
        category: "streak",
        points: 75,
        requirement: 30,
        rarity: "rare",
      },
      {
        name: "Night Owl",
        description: "Study after midnight",
        icon: "fa-moon",
        category: "special",
        points: 15,
        rarity: "common",
      },
      {
        name: "Early Bird",
        description: "Study before 6 AM",
        icon: "fa-sun",
        category: "special",
        points: 15,
        rarity: "common",
      },
      {
        name: "Perfectionist",
        description: "Score 100% on any quiz",
        icon: "fa-star",
        category: "course",
        points: 25,
        rarity: "uncommon",
      },
    ];

    await Achievement.deleteMany({});
    await Achievement.insertMany(defaultAchievements);

    res.json({
      success: true,
      message: "Achievements seeded successfully",
      count: defaultAchievements.length,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
