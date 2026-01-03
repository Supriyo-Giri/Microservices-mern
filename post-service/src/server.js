import dotenv from 'dotenv';
import express from 'express'
import connectDb from './db/connectDb.js';
import Redis from 'ioredis';
import cors from 'cors';
import helmet from 'helmet';
import postRoutes from './routes/post.routes.js'
import errorHandler from './middlewares/errorHandler.js'
import logger from './utils/logger.util.js';
import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'

const app = express();
dotenv.config();

const PORT = process.env.PORT || 3002;
const redisClient = new Redis(process.env.REDIS_URL);


//middleware
app.use(helmet())
app.use(cors({
  origin: "http://localhost:3000", // api-gateway
  credentials: true
}));
app.use(express.json())

app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
})     

//Ip based rate limiting for sensitive endpoints 
const sensitiveEndPointRateLimiter = rateLimit({
    windowMs: 15*60*1000, //in miliseconds
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res) => {
        logger.warn(`Sensitive endpoint ratelimit exceeded for ip: ${req.ip}`);
        res.status(429).json({
            success: false,
            message: "Too many requests"
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
})

//applying rate limiters to our sensitive endpoints
app.use('/api/posts/create-post',sensitiveEndPointRateLimiter)

//routes
app.use('/api/posts',(req,res,next)=>{
    req.redisClient = redisClient
    next()
},postRoutes)

app.use(errorHandler);  

app.listen(PORT,()=>{
    console.log(`Server started on port: ${PORT}`);
    connectDb();
})

//unhandled promise rejection hanadler
process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`Unhandled rejection at ${promise} reason: ${reason}`)
})
