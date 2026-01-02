import logger from '../utils/logger.util.js'
import validateRegistration from '../utils/validation.util.js'
import User from '../models/user.model.js'
import generateToken from '../utils/generateToken.util.js'

//user registration 
export const registerUserController = async(req,res) => {
    logger.info('Register user endpoint...')
    try {
        //validating the schema
        const {error} = validateRegistration(req.body);
        if(error){
            logger.warn('Valiation error',error.details[0].message)
            return res.status(400).json({
                success: false,
                message: error.details[0].message
            })
        }
        const { email,password, username } = req.body;
        let user = await User.findOne({ $or: [{email},{username}] });
        if(user){
            logger.warn('User alreay exists');
            return res.status(400).json({
                success: false,
                message: 'User already exixts'
            });
        }

        user = new User({username, email, password });
        await user.save();
        logger.warn('User saved successfully',user._id);

        const { accessToken, refreshToken } = await generateToken(user);

        res.status(201).json({
            success: true,
            message: 'user registered successfully',
            accessToken,
            refreshToken,
        })
    } catch (error) {
        logger.error('Registration error occured',error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        })
    }
}

//user login



//refresh token


//logout