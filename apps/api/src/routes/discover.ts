import { Router } from 'express';
import { feed, matches, swipe, preferences, updatePreferences } from '../controllers/discover.js';
export const discoverRouter = Router();
discoverRouter.get('/feed', feed);
discoverRouter.post('/swipe', swipe);
discoverRouter.get('/matches', matches);
discoverRouter.get('/preferences', preferences);
discoverRouter.put('/preferences', updatePreferences);
