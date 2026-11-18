import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import request from 'supertest';
import { app } from './app.js';
import { Profile, Swipe, Match, Preferences, ensureIndexes } from './models/index.js';
import { seedProfiles } from './scripts/profiles.js';
import { DEMO_USER_ID } from './config/env.js';
let db: MongoMemoryReplSet;
const mutual = seedProfiles[0]._id,
  nonMutual = seedProfiles[1]._id;
const swipe = (id: string, direction = 'like') =>
  request(app).post('/swipe').send({ profileId: id, direction });
beforeAll(async () => {
  db = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    binary: process.env.MONGOMS_SYSTEM_BINARY
      ? { systemBinary: process.env.MONGOMS_SYSTEM_BINARY }
      : undefined,
  });
  await mongoose.connect(db.getUri());
  await ensureIndexes();
}, 120000);
afterAll(async () => {
  await mongoose.disconnect();
  await db?.stop();
});
beforeEach(async () => {
  vi.restoreAllMocks();
  await Promise.all([
    Profile.deleteMany({}),
    Swipe.deleteMany({}),
    Match.deleteMany({}),
    Preferences.deleteMany({}),
  ]);
  await Profile.insertMany(seedProfiles);
});
describe('privacy-first discovery', () => {
  it('persists private preferences and filters by city and any selected interest', async () => {
    const saved = await request(app)
      .put('/preferences')
      .send({ paused: false, city: 'Bengaluru', interests: ['Coffee'] });
    expect(saved.status).toBe(200);
    expect((await request(app).get('/preferences')).body.preferences).toEqual({
      paused: false,
      city: 'Bengaluru',
      interests: ['Coffee'],
    });
    const feed = await request(app).get('/feed');
    expect(feed.body.profiles.length).toBeGreaterThan(0);
    for (const profile of feed.body.profiles) {
      expect(profile.city).toBe('Bengaluru');
      expect(profile.interests).toContain('Coffee');
    }
    const settings = await request(app).get('/preferences');
    expect(JSON.stringify(settings.body)).not.toMatch(/hasLiked|userId|__v|incoming/);
  });
  it('pauses feed and swipes while retaining confirmed matches and saved choices', async () => {
    await swipe(mutual);
    await request(app).put('/preferences').send({ paused: true, city: '', interests: [] });
    expect((await request(app).get('/feed')).body.profiles).toEqual([]);
    const rejected = await swipe(nonMutual);
    expect(rejected.status).toBe(409);
    expect(rejected.body.error.code).toBe('DISCOVERY_PAUSED');
    expect(await Swipe.countDocuments()).toBe(1);
    expect((await request(app).get('/matches')).body.matches).toHaveLength(1);
    await request(app).put('/preferences').send({ paused: false, city: '', interests: [] });
    const feed = await request(app).get('/feed');
    expect(feed.body.profiles).toHaveLength(31);
    expect(feed.body.profiles.some((profile: { _id: string }) => profile._id === mutual)).toBe(
      false,
    );
  });
  it('validates preference values and rejects client-selected identity', async () => {
    for (const body of [
      { paused: 'yes', city: '', interests: [] },
      { paused: false, city: 'unknown', interests: [] },
      { paused: false, city: '', interests: ['Not a supported interest'] },
      { paused: false, city: '', interests: ['Coffee', 'Coffee'] },
      { paused: false, city: '', interests: [], userId: 'other' },
    ])
      expect((await request(app).put('/preferences').send(body)).status).toBe(400);
    expect(await Preferences.countDocuments()).toBe(0);
  });
  it('creates shared-interest prompts only for mutual matches and preserves them after preference changes', async () => {
    await request(app)
      .put('/preferences')
      .send({ paused: false, city: '', interests: ['Coffee'] });
    expect((await swipe(nonMutual)).body).toEqual({ success: true, matched: false });
    const result = await swipe(mutual);
    expect(result.body.match.conversationStarter.interest).toBe('Coffee');
    expect(result.body.match.conversationStarter.text).toContain('café');
    await request(app)
      .put('/preferences')
      .send({ paused: false, city: '', interests: ['Books'] });
    expect((await request(app).get('/matches')).body.matches[0].conversationStarter).toEqual(
      result.body.match.conversationStarter,
    );
  });
  it('does not invent shared interests when none are selected or shared', async () => {
    const result = await swipe(mutual);
    expect(result.body.match.conversationStarter.interest).toBeNull();
    expect(result.body.match.conversationStarter.text).toBeTruthy();
  });
  it('returns all 32 adult public profiles in a stable interest-independent order', async () => {
    const res = await request(app).get('/feed');
    expect(res.status).toBe(200);
    expect(res.body.profiles).toHaveLength(32);
    expect(res.body.profiles[0]._id).toBe(mutual);
    for (const p of res.body.profiles) {
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(Object.keys(p).sort()).toEqual([
        '_id',
        'age',
        'bio',
        'city',
        'college',
        'interests',
        'name',
        'photo',
      ]);
    }
    expect(JSON.stringify(res.body)).not.toMatch(/hasLiked|userId|__v|incoming/i);
  });
  it('persists a pass, does not create a match, and never returns incoming interest', async () => {
    const res = await swipe(mutual, 'pass');
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, matched: false });
    expect(await Swipe.countDocuments({ direction: 'pass' })).toBe(1);
    expect(await Match.countDocuments()).toBe(0);
  });
  it('gives the identical non-match response for passes and non-mutual likes', async () => {
    const like = await swipe(nonMutual);
    const pass = await swipe(mutual, 'pass');
    expect(like.body).toEqual(pass.body);
    expect(await Match.countDocuments()).toBe(0);
  });
  it('creates and returns only a confirmed mutual match', async () => {
    const res = await swipe(mutual);
    expect(res.body.matched).toBe(true);
    expect(res.body.match.profile.name).toBe('Riya');
    expect(JSON.stringify(res.body)).not.toContain('hasLikedDemoUser');
    expect(await Swipe.countDocuments()).toBe(1);
    expect(await Match.countDocuments()).toBe(1);
  });
  it('excludes likes and passes on every repeated feed request', async () => {
    await swipe(mutual, 'pass');
    await swipe(nonMutual);
    for (let i = 0; i < 3; i++) {
      const res = await request(app).get('/feed');
      expect(res.body.profiles).toHaveLength(30);
      expect(res.body.profiles.map((p: { _id: string }) => p._id)).not.toContain(mutual);
      expect(res.body.profiles.map((p: { _id: string }) => p._id)).not.toContain(nonMutual);
    }
  });
  it('returns only matches for the fixed server-side demo identity', async () => {
    await swipe(mutual);
    await swipe(nonMutual);
    await Match.create({ userId: 'another-user', profileId: nonMutual });
    const res = await request(app).get('/matches');
    expect(res.body.matches).toHaveLength(1);
    expect(res.body.matches[0].profile._id).toBe(mutual);
    expect(JSON.stringify(res.body)).not.toMatch(/hasLiked|userId|__v/);
  });
  it('rejects repeated and concurrent duplicate requests without duplicate records', async () => {
    const results = await Promise.all([swipe(mutual), swipe(mutual)]);
    expect(results.map((r) => r.status).sort()).toEqual([201, 409]);
    expect((await swipe(mutual, 'pass')).status).toBe(409);
    expect(await Swipe.countDocuments()).toBe(1);
    expect(await Match.countDocuments()).toBe(1);
  });
  it('does not accept user identity, unknown fields, invalid IDs or directions', async () => {
    for (const body of [
      { profileId: 'bad', direction: 'like' },
      { profileId: mutual, direction: 'up' },
      { profileId: mutual, direction: 'like', userId: 'attacker' },
      {},
      { profileId: { $ne: null }, direction: 'like' },
    ]) {
      expect((await request(app).post('/swipe').send(body)).status).toBe(400);
    }
    expect(await Swipe.countDocuments()).toBe(0);
  });
  it('returns 404 for a missing profile and persists nothing', async () => {
    expect((await swipe('ffffffffffffffffffffffff')).status).toBe(404);
    expect(await Swipe.countDocuments()).toBe(0);
  });
  it('sanitizes database failures', async () => {
    vi.spyOn(Swipe, 'find').mockImplementationOnce(() => {
      throw new Error('secret database URI');
    });
    const res = await request(app).get('/feed');
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
  it('rolls back the swipe if match persistence fails', async () => {
    vi.spyOn(Match, 'create').mockRejectedValueOnce(new Error('write failed'));
    expect((await swipe(mutual)).status).toBe(503);
    expect(await Swipe.countDocuments()).toBe(0);
    expect(await Match.countDocuments()).toBe(0);
  });
  it('handles invalid JSON and never offers an incoming-likes endpoint', async () => {
    expect(
      (await request(app).post('/swipe').set('Content-Type', 'application/json').send('{')).status,
    ).toBe(400);
    expect((await request(app).get('/likes')).status).toBe(404);
  });
  it('scopes swipe exclusion to the demo user', async () => {
    await Swipe.create({ userId: 'other', profileId: mutual, direction: 'pass' });
    const res = await request(app).get('/feed');
    expect(res.body.profiles).toHaveLength(32);
    expect(await Swipe.countDocuments({ userId: DEMO_USER_ID })).toBe(0);
  });
});
