import type { RequestHandler } from 'express';
import { getFeed, getMatches, recordSwipe } from '../services/discover.js';
import { swipeBody } from '../validators/swipe.js';
import { ApiError } from '../middleware/errors.js';
import {
  getPreferences,
  savePreferences,
  preferencesBody,
  preferenceOptions,
} from '../services/preferences.js';
export const preferences: RequestHandler = async (_req, res) => {
  res
    .set('Cache-Control', 'no-store')
    .json({ success: true, preferences: await getPreferences(), options: preferenceOptions });
};
export const updatePreferences: RequestHandler = async (req, res) => {
  const parsed = preferencesBody.safeParse(req.body);
  if (!parsed.success)
    throw new ApiError(
      400,
      'INVALID_INPUT',
      'Choose a supported city, up to eight unique interests, and a valid pause setting.',
    );
  res
    .set('Cache-Control', 'no-store')
    .json({ success: true, preferences: await savePreferences(parsed.data) });
};
export const feed: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ success: true, profiles: await getFeed() });
};
export const matches: RequestHandler = async (_req, res) => {
  res.set('Cache-Control', 'no-store').json({ success: true, matches: await getMatches() });
};
export const swipe: RequestHandler = async (req, res) => {
  const input = swipeBody.safeParse(req.body);
  if (!input.success)
    throw new ApiError(
      400,
      'INVALID_INPUT',
      'Provide a valid profileId and direction (like or pass), with no extra fields.',
    );
  res
    .set('Cache-Control', 'no-store')
    .status(201)
    .json(await recordSwipe(input.data));
};
