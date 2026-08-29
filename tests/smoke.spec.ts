import { expect, test } from "@playwright/test";

test("renders the product shell and honest WebMCP fallback", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /fix what you control\. escalate what you don't\./i,
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Open the live shipment" }).click();
  await expect(page).toHaveURL(/#workspace-demo$/);
  await expect(page.locator("#workspace-demo")).toBeInViewport();
  await expect(
    page.getByRole("heading", { name: "Export Document Pack Preflight" }),
  ).toBeVisible();
  await expect(page.getByLabel("WebMCP capability status")).toContainText(
    "WebMCP not available",
  );
  await expect(page.getByLabel("Product limitation")).toContainText(
    "not a definitive compliance review",
  );
});

test("keeps the landing concise and operable at phone width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const proofFacts = page.getByRole("list", { name: "Product facts" }).getByRole("listitem");
  const firstFact = await proofFacts.nth(0).boundingBox();
  const secondFact = await proofFacts.nth(1).boundingBox();
  expect(firstFact?.y).toBe(secondFact?.y);

  await expect(page.locator(".landing-hero__art figcaption")).toBeHidden();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBe(390);

  await page.getByRole("link", { name: "Open the live shipment" }).click();
  const resetButton = await page
    .getByRole("button", { name: "Reset demonstration" })
    .boundingBox();
  expect(resetButton?.height).toBeGreaterThanOrEqual(44);
});

test("keeps landing headline emphasis visually unified", async ({ page }) => {
  await page.goto("/");

  const palette = await page.evaluate(() => {
    const heading = document.querySelector<HTMLElement>(".landing-hero h1")!;
    const emphasis = document.querySelector<HTMLElement>(".landing-hero h1 span")!;
    const headingColor = getComputedStyle(heading).color;
    const emphasisColor = getComputedStyle(emphasis).color;

    return {
      headingColor,
      emphasisColor,
    };
  });

  expect(palette.emphasisColor).toBe(palette.headingColor);
});

for (const viewport of [
  { label: "phone", width: 390, height: 844 },
  { label: "portrait tablet", width: 834, height: 1112 },
  { label: "large tablet", width: 1024, height: 1366 },
]) {
  test(`keeps the current finding, evidence, and action together on ${viewport.label}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const documents = await page.getByLabel("Shipment documents").boundingBox();
    const findings = await page.getByLabel("Findings list").boundingBox();
    const preview = await page
      .getByLabel(/letter of credit preview/i)
      .boundingBox();
    const evidence = await page.getByLabel("Finding evidence").boundingBox();
    const resolution = await page.getByLabel("Resolution controls").boundingBox();

    expect(documents).not.toBeNull();
    expect(findings).not.toBeNull();
    expect(preview).not.toBeNull();
    expect(evidence).not.toBeNull();
    expect(resolution).not.toBeNull();
    expect(findings!.y).toBeLessThan(evidence!.y);
    expect(evidence!.y).toBeLessThan(resolution!.y);
    expect(resolution!.y).toBeLessThan(preview!.y);
    expect(preview!.y).toBeLessThan(documents!.y);
  });
}

test("keeps operational metadata legible with AA text contrast", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page
    .getByRole("button", { name: /beneficiary-name consistency/i })
    .click();
  await page.getByRole("button", { name: /stage correction/i }).click();

  const metadata = await page.evaluate(() => {
    const luminance = (color: string) => {
      const channels = color
        .match(/[\d.]+/g)!
        .slice(0, 3)
        .map((value) => Number(value) / 255)
        .map((value) =>
          value <= 0.03928
            ? value / 12.92
            : Math.pow((value + 0.055) / 1.055, 2.4),
        );
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const contrast = (foreground: string, background: string) => {
      const lighter = Math.max(luminance(foreground), luminance(background));
      const darker = Math.min(luminance(foreground), luminance(background));
      return (lighter + 0.05) / (darker + 0.05);
    };
    const inspect = (selector: string, backgroundSelector: string) => {
      const element = document.querySelector<HTMLElement>(selector)!;
      const background = element.closest<HTMLElement>(backgroundSelector)!;
      const elementStyle = getComputedStyle(element);
      return {
        contrast: contrast(
          elementStyle.color,
          getComputedStyle(background).backgroundColor,
        ),
        fontSize: Number.parseFloat(elementStyle.fontSize),
      };
    };

    return {
      sourceLocation: inspect(
        ".document-field small, .document-field [data-source-location]",
        ".document-field",
      ),
      activityTime: inspect(".activity-list time", ".activity-panel"),
    };
  });

  expect(metadata.sourceLocation.contrast).toBeGreaterThanOrEqual(4.5);
  expect(metadata.sourceLocation.fontSize).toBeGreaterThanOrEqual(12);
  expect(metadata.activityTime.contrast).toBeGreaterThanOrEqual(4.5);
  expect(metadata.activityTime.fontSize).toBeGreaterThanOrEqual(12);
});

test("keeps desktop evidence visually connected to the document preview", async ({ page }) => {
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto("/");

  const evidence = await page.getByLabel("Finding evidence").boundingBox();
  const preview = await page.getByLabel(/letter of credit preview/i).boundingBox();
  const resolution = await page.getByLabel("Resolution controls").boundingBox();
  const documents = await page.getByLabel("Shipment documents").boundingBox();

  expect(evidence).not.toBeNull();
  expect(preview).not.toBeNull();
  expect(resolution).not.toBeNull();
  expect(documents).not.toBeNull();
  expect(preview!.y - (evidence!.y + evidence!.height)).toBeLessThanOrEqual(16);
  expect(documents!.y - (resolution!.y + resolution!.height)).toBeLessThanOrEqual(16);
});
