import express from 'express'
import { createPostController,getAllPostController,getOnePostController,DeletePostController } from '../controllers/post.controller.js'
import { authenticateRequest } from '../middlewares/auth.middleware.js'

const router = express.Router();

//middleware - that verifes if the user is an verified user on not 
router.use(authenticateRequest)

router.post('/create-post',createPostController);

export default router;