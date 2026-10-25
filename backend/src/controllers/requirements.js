import mongoose from 'mongoose';
import { CATEGORIES } from '../constants.js';
import { categoryModels, Requirement } from '../models/Requirement.js';
import { listQuerySchema, requirementSchema } from '../validators/requirement.js';
import { HttpError } from '../middleware/errors.js';

export async function createRequirement(req, res) {
  // Throws a ZodError on invalid input; the error middleware turns it into a 400.
  const payload = requirementSchema.parse(req.body);

  // Route the document to the discriminator model for its category, so it is
  // stored with `category` set and validated against that category's schema.
  const Model = categoryModels[payload.category];
  const requirement = await Model.create(payload);

  res.status(201).json({ data: requirement });
}

export async function listRequirements(req, res) {
  const { category, page, limit } = listQuerySchema.parse(req.query);
  const filter = category ? { category } : {};

  const [items, total] = await Promise.all([
    Requirement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Requirement.countDocuments(filter),
  ]);

  res.json({
    data: items,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function getRequirementStats(_req, res) {
  const rows = await Requirement.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]);
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const row of rows) byCategory[row._id] = row.count;

  res.json({
    data: { total: Object.values(byCategory).reduce((a, b) => a + b, 0), byCategory },
  });
}

export async function getRequirement(req, res) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new HttpError(404, 'NOT_FOUND', 'Requirement not found');
  }
  const requirement = await Requirement.findById(req.params.id);
  if (!requirement) {
    throw new HttpError(404, 'NOT_FOUND', 'Requirement not found');
  }
  res.json({ data: requirement });
}
