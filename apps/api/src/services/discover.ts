import mongoose from 'mongoose';
import { DEMO_USER_ID } from '../config/env.js';
import { Profile, Swipe, Match, Preferences, publicFields } from '../models/index.js';
import { getPreferences } from './preferences.js';
import { buildConversationStarter } from './conversation.js';
import { ApiError } from '../middleware/errors.js';
import type { SwipeInput } from '../validators/swipe.js';
export async function getFeed() {
  const preferences = await getPreferences();
  if (preferences.paused) return [];
  const swiped = await Swipe.find({ userId: DEMO_USER_ID }).distinct('profileId');
  // Stable ordering is unrelated to incoming interest. Explicit projection is a privacy boundary.
  return Profile.find({
    _id: { $nin: swiped },
    ...(preferences.city ? { city: preferences.city } : {}),
    ...(preferences.interests.length ? { interests: { $in: preferences.interests } } : {}),
  })
    .select(publicFields)
    .sort({ _id: 1 })
    .lean();
}
export async function recordSwipe(input: SwipeInput) {
  // These are independent, read-only lookups. Keep parallel work outside the transaction:
  // MongoDB sessions do not support concurrent operations within a transaction.
  const [preferences, profile] = await Promise.all([
    Preferences.findOne({ userId: DEMO_USER_ID }).select('paused interests').lean(),
    Profile.findById(input.profileId).select(`${publicFields} +hasLikedDemoUser`).lean(),
  ]);
  if (preferences?.paused)
    throw new ApiError(
      409,
      'DISCOVERY_PAUSED',
      'Discovery is paused. Resume in preferences to meet new people.',
    );
  if (!profile)
    throw new ApiError(404, 'PROFILE_NOT_FOUND', 'This profile is no longer available.');

  // A mutual like and its match commit together; failed match writes roll back the swipe.
  return mongoose.connection.transaction(async (session) => {
    // The unique user/profile index rejects repeats without an extra database round trip.
    await Swipe.create(
      [{ userId: DEMO_USER_ID, profileId: profile._id, direction: input.direction }],
      { session },
    );
    if (input.direction === 'like' && profile.hasLikedDemoUser) {
      const conversationStarter = buildConversationStarter(
        preferences?.interests ?? [],
        profile.interests,
      );
      // Snapshot the prompt so editing preferences cannot rewrite an established match.
      const [match] = await Match.create(
        [{ userId: DEMO_USER_ID, profileId: profile._id, conversationStarter }],
        {
          session,
        },
      );
      return {
        success: true,
        matched: true,
        match: {
          id: match._id.toString(),
          createdAt: match.createdAt,
          conversationStarter,
          profile: {
            _id: profile._id.toString(),
            name: profile.name,
            age: profile.age,
            photo: profile.photo,
            city: profile.city,
            college: profile.college,
          },
        },
      };
    }
    // All non-mutual outcomes share the same response, regardless of hidden incoming interest.
    return { success: true, matched: false };
  });
}
export async function getMatches() {
  const matches = await Match.find({ userId: DEMO_USER_ID })
    .sort({ createdAt: -1 })
    .populate({ path: 'profileId', select: publicFields })
    .lean();
  return matches
    .filter((m) => m.profileId)
    .map((m) => ({
      id: m._id.toString(),
      createdAt: m.createdAt,
      profile: m.profileId,
      conversationStarter: m.conversationStarter ?? buildConversationStarter([], []),
    }));
}
