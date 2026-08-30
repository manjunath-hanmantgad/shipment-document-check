const PRODUCT_FACTS = [
  "5 DOCUMENTS",
  "9 CHECKS",
  "6 WEBMCP TOOLS",
  "3 AUTHORITY PATHS",
] as const;

export function LandingHero() {
  return (
    <section className="landing-hero" aria-labelledby="landing-hero-title">
      <div className="landing-hero__layout">
        <div className="landing-hero__copy">
          <p className="landing-hero__eyebrow">
            BROWSER-NATIVE DOCUMENT PREFLIGHT
          </p>
          <h1 id="landing-hero-title">
            Fix what you control.
            <span>Escalate what you don&apos;t.</span>
          </h1>
          <p className="landing-hero__support">
            Review an export shipment pack with an agent while the page itself
            enforces who can change each document, what must go back to an
            external issuer, and what still requires human judgement.
          </p>
          <div className="landing-hero__actions">
            <a className="landing-hero__primary" href="#workspace-demo">
              Open the live shipment
              <span aria-hidden="true">↘</span>
            </a>
            <a className="landing-hero__secondary" href="#webmcp-intro">
              See why WebMCP matters <span aria-hidden="true">↓</span>
            </a>
          </div>
          <ul className="landing-hero__proof" aria-label="Product facts">
            {PRODUCT_FACTS.map((fact) => (
              <li key={fact}>{fact}</li>
            ))}
          </ul>
        </div>

        <figure className="landing-hero__art">
          <img
            src="/assets/landing/shipment-document-check-hero.webp"
            width="1600"
            height="1100"
            loading="eager"
            fetchPriority="high"
            alt="A hand compares two marked trade documents beside a container port and browser-agent cursor."
          />
          <span className="landing-hero__annotation" aria-hidden="true" />
          <figcaption>
            Document evidence stays visible while authority governs every action.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
