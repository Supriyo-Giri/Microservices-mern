import logger from "../utils/logger.util.js";
import { validateRegistration } from "../utils/validation.util.js";
import { validateLogin } from "../utils/validation.util.js";
import User from "../models/user.model.js";
import generateToken from "../utils/generateToken.util.js";
import RefreshToken from "../models/refresh-token.model.js";


//user registration
export const registerUserController = async (req, res) => {
  logger.info("Register user endpoint was hit...");
  try {
    //validating the schema
    const { error } = validateRegistration(req.body);
    if (error) {
      logger.warn("Valiation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    const { email, password, username } = req.body;
    let user = await User.findOne({ $or: [{ email }, { username }] });
    if (user) {
      logger.warn("User already exists");
      return res.status(400).json({
        success: false,
        message: "User already exixts",
      });
    }

    user = new User({ username, email, password });
    await user.save();
    logger.warn("User saved successfully", user._id);

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(201).json({
      success: true,
      message: "user registered successfully",
      accessToken,
      refreshToken,
    });
  } catch (error) {
    logger.error("Registration error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

//user login
export const loginUserController = async (req, res) => {
  logger.info("Login user endpoint was hit...");
  try {
    const { error } = validateLogin(req.body);
    if (error) {
      logger.warn("Valiation error", error.details[0].message);
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const { email, password } = req.body;
    let user = await User.findOne({ email });
    if (!user) {
      logger.warn("User does not exist");
      return res.status(400).json({
        success: false,
        message: "User does not exist",
      });
    }

    //passowrd validation
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      logger.warn("Invalid credentials");
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const { accessToken, refreshToken } = await generateToken(user);

    res.status(200).json({
      accessToken,
      refreshToken,
      userId: user._id,
    });
  } catch (error) {
    logger.error("Login error occured", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// refresh token
export const refreshTokenController = async (req, res) => {
  logger.info(`Refresh user token endpoint was hit...`);
  try {
    const { refreshToken } = req.body;
    // const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      logger.warn(`Refresh token is missing`);
      return res.status(400).json({
        success: false,
        message: "Refresh token is missing",
      });
    }
    const storedToken = await RefreshToken.findOne({ token: refreshToken });
    if (!storedToken || storedToken.expiresAt < new Date()) {
      logger.warn(`Invalid or expired refresh token`);
      return res.status(401).json({
        success: false,
        message: `Invalid or expired refresh token`,
      });
    }
    const user = await User.findById(storedToken.user);
    if (!user) {
      logger.warn(`User not found`);
      return res.status(401).json({
        success: false,
        message: `User not found`,
      });
    }

    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await generateToken(user);

    //delete the old refresh token
    await RefreshToken.deleteOne({ _id: storedToken._id });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      accessToken: newAccessToken,
    });
  } catch (error) {
    logger.error("Error in creating refresh token", error);
    res.status(500).json({
      success: false,
      message: "Error in creating refresh token",
    });
  }
};

// logout 
export const logoutUserController = async (req, res) => {
  logger.info(`Logout endpoint was hit...`);
  try {
    const { refreshToken } = req.body;
    // const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      logger.warn(`Refresh token is missing`);
      return res.status(400).json({
        success: false,
        message: "Refresh token is missing",
      });
    }
    await RefreshToken.deleteOne({ token: refreshToken });
    logger.info("Refresh token deleted for logout");

    res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  } catch (error) {
    logger.error("Error in logging out user", error);
    res.status(500).json({
      success: false,
      message: "Error in logging out user",
    });
  }
};
