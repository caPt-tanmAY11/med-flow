import { z } from 'zod';

// Patient validation schemas
export const patientCreateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  dob: z.string().or(z.date()).transform((val) => new Date(val)),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  contact: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  aadhaarLast4: z.string().length(4).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyContact: z.string().optional(),
  emergencyRelation: z.string().optional(),
  isTemporary: z.boolean().default(false),
  // ID Document fields
  idType: z.string().optional(),
  idNumber: z.string().optional(),
  // Allergies
  allergies: z.array(z.object({
    allergen: z.string(),
    allergenType: z.enum(['drug', 'food', 'environmental']),
    severity: z.enum(['mild', 'moderate', 'severe']),
    reaction: z.string().optional(),
  })).optional(),
});

export const patientUpdateSchema = patientCreateSchema.partial();

export const patientSearchSchema = z.object({
  query: z.string().nullable().optional(),
  uhid: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  page: z.preprocess((val) => (val === null || val === undefined || val === '') ? 1 : Number(val), z.number().min(1).default(1)),
  limit: z.preprocess((val) => (val === null || val === undefined || val === '') ? 20 : Number(val), z.number().min(1).max(100).default(20)),
});

export const patientMergeSchema = z.object({
  sourcePatientId: z.string().uuid(),
  targetPatientId: z.string().uuid(),
  mergeReason: z.string().optional(),
});

// Encounter validation schemas
export const encounterCreateSchema = z.object({
  patientId: z.string().uuid(),
  type: z.enum(['OPD', 'IPD', 'EMERGENCY']),
  primaryDoctorId: z.string().optional(),
  department: z.string().optional(),
  triageColor: z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN']).optional(),
  triageNotes: z.string().optional(),
  medicoLegalFlag: z.boolean().default(false),
});

export const encounterUpdateSchema = z.object({
  status: z.enum(['ACTIVE', 'TRANSFERRED', 'DISCHARGED', 'CANCELLED']).optional(),
  primaryDoctorId: z.string().optional(),
  department: z.string().optional(),
  triageColor: z.enum(['RED', 'ORANGE', 'YELLOW', 'GREEN']).optional(),
  triageNotes: z.string().optional(),
  triageBy: z.string().optional(),
  currentLocation: z.string().optional(),
  consultationStart: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
  consultationEnd: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
  dischargeTime: z.string().or(z.date()).transform((val) => val ? new Date(val) : undefined).optional(),
  medicoLegalFlag: z.boolean().optional(),
});

// Allergy validation schema
export const allergySchema = z.object({
  patientId: z.string().uuid(),
  allergen: z.string().min(1),
  allergenType: z.enum(['drug', 'food', 'environmental']),
  severity: z.enum(['mild', 'moderate', 'severe']),
  reaction: z.string().optional(),
  verifiedBy: z.string().optional(),
});

// Vital signs validation schema
export const vitalSignSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  recordedBy: z.string(),
  temperature: z.number().optional(),
  pulse: z.number().int().optional(),
  respRate: z.number().int().optional(),
  bpSystolic: z.number().int().optional(),
  bpDiastolic: z.number().int().optional(),
  spO2: z.number().optional(),
  weight: z.number().optional(),
  height: z.number().optional(),
  painScore: z.number().int().min(0).max(10).optional(),
  gcs: z.number().int().min(3).max(15).optional(),
  notes: z.string().optional(),
});

// Clinical note validation schema
export const clinicalNoteSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  noteType: z.enum(['chief-complaint', 'progress', 'nursing', 'discharge', 'history']),
  content: z.string().min(1),
  authorId: z.string(),
  authorRole: z.string(),
});

// Order validation schema
export const orderSchema = z.object({
  encounterId: z.string().uuid(),
  patientId: z.string().uuid(),
  orderType: z.enum(['lab', 'radiology', 'medication', 'procedure']),
  orderCode: z.string(),
  orderName: z.string(),
  priority: z.enum(['STAT', 'URGENT', 'ROUTINE']).default('ROUTINE'),
  orderedBy: z.string(),
});

// Bed assignment validation schema
export const bedAssignmentSchema = z.object({
  encounterId: z.string().uuid(),
  bedId: z.string().uuid(),
  assignedBy: z.string().optional(),
});

// Bill validation schema
export const billCreateSchema = z.object({
  patientId: z.string().uuid(),
  encounterId: z.string().uuid(),
  items: z.array(z.object({
    category: z.enum(['consultation', 'bed', 'medicine', 'lab', 'radiology', 'procedure', 'ot', 'other']),
    itemCode: z.string().optional(),
    description: z.string(),
    quantity: z.number().int().default(1),
    unitPrice: z.number(),
  })),
});

// Incident validation schema
export const incidentSchema = z.object({
  incidentType: z.enum(['medication-error', 'fall', 'infection', 'equipment', 'near-miss', 'other']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  location: z.string(),
  description: z.string().min(10),
  reportedBy: z.string(),
  patientId: z.string().uuid().optional(),
  encounterId: z.string().uuid().optional(),
});

export type PatientCreate = z.infer<typeof patientCreateSchema>;
export type PatientUpdate = z.infer<typeof patientUpdateSchema>;
export type PatientSearch = z.infer<typeof patientSearchSchema>;
export type PatientMerge = z.infer<typeof patientMergeSchema>;
export type EncounterCreate = z.infer<typeof encounterCreateSchema>;
export type EncounterUpdate = z.infer<typeof encounterUpdateSchema>;
export type AllergyInput = z.infer<typeof allergySchema>;
export type VitalSignInput = z.infer<typeof vitalSignSchema>;
export type ClinicalNoteInput = z.infer<typeof clinicalNoteSchema>;
export type OrderInput = z.infer<typeof orderSchema>;
export type BedAssignmentInput = z.infer<typeof bedAssignmentSchema>;
export type BillCreate = z.infer<typeof billCreateSchema>;
export type IncidentInput = z.infer<typeof incidentSchema>;
