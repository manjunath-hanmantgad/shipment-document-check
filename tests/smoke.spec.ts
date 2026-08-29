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
