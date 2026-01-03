import express from 'express'
import { loginUserController, logoutUserController, refreshTokenController, registerUserController } from '../controllers/user.controller.js'

const router = express.Router();

router.post('/register', registerUserController)
router.post('/login',loginUserController)
router.post('/refresh-tokens',refreshTokenController)
router.post('/logout',logoutUserController)

export default router;