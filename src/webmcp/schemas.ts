import { z } from "zod";

const findingId = z.string().trim().startsWith("finding:").max(120);
const proposedValue = z.union([
  z.string().trim().min(1).max(240),
  z.number().finite(),
]);

export const getPackStateInput = z.object({}).strict();

export const getFindingEvidenceInput = z
  .object({
    findingId,
  })
  .strict();

export const stageExporterCorrectionsInput = z
  .object({
    corrections: z
      .array(
        z
          .object({
            findingId,
            proposedValue,
          })
          .strict(),
      )
      .min(1)
      .max(5),
  })
  .strict();

export const draftExternalCorrectionRequestsInput = z
  .object({
    findingIds: z.array(findingId).min(1).max(5),
  })
  .strict();

const humanDecisionValues = ["accept", "reject", "escalate"] as const;

export const stageHumanDecisionInput = z
  .object({
    findingId,
    decision: z.enum(humanDecisionValues),
    rationale: z.string().trim().min(3).max(500),
  })
  .strict();

export const rerunPreflightInput = z.object({}).strict();

const findingIdJsonSchema = {
  type: "string",
  pattern: "^finding:",
  maxLength: 120,
} as const;

export const WEB_MCP_INPUT_SCHEMAS = {
  get_pack_state: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
  get_finding_evidence: {
    type: "object",
    properties: {
      findingId: {
        ...findingIdJsonSchema,
        description: "Stable ID of a finding in the active preflight.",
      },
    },
    required: ["findingId"],
    additionalProperties: false,
  },
  stage_exporter_corrections: {
    type: "object",
    properties: {
      corrections: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        items: {
          type: "object",
          properties: {
            findingId: findingIdJsonSchema,
            proposedValue: {
              oneOf: [
                { type: "string", minLength: 1, maxLength: 240 },
                { type: "number" },
              ],
              description: "Replacement value proposed for an exporter-owned field.",
            },
          },
          required: ["findingId", "proposedValue"],
          additionalProperties: false,
        },
      },
    },
    required: ["corrections"],
    additionalProperties: false,
  },
  draft_external_correction_requests: {
    type: "object",
    properties: {
      findingIds: {
        type: "array",
        minItems: 1,
        maxItems: 5,
        uniqueItems: true,
        items: findingIdJsonSchema,
        description: "Findings owned by a carrier, bank, or authority.",
      },
    },
    required: ["findingIds"],
    additionalProperties: false,
  },
  stage_human_decision: {
    type: "object",
    properties: {
      findingId: findingIdJsonSchema,
      decision: {
        type: "string",
        enum: ["accept", "reject", "escalate"],
      },
      rationale: {
        type: "string",
        minLength: 3,
        maxLength: 500,
        description: "Human-readable reason that must be confirmed in the page UI.",
      },
    },
    required: ["findingId", "decision", "rationale"],
    additionalProperties: false,
  },
  rerun_preflight: {
    type: "object",
    properties: {},
    additionalProperties: false,
  },
} as const;
