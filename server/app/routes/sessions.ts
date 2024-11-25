import express from 'express';
import { param } from 'express-validator';
import { sessionValidator } from '../validators';
import sessionContoller from '../controllers/sessions';

const router = express.Router();
router.post('/', sessionValidator, sessionContoller.createSession);
router.get('/', sessionContoller.getAllSessions);
router.get('/:id', param('id').notEmpty().toInt(), sessionContoller.getSession);
router.put(
  '/:id',
  param('id').notEmpty().toInt(),
  sessionContoller.updateSession
);

export default router;
