import mongoose from 'mongoose';
import {
  CATEGORIES,
  CREW_ROLES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  PERFORMER_TYPES,
  PLANNER_SERVICES,
} from '../constants.js';

const { Schema } = mongoose;

const budgetSchema = new Schema(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
    currency: { type: String, default: 'INR' },
  },
  { _id: false },
);

// Shared "Step 1" fields. `category` is the discriminator key, so every document
// in the collection is tagged as planner / performer / crew and validated against
// the matching sub-schema below.
const requirementSchema = new Schema(
  {
    eventName: { type: String, required: true, trim: true },
    eventType: { type: String, required: true, enum: EVENT_TYPES },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    location: { type: String, required: true, trim: true },
    venue: { type: String, trim: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
  },
  {
    discriminatorKey: 'category',
    collection: 'requirements',
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  },
);

requirementSchema.index({ category: 1, createdAt: -1 });

export const Requirement = mongoose.model('Requirement', requirementSchema);

const plannerDetailsSchema = new Schema(
  {
    services: { type: [String], enum: PLANNER_SERVICES, required: true },
    guestCount: { type: Number, required: true, min: 1 },
    planningStage: { type: String, enum: ['just_started', 'venue_booked', 'mostly_planned'], required: true },
    theme: String,
    budget: { type: budgetSchema, required: true },
    notes: String,
  },
  { _id: false },
);

const performerDetailsSchema = new Schema(
  {
    performerType: { type: String, enum: PERFORMER_TYPES, required: true },
    genre: String,
    audienceSize: { type: Number, required: true, min: 1 },
    performanceDurationMins: { type: Number, required: true, min: 15 },
    soundSystemProvided: { type: Boolean, required: true },
    budget: { type: budgetSchema, required: true },
    notes: String,
  },
  { _id: false },
);

const crewDetailsSchema = new Schema(
  {
    roles: {
      type: [
        new Schema(
          {
            role: { type: String, enum: CREW_ROLES, required: true },
            count: { type: Number, required: true, min: 1 },
          },
          { _id: false },
        ),
      ],
      required: true,
    },
    shift: {
      startTime: { type: String, required: true },
      endTime: { type: String, required: true },
    },
    experienceLevel: { type: String, enum: EXPERIENCE_LEVELS, required: true },
    budget: { type: budgetSchema, required: true },
    notes: String,
  },
  { _id: false },
);

export const categoryModels = {
  planner: Requirement.discriminator(
    'PlannerRequirement',
    new Schema({ details: { type: plannerDetailsSchema, required: true } }),
    'planner',
  ),
  performer: Requirement.discriminator(
    'PerformerRequirement',
    new Schema({ details: { type: performerDetailsSchema, required: true } }),
    'performer',
  ),
  crew: Requirement.discriminator(
    'CrewRequirement',
    new Schema({ details: { type: crewDetailsSchema, required: true } }),
    'crew',
  ),
};

if (Object.keys(categoryModels).join() !== CATEGORIES.join()) {
  throw new Error('categoryModels is out of sync with CATEGORIES');
}
