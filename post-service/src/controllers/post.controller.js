import logger from "../utils/logger.util.js";
import Post from '../models/post.model.js'

export const createPostController = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: user not found in request",
      });
    }

    const { content, mediaIds } = req.body;

    if (!content && (!mediaIds || mediaIds.length === 0)) {
      return res.status(400).json({
        success: false,
        message: "Either content or mediaIds is required",
      });
    }

    const newlyCreatedPost = new Post({
      user: req.user.userId,
      content,
      mediaIds: mediaIds || [],
    });

    await newlyCreatedPost.save();

    logger.info("Post created successfully!", newlyCreatedPost);

    res.status(201).json({
      success: true,
      message: "Post created successfully!",
    });
  } catch (error) {
    logger.error(`Error creating post: ${error}`);
    res.status(500).json({
      success: false,
      message: "error in createPostController",
    });
  }
};

export const getAllPostController = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error fetching all posts: ${error}`);
    res.status(500).json({
      success: false,
      message: "error in getAllPostController",
    });
  }
};

export const getOnePostController = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error fetching post: ${error}`);
    res.status(500).json({
      success: false,
      message: "error in getOnePostController",
    });
  }
};

export const DeletePostController = async (req, res) => {
  try {
  } catch (error) {
    logger.error(`Error deleting post: ${error}`);
    res.status(500).json({
      success: false,
      message: "error in DeletePostController",
    });
  }
};
