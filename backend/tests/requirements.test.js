import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { Requirement } from '../src/models/Requirement.js';

let mongod;
const app = createApp({ logRequests: false, createLimit: 1000 });

const daysFromToday = (days) => new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

const basics = () => ({
  eventName: 'Annual Tech Summit',
  eventType: 'conference',
  startDate: daysFromToday(30),
  endDate: daysFromToday(31),
  location: 'Bengaluru',
  venue: 'KTPO Convention Centre',
});

const validPayloads = {
  planner: () => ({
    ...basics(),
    category: 'planner',
    details: {
      services: ['full_planning', 'vendor_management'],
      guestCount: 250,
      planningStage: 'just_started',
      theme: 'Minimal & modern',
      budget: { min: 200000, max: 500000 },
    },
  }),
  performer: () => ({
    ...basics(),
    category: 'performer',
    details: {
      performerType: 'band',
      genre: 'Bollywood fusion',
      audienceSize: 400,
      performanceDurationMins: 90,
      soundSystemProvided: true,
      budget: { min: 50000, max: 120000 },
    },
  }),
  crew: () => ({
    ...basics(),
    category: 'crew',
    details: {
      roles: [
        { role: 'photographer', count: 2 },
        { role: 'sound_engineer', count: 1 },
      ],
      shift: { startTime: '08:00', endTime: '20:00' },
      experienceLevel: 'expert',
      budget: { min: 3000, max: 6000 },
    },
  }),
};

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Requirement.deleteMany({});
});

describe('POST /api/requirements', () => {
  for (const category of ['planner', 'performer', 'crew']) {
    it(`stores a ${category} requirement under its category`, async () => {
      const res = await request(app).post('/api/requirements').send(validPayloads[category]()).expect(201);

      assert.equal(res.body.data.category, category);
      assert.ok(res.body.data.id);
      assert.equal(res.body.data.status, 'open');

      const raw = await mongoose.connection.collection('requirements').findOne({ _id: new mongoose.Types.ObjectId(res.body.data.id) });
      assert.equal(raw.category, category);
      assert.ok(raw.details, 'category-specific details are persisted');
      assert.ok(raw.startDate instanceof Date);
    });
  }

  it('rejects an unknown category', async () => {
    const res = await request(app)
      .post('/api/requirements')
      .send({ ...validPayloads.planner(), category: 'caterer' })
      .expect(400);
    assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  });

  it('rejects details that belong to a different category', async () => {
    const payload = { ...validPayloads.crew(), details: validPayloads.planner().details };
    const res = await request(app).post('/api/requirements').send(payload).expect(400);
    assert.ok(res.body.error.details.some((d) => d.path.startsWith('details.roles')));
  });

  it('rejects missing required basics with field-level errors', async () => {
    const payload = validPayloads.planner();
    delete payload.eventName;
    payload.location = ' ';
    const res = await request(app).post('/api/requirements').send(payload).expect(400);
    const paths = res.body.error.details.map((d) => d.path);
    assert.ok(paths.includes('eventName'));
    assert.ok(paths.includes('location'));
  });

  it('rejects past dates and inverted date ranges', async () => {
    const past = { ...validPayloads.planner(), startDate: daysFromToday(-10), endDate: undefined };
    const pastRes = await request(app).post('/api/requirements').send(past).expect(400);
    assert.ok(pastRes.body.error.details.some((d) => d.path === 'startDate'));

    const inverted = { ...validPayloads.planner(), startDate: daysFromToday(10), endDate: daysFromToday(5) };
    const invRes = await request(app).post('/api/requirements').send(inverted).expect(400);
    assert.ok(invRes.body.error.details.some((d) => d.path === 'endDate'));
  });

  it('rejects impossible calendar dates', async () => {
    const payload = { ...validPayloads.planner(), startDate: '2027-02-30', endDate: undefined };
    await request(app).post('/api/requirements').send(payload).expect(400);
  });

  it('rejects a budget whose max is below its min', async () => {
    const payload = validPayloads.performer();
    payload.details.budget = { min: 10000, max: 5000 };
    const res = await request(app).post('/api/requirements').send(payload).expect(400);
    assert.ok(res.body.error.details.some((d) => d.path === 'details.budget.max'));
  });

  it('rejects duplicate crew roles', async () => {
    const payload = validPayloads.crew();
    payload.details.roles = [
      { role: 'security', count: 2 },
      { role: 'security', count: 3 },
    ];
    await request(app).post('/api/requirements').send(payload).expect(400);
  });

  it('strips unknown fields instead of persisting them', async () => {
    const res = await request(app)
      .post('/api/requirements')
      .send({ ...validPayloads.planner(), isAdmin: true, status: 'closed' })
      .expect(201);
    assert.equal(res.body.data.isAdmin, undefined);
    assert.equal(res.body.data.status, 'open');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/requirements')
      .set('Content-Type', 'application/json')
      .send('{"eventName": ')
      .expect(400);
    assert.equal(res.body.error.code, 'INVALID_JSON');
  });
});

describe('GET /api/requirements', () => {
  beforeEach(async () => {
    for (const category of ['planner', 'performer', 'crew', 'crew']) {
      await request(app).post('/api/requirements').send(validPayloads[category]()).expect(201);
    }
  });

  it('lists all requirements newest first with pagination', async () => {
    const res = await request(app).get('/api/requirements?limit=2').expect(200);
    assert.equal(res.body.data.length, 2);
    assert.deepEqual(res.body.pagination, { page: 1, limit: 2, total: 4, totalPages: 2 });
  });

  it('filters by category', async () => {
    const res = await request(app).get('/api/requirements?category=crew').expect(200);
    assert.equal(res.body.data.length, 2);
    assert.ok(res.body.data.every((r) => r.category === 'crew'));
  });

  it('rejects an invalid category filter', async () => {
    await request(app).get('/api/requirements?category=nope').expect(400);
  });

  it('returns counts per category', async () => {
    const res = await request(app).get('/api/requirements/stats').expect(200);
    assert.deepEqual(res.body.data, { total: 4, byCategory: { planner: 1, performer: 1, crew: 2 } });
  });

  it('fetches one requirement by id and 404s on unknown ids', async () => {
    const list = await request(app).get('/api/requirements?category=planner').expect(200);
    const { id } = list.body.data[0];
    const res = await request(app).get(`/api/requirements/${id}`).expect(200);
    assert.equal(res.body.data.category, 'planner');

    await request(app).get(`/api/requirements/${new mongoose.Types.ObjectId()}`).expect(404);
    await request(app).get('/api/requirements/not-an-id').expect(404);
  });
});

describe('rate limiting', () => {
  it('returns 429 once a client exceeds the posting limit', async () => {
    const limitedApp = createApp({ logRequests: false, createLimit: 2 });
    await request(limitedApp).post('/api/requirements').send(validPayloads.planner()).expect(201);
    await request(limitedApp).post('/api/requirements').send(validPayloads.planner()).expect(201);
    const res = await request(limitedApp).post('/api/requirements').send(validPayloads.planner()).expect(429);
    assert.equal(res.body.error.code, 'RATE_LIMITED');
  });
});

describe('GET /api/health', () => {
  it('reports the database connection', async () => {
    const res = await request(app).get('/api/health').expect(200);
    assert.deepEqual(res.body, { status: 'ok', db: true });
  });
});
