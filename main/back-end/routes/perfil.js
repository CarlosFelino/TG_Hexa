import express from 'express';
import { upload } from '../middlewares/multer.js';
import * as perfilController from '../controllers/perfilController.js';

const router = express.Router();

router.get('/', perfilController.getUser);
router.post('/foto', upload.single('photo'), perfilController.uploadPhoto);
router.delete('/foto', perfilController.removePhoto);
router.post('/senha', perfilController.changePassword);

export default router;
