const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"), false);
    }
  },
}).single("image");


const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ message: err.message });
  } else if (err) {
    return res.status(400).json({ message: err.message });
  }
  next();
};

const Post = require("../models/post.model");

router.post("/uploads", upload, handleMulterError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const newImage = new Post({
      filename: `${Date.now()}_${req.file.originalname}`,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      data: req.file.buffer,
      uploadDate: new Date(),
    });

    await newImage.save();
    res.status(201).json({
      msg: "New image uploaded...!",
      imageId: newImage._id,
      filename: newImage.filename,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(409).json({ message: error.message });
  }
});

router.get("/image/:id", async (req, res) => {
  try {
    const image = await Post.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set({
      "Content-Type": image.mimetype,
      "Content-Length": image.data.length,
    });

    res.send(image.data);
  } catch (error) {
    console.error("Image fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/images", async (req, res) => {
  try {
    const images = await Post.find().select("-data").sort({ uploadDate: -1 });
    res.json({ images });
  } catch (error) {
    console.error("Images fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/signup", upload, handleMulterError, async (req, res) => {
  // console.log("Signup - req.body:", req.body);
  // console.log("Signup - req.file:", req.file);
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });
    const hashedPassword = await bcrypt.hash(password, 10);

    let postId = null;
    if (req.file) {
      const newImage = new Post({
        filename: `${Date.now()}_${req.file.originalname}`,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        data: req.file.buffer,
        uploadDate: new Date(),
        userId: null, 
      });
      const savedImage = await newImage.save();
      postId = savedImage._id;
      // console.log("Saved image to Post model:", savedImage);
    }

    const user = new User({
      name,
      email,
      password: hashedPassword,
      profileImage: postId, 
    });

    const savedUser = await user.save();
    if (postId) {
      await Post.updateOne({ _id: postId }, { userId: savedUser._id });
    }

    res.status(201).json({ message: "User created successfully", userId: savedUser._id });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Server error during signup" });
  }
});

router.get("/user/image/:userId", async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.profileImage) {
      return res.status(404).json({ message: "User image not found" });
    }

    const image = await Post.findById(user.profileImage);
    if (!image) {
      return res.status(404).json({ message: "Image not found" });
    }

    res.set({
      "Content-Type": image.mimetype,
      "Content-Length": image.data.length,
    });

    res.send(image.data);
  } catch (error) {
    console.error("User image fetch error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: "Missing fields" });
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "1h" }
    );
    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
});


router.get("/profile", authMiddleware, async (req, res) => {
  try {
    // console.log("Logged in user ID:", req.user.id);

    const user = await User.findById(req.user.id).select("name email");
    if (!user) return res.status(404).json({ message: "User not found" });

    // console.log("User info:", user);

    const attachments = await Post.find({ userId: req.user.id }); 
    // console.log("Attachments metadata:", attachments.map(a => ({
    //   _id: a._id,
    //   filename: a.filename,
    //   mimetype: a.mimetype,
    //   size: a.size,
    //   uploadDate: a.uploadDate
    // })));

    
    const profile = {
      _id: user._id,
      name: user.name,
      email: user.email,
      images: attachments.map(a => ({
        id: a._id,
        filename: a.filename,
        mimetype: a.mimetype,
        size: a.size,
        url: `/auth/image/${a._id}` 
      }))
    };

    res.json(profile);

  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error while fetching profile" });
  }
});



module.exports = router;