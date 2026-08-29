import type { TradeDocument } from "../domain/types";

interface DocumentListProps {
  documents: TradeDocument[];
  selectedDocumentId: string;
  onSelect: (documentId: string) => void;
}

const ownerLabels = {
  bank: "Bank issued",
  exporter: "Exporter owned",
  carrier: "Carrier issued",
  authority: "Authority issued",
} as const;

export function DocumentList({
  documents,
  selectedDocumentId,
  onSelect,
}: DocumentListProps) {
  return (
    <nav className="panel document-panel" aria-label="Shipment documents">
      <div className="panel-heading">
        <div>
          <p className="section-kicker">Document pack</p>
          <h2>Documents</h2>
        </div>
        <span className="count-badge">{documents.length}</span>
      </div>

      <div className="document-list">
        {documents.map((document) => {
          const selected = document.id === selectedDocumentId;
          const locked = document.editability === "locked";
          return (
            <button
              key={document.id}
              type="button"
              className={`document-item ${selected ? "selected" : ""}`}
              aria-pressed={selected}
              onClick={() => onSelect(document.id)}
            >
              <span className="document-item-title">{document.title}</span>
              <span className="document-item-meta">{document.issuer}</span>
              <span className="badge-row">
                <span className={`mini-badge owner-${document.owner}`}>
                  {ownerLabels[document.owner]}
                </span>
                <span className={`mini-badge ${locked ? "locked" : "editable"}`}>
                  {locked ? "Locked" : "Editable draft"}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
