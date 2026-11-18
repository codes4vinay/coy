import { Preferences } from '../models/index.js';
import { DEMO_USER_ID } from '../config/env.js';
import { seedProfiles } from '../scripts/profiles.js';
import { z } from 'zod';
export const preferenceOptions = {
  // Public catalog values never depend on swipes, incoming interest, or filtered result counts.
  cities: [...new Set(seedProfiles.map((p) => p.city))].sort(),
  interests: [...new Set(seedProfiles.flatMap((p) => p.interests))].sort(),
};
export const preferencesBody = z
  .object({
    paused: z.boolean(),
    city: z
      .string()
      .refine(
        (city) => city === '' || preferenceOptions.cities.some((value) => value === city),
        'Choose a supported city.',
      ),
    interests: z
      .array(
        z
          .string()
          .refine(
            (interest) => preferenceOptions.interests.includes(interest),
            'Choose a supported interest.',
          ),
      )
      .max(8)
      .refine(
        (interests) => new Set(interests).size === interests.length,
        'Choose each interest once.',
      ),
  })
  .strict();
export const defaultPreferences = { paused: false, city: '', interests: [] as string[] };
export async function getPreferences() {
  const saved = await Preferences.findOne({ userId: DEMO_USER_ID }).lean();
  return saved
    ? { paused: saved.paused, city: saved.city, interests: saved.interests }
    : { ...defaultPreferences, interests: [] };
}
export async function savePreferences(input: z.infer<typeof preferencesBody>) {
  await Preferences.updateOne(
    { userId: DEMO_USER_ID },
    { $set: input },
    { upsert: true, runValidators: true },
  );
  return input;
}
