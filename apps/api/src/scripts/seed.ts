import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { Profile, ensureIndexes } from '../models/index.js';
import { seedProfiles } from './profiles.js';
try {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  await ensureIndexes();
  // Insert missing fixtures only; reseeding must preserve saved profiles and relationship data.
  await Profile.bulkWrite(
    seedProfiles.map((profile) => ({
      updateOne: { filter: { _id: profile._id }, update: { $setOnInsert: profile }, upsert: true },
    })),
  );
  console.info(
    '32 fictional adult profiles seeded. Existing profiles, swipes and matches preserved.',
  );
} finally {
  await mongoose.disconnect();
}
