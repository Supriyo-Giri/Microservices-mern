import logger from '../utils/logger.util.js'

const errorHandler = (err,req,res,next) => {
    logger.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server error'
    })
}

export default errorHandler;