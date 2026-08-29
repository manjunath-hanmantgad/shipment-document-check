import type { FieldValue, TradeDocument } from "../domain/types";

interface DocumentPreviewProps {
  document: TradeDocument;
  fieldOverrides: Record<string, FieldValue>;
  highlightedFieldIds: string[];
}

function formatValue(value: FieldValue): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    return new Intl.NumberFormat("en-US").format(value);
  }
  return value;
}

export function DocumentPreview({
  document,
  fieldOverrides,
  highlightedFieldIds,
}: DocumentPreviewProps) {
  const highlighted = new Set(highlightedFieldIds);

  return (
    <article className="panel document-preview" aria-label={`${document.title} preview`}>
      <header className="document-preview-header">
        <div>
          <p className="section-kicker">Selected document</p>
          <h2>{document.title}</h2>
          <p>{document.issuer}</p>
        </div>
        <span className={`authority-chip ${document.editability}`}>
          {document.editability === "locked"
            ? "Issuer controlled"
            : "Exporter controlled"}
        </span>
      </header>

      <div className="paper-sheet">
        <div className="paper-brand">
          <span>{document.title}</span>
          <small>{document.id}</small>
        </div>

        {document.sections.map((section) => (
          <section key={section.id} className="document-section">
            <h3>{section.title}</h3>
            <dl>
              {section.fieldIds.map((fieldId) => {
                const field = document.fields.find((item) => item.id === fieldId);
                if (!field) return null;
                const overridden = Object.prototype.hasOwnProperty.call(
                  fieldOverrides,
                  field.id,
                );
                const value = overridden
                  ? fieldOverrides[field.id]
                  : field.rawValue;
                return (
                  <div
                    key={field.id}
                    className={`document-field ${
                      highlighted.has(field.id) ? "highlighted" : ""
                    }`}
                    data-field-id={field.id}
                  >
                    <dt>
                      {field.label}
                      {field.untrusted ? (
                        <span className="untrusted-label">Untrusted content</span>
                      ) : null}
                    </dt>
                    <dd>
                      <span className="document-field-value">
                        {formatValue(value)}
                      </span>
                      <span
                        className="document-field-meta"
                        data-source-location
                      >
                        {field.sourceLocation}
                      </span>
                      {overridden ? (
                        <span className="approved-label">Approved correction</span>
                      ) : null}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
      </div>
    </article>
  );
}
