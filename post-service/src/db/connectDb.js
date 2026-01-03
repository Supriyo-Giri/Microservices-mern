import mongoose from "mongoose";
import logger from '../utils/logger.util.js';

const connectDb = async () => {
    try {

        const MONGODB_URI = process.env.MONOGDB_URI
        // console.log(MONGODB_URI)
        const conn = await mongoose.connect(MONGODB_URI);
        logger.info(
            `Connected to MongoDB successfully, host: ${conn.connection.host}`
        );

    } catch (error) {
        logger.error('Error in connecting to database', error);
        process.exit(1); // stop app if DB fails
    }
};

export default connectDb;
