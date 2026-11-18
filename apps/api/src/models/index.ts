import { Schema, model } from 'mongoose';
const profileSchema = new Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, min: 18, required: true },
    photo: { type: String, required: true },
    bio: { type: String, required: true },
    city: { type: String, required: true },
    college: String,
    interests: { type: [String], required: true },
    // Matching services must explicitly opt in to this private field.
    hasLikedDemoUser: { type: Boolean, default: false, select: false },
  },
  { timestamps: true },
);
const swipeSchema = new Schema(
  {
    userId: { type: String, required: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    direction: { type: String, enum: ['like', 'pass'], required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
swipeSchema.index({ userId: 1, profileId: 1 }, { unique: true });
const matchSchema = new Schema(
  {
    userId: { type: String, required: true },
    profileId: { type: Schema.Types.ObjectId, ref: 'Profile', required: true },
    conversationStarter: {
      type: new Schema(
        { interest: { type: String, default: null }, text: { type: String, required: true } },
        { _id: false },
      ),
      default: undefined,
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);
matchSchema.index({ userId: 1, profileId: 1 }, { unique: true });
matchSchema.index({ userId: 1, createdAt: -1 });
export const Profile = model('Profile', profileSchema);
export const Swipe = model('Swipe', swipeSchema);
export const Match = model('Match', matchSchema);
const preferencesSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    paused: { type: Boolean, default: false },
    city: { type: String, default: '' },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
);
export const Preferences = model('Preferences', preferencesSchema);
// Allowlisting protects responses even if more private profile fields are added later.
export const publicFields = '_id name age photo bio city college interests';
export async function ensureIndexes() {
  await Promise.all([Profile.init(), Swipe.init(), Match.init(), Preferences.init()]);
}
