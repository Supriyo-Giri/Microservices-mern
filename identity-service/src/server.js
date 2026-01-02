import express from 'express'
import dotenv from 'dotenv'
import connectDb from './db/connectDb.js'
import helmet from 'helmet'
import cors from 'cors'
import { RateLimiterRedis } from 'rate-limiter-flexible'
import Redis from 'ioredis'
import userRoutes from './routes/user.route.js'
import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import errorHandler from './middlewares/errorHandler.js'
import logger from './utils/logger.util.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

//midlewares
app.use(express.json());
app.use(helmet());
app.use(cors());

const redisClient = new Redis(process.env.REDIS_URL);


//logging all requests on the console window
app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body ${req.body}`);
    next();
})                                                          

//DDOS and rate limiting 
const rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    keyPrefix: 'middleware',
    points: 10,
    duration: 1
})

app.use((req,res,next)=>{
    rateLimiter.consume(req.ip).then(()=>next()).catch(()=>{
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
        req.status(429).json({
            success: false,
            message: "Too many requests"
        })
    });
});

//Ip based rate limiting for sensitive endpoints 
const sensitiveEndPointRateLimiter = rateLimit({
    windowMs: 15*60*1000, //in miliseconds
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req,res) => {
        logger.warn(`Sensitive endpoint ratelimit exceeded for ip: ${req.ip}`);
        req.status(429).json({
            success: false,
            message: "Too many requests"
        })
    },
    store: new RedisStore({
        sendCommand: (...args) => redisClient.call(...args),
    })
})

//applying rate limiters to our sensitive endpoints
app.use('/api/auth/register',sensitiveEndPointRateLimiter)

//routes
app.use('/api/auth',userRoutes)

//error handler
app.use(errorHandler)


app.listen(PORT,()=>{
    console.log(`Server started on port: ${PORT}`);
    connectDb();
})


//unhandled promise rejection hanadler
process.on('unhandledRejection',(reason,promise)=>{
    logger.error(`Unhandled rejection at ${promise} reason: ${reason}`)
})
