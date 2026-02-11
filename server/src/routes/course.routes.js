const express = require("express");
const Course = require("../models/Course");
const User = require("../models/User");
const { protect } = require("../middleware/auth");
const router = express.Router();

// @route   GET /api/courses
// @desc    Get all published courses
// @access  Public
router.get("/", async (req, res, next) => {
  try {
    const { category, difficulty, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = { isPublished: true };
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;

    const courses = await Course.find(filter)
      .populate("instructor", "name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select("-lessons.content -lessons.videoUrl");

    const total = await Course.countDocuments(filter);

    res.json({
      success: true,
      data: courses,
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

// @route   GET /api/courses/:id
// @desc    Get single course
// @access  Public
router.get("/:id", async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isPublished: true,
    }).populate("instructor", "name avatar reputation");

    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/courses/:id/enroll
// @desc    Enroll in a course
// @access  Private
router.post("/:id/enroll", protect, async (req, res, next) => {
  try {
    const course = await Course.findOne({
      _id: req.params.id,
      isPublished: true,
    });
    if (!course) {
      return res.status(404).json({
        success: false,
        error: "Course not found",
      });
    }

    // Enroll only if user is not already enrolled (single atomic update)
    const enrollResult = await User.updateOne(
      {
        _id: req.user._id,
        "enrolledCourses.course": { $ne: course._id },
      },
      {
        $push: { enrolledCourses: { course: course._id } },
      },
    );

    if (enrollResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: "Already enrolled in this course",
      });
    }

    // Update course enrolled count
    await Course.updateOne({ _id: course._id }, { $inc: { enrolledCount: 1 } });

    res.json({
      success: true,
      message: "Successfully enrolled in course",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
