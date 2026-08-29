import { z } from "zod";
import type {
  DocumentType,
  ShipmentPack,
} from "./types";

const documentTypes = [
  "letter_of_credit",
  "commercial_invoice",
  "packing_list",
  "bill_of_lading",
  "certificate_of_origin",
] as const;

const fieldKeys = [
  "lc_reference",
  "beneficiary_name",
  "currency",
  "lc_amount",
  "invoice_total",
  "quantity",
  "port_of_discharge",
  "latest_shipment_date",
  "shipment_date",
  "goods_description",
  "certification_marker",
  "notes",
] as const;

const fieldSchema = z.object({
  id: z.string().min(1),
  key: z.enum(fieldKeys),
  label: z.string().min(1),
  rawValue: z.union([z.string(), z.number(), z.boolean()]),
  sourceLocation: z.string().min(1),
  untrusted: z.boolean(),
});

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  fieldIds: z.array(z.string().min(1)).min(1),
});

const documentSchema = z.object({
  id: z.string().min(1),
  type: z.enum(documentTypes),
  title: z.string().min(1),
  issuer: z.string().min(1),
  owner: z.enum(["bank", "exporter", "carrier", "authority"] as const),
  editability: z.enum(["editable_draft", "locked"] as const),
  fields: z.array(fieldSchema).min(1),
  sections: z.array(sectionSchema).min(1),
});

export const shipmentPackSchema = z.object({
  id: z.string().min(1),
  reference: z.string().min(1),
  title: z.string().min(1),
  documents: z.array(documentSchema).length(5),
});

const expectedDocumentTypes = new Set<DocumentType>(documentTypes);

const authorityMatrix: Record<
  DocumentType,
  {
    owner: ShipmentPack["documents"][number]["owner"];
    editability: ShipmentPack["documents"][number]["editability"];
  }
> = {
  letter_of_credit: { owner: "bank", editability: "locked" },
  commercial_invoice: { owner: "exporter", editability: "editable_draft" },
  packing_list: { owner: "exporter", editability: "editable_draft" },
  bill_of_lading: { owner: "carrier", editability: "locked" },
  certificate_of_origin: { owner: "authority", editability: "locked" },
};

export function parseShipmentPack(value: unknown): ShipmentPack {
  const parsed = shipmentPackSchema.parse(value) as ShipmentPack;
  const documentIds = new Set<string>();
  const actualTypes = new Set<DocumentType>();
  const globalFieldIds = new Set<string>();
  const globalSectionIds = new Set<string>();

  for (const document of parsed.documents) {
    if (documentIds.has(document.id)) {
      throw new Error(`Duplicate document id: ${document.id}`);
    }
    documentIds.add(document.id);
    actualTypes.add(document.type);

    const expectedAuthority = authorityMatrix[document.type];
    if (document.owner !== expectedAuthority.owner) {
      throw new Error(
        `${document.title} must be owned by ${expectedAuthority.owner}`,
      );
    }
    if (document.editability !== expectedAuthority.editability) {
      throw new Error(
        `${document.title} must be ${
          expectedAuthority.editability === "locked"
            ? "locked"
            : "an editable draft"
        }`,
      );
    }

    const documentFieldIds = new Set<string>();
    for (const field of document.fields) {
      if (globalFieldIds.has(field.id)) {
        throw new Error(`Duplicate field id: ${field.id}`);
      }
      globalFieldIds.add(field.id);
      documentFieldIds.add(field.id);
    }

    for (const section of document.sections) {
      if (globalSectionIds.has(section.id)) {
        throw new Error( `Duplicate section id: ${section.id}`);
      }
      globalSectionIds.add(section.id);
      for (const fieldId of section.fieldIds) {
        if (!documentFieldIds.has(fieldId)) {
          throw new Error(
            `Section ${section.id} references missing field ${fieldId}`,
          );
        }
      }
    }
  }

  if (
    actualTypes.size !== expectedDocumentTypes.size ||
    [...expectedDocumentTypes].some((type) => !actualTypes.has(type))
  ) {
    throw new Error(
      "Shipment pack must contain each supported document type once",
    );
  }

  return parsed;
}
