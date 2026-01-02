import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import Redis from 'ioredis'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import logger from './utils/logger.util.js'
import proxy from 'express-http-proxy'
import errorHandler from './middlewares/errorHandler.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const redisClient = new Redis(process.env.REDIS_URL)

app.use(helmet())
app.use(cors())
app.use(express.json())

const rateLimiter = rateLimit({
    windowMs: 15*60*1000, //in miliseconds
    max: 100,
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

// app.use(rateLimiter);
app.use("/v1/auth", rateLimiter);

//logging all requests on the console window
app.use((req,res,next)=>{
    logger.info(`Recieved ${req.method} request to ${req.url}`);
    logger.info(`Request body: ${JSON.stringify(req.body)}`);
    next();
})     

const proxyOptions = {
    proxyReqPathResolver: (req) => {
        return req.originalUrl.replace(/^\/v1/, "/api")
    },
    proxyErrorHandler: (err,res,next)=>{
        logger.error(`Proxy error: ${err.message}`);
        res.status(500).json({
            message: "Internal server error",
            error: err.message
        })
    }
}

//setting up proxy for identity-service
app.use('/v1/auth',proxy( process.env.IDENTITY_SERVICE_URL,{
    ...proxyOptions,
    proxyReqOptDecorator: (proxyReqOpts,srcReq)=> {
        proxyReqOpts.headers["Content-Type"] = "application/json"
        return proxyReqOpts
    },
    userResDecorator: (proxyRes,proxyResData, userReq, userRes) =>{
        logger.info(`Response received from identity-service: ${proxyRes.statusCode}`)
        return proxyResData
    }
} ))

app.use(errorHandler);  

app.listen(PORT,()=>{
    logger.info(`API gateway is running on port: ${PORT}`);
    logger.info(`Indentity-service is running on: ${process.env.IDENTITY_SERVICE_URL}`)
    logger.info(`Redis url: ${process.env.REDIS_URL}`)
})
