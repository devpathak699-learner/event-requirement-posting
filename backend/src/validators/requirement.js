import { z } from 'zod';
import {
  CREW_ROLES,
  EVENT_TYPES,
  EXPERIENCE_LEVELS,
  PERFORMER_TYPES,
  PLANNER_SERVICES,
} from '../constants.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_EVENT_SPAN_DAYS = 30;
const MAX_DAYS_AHEAD = 2 * 365;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    // Rejects impossible dates like 2026-02-30, which Date silently rolls over.
    return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
  }, 'Not a valid calendar date');

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use the HH:MM (24h) format');

const optionalText = (max) =>
  z
    .string()
    .trim()
    .max(max, `Must be at most ${max} characters`)
    .optional()
    .transform((value) => (value ? value : undefined));

const budget = z
  .object({
    min: z.number().int().min(0, 'Budget cannot be negative'),
    max: z.number().int().min(1, 'Maximum budget must be greater than 0'),
  })
  .refine((b) => b.max >= b.min, {
    message: 'Maximum budget must be greater than or equal to the minimum',
    path: ['max'],
  });

const plannerDetails = z.object({
  services: z
    .array(z.enum(PLANNER_SERVICES))
    .min(1, 'Select at least one service')
    .transform((list) => [...new Set(list)]),
  guestCount: z.number().int().min(1, 'At least 1 guest').max(100000),
  planningStage: z.enum(['just_started', 'venue_booked', 'mostly_planned']),
  theme: optionalText(200),
  budget,
  notes: optionalText(1000),
});

const performerDetails = z.object({
  performerType: z.enum(PERFORMER_TYPES),
  genre: optionalText(120),
  audienceSize: z.number().int().min(1).max(100000),
  performanceDurationMins: z.number().int().min(15, 'Minimum 15 minutes').max(720, 'Maximum 12 hours'),
  soundSystemProvided: z.boolean(),
  budget,
  notes: optionalText(1000),
});

const crewDetails = z.object({
  roles: z
    .array(
      z.object({
        role: z.enum(CREW_ROLES),
        count: z.number().int().min(1, 'At least 1 person').max(200),
      }),
    )
    .min(1, 'Add at least one crew role')
    .refine((roles) => new Set(roles.map((r) => r.role)).size === roles.length, 'Each role can only be listed once'),
  shift: z
    .object({ startTime: timeOfDay, endTime: timeOfDay })
    .refine((s) => s.startTime !== s.endTime, { message: 'Shift start and end cannot be the same', path: ['endTime'] }),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  budget,
  notes: optionalText(1000),
});

const eventBasics = z.object({
  eventName: z.string().trim().min(3, 'Event name must be at least 3 characters').max(120),
  eventType: z.enum(EVENT_TYPES),
  startDate: isoDate,
  endDate: isoDate.optional(),
  location: z.string().trim().min(2, 'Location is required').max(120),
  venue: optionalText(160),
});

export const requirementSchema = z
  .discriminatedUnion(
    'category',
    [
      eventBasics.extend({ category: z.literal('planner'), details: plannerDetails }),
      eventBasics.extend({ category: z.literal('performer'), details: performerDetails }),
      eventBasics.extend({ category: z.literal('crew'), details: crewDetails }),
    ],
    { error: 'Category must be one of: planner, performer, crew' },
  )
  .superRefine((data, ctx) => {
    const start = new Date(`${data.startDate}T00:00:00Z`).getTime();
    const todayUtc = new Date(new Date().toISOString().slice(0, 10)).getTime();

    // One day of slack so a user east of UTC can still post for their "today".
    if (start < todayUtc - DAY_MS) {
      ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Event date cannot be in the past' });
    }
    if (start > todayUtc + MAX_DAYS_AHEAD * DAY_MS) {
      ctx.addIssue({ code: 'custom', path: ['startDate'], message: 'Event date must be within the next 2 years' });
    }
    if (data.endDate) {
      const end = new Date(`${data.endDate}T00:00:00Z`).getTime();
      if (end < start) {
        ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date must be on or after the start date' });
      } else if ((end - start) / DAY_MS > MAX_EVENT_SPAN_DAYS) {
        ctx.addIssue({
          code: 'custom',
          path: ['endDate'],
          message: `Events can span at most ${MAX_EVENT_SPAN_DAYS} days`,
        });
      }
    }
  });

export const listQuerySchema = z.object({
  category: z.enum(['planner', 'performer', 'crew']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});
