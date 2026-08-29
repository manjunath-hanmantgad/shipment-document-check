const STEPS = [
  {
    number: "01",
    title: "INSPECT",
    description:
      "Agent reads the active pack through structured WebMCP tools.",
  },
  {
    number: "02",
    title: "RESOLVE BY AUTHORITY",
    description: (
      <>
        Exporter drafts can be staged.
        <br />
        Issuer-owned documents remain locked.
        <br />
        Ambiguity returns to the human.
      </>
    ),
  },
  {
    number: "03",
    title: "RERUN",
    description:
      "Human and agent operate the same visible case and the deterministic preflight runs again.",
  },
] as const;

export function WebMcpIntro() {
  return (
    <section
      id="webmcp-intro"
      className="webmcp-intro"
      aria-labelledby="webmcp-intro-title"
    >
      <div className="webmcp-intro__inner">
        <h2 id="webmcp-intro-title">
          The agent can act.
          <span>The page decides what it is allowed to do.</span>
        </h2>

        <ol className="webmcp-intro__steps">
          {STEPS.map((step) => (
            <li key={step.number}>
              <span className="webmcp-intro__number" aria-hidden="true">
                {step.number}
              </span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
