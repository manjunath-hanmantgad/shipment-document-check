import type { Finding } from "../domain/types";

interface EvidencePanelProps {
  finding: Finding | null;
}

const authorityLabels = {
  exporter_editable: "Exporter can correct",
  external_issuer: "External issuer required",
  human_judgement: "Human judgement required",
} as const;

export function EvidencePanel({ finding }: EvidencePanelProps) {
  return (
    <section className="panel detail-panel evidence-panel" aria-label="Finding evidence">
      <div className="panel-heading compact">
        <div>
          <p className="section-kicker">Source-grounded review</p>
          <h2>Evidence</h2>
        </div>
      </div>

      {!finding ? (
        <p className="empty-state">Select a finding to inspect its source values.</p>
      ) : (
        <>
          <div className="evidence-intro">
            <div>
              <h3>{finding.title}</h3>
              <p>{finding.explanation}</p>
            </div>
            <span className={`authority-chip authority-${finding.authority}`}>
              {authorityLabels[finding.authority]}
            </span>
          </div>

          <div className="evidence-grid">
            {finding.sources.map((source) => (
              <article key={source.fieldId} className="evidence-card">
                <header>
                  <strong>{source.documentTitle}</strong>
                  {source.untrusted ? (
                    <span>Document data, not instructions</span>
                  ) : null}
                </header>
                <dl>
                  <div>
                    <dt>{source.fieldLabel}</dt>
                    <dd>{source.rawValue}</dd>
                  </div>
                  <div>
                    <dt>Normalized for comparison</dt>
                    <dd>{source.normalizedValue}</dd>
                  </div>
                  <div>
                    <dt>Source location</dt>
                    <dd>{source.sourceLocation}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
