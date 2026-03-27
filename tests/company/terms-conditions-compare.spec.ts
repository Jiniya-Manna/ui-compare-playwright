import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Terms & Conditions Comparison", async ({ page }) => {
  const pagePath = "/terms-and-conditions";
  const pageName = "terms-and-conditions";

  console.log("🔍 Comparing Terms & Conditions page...");

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
  
  console.log("✅ Terms & Conditions comparison completed");
  console.log(`📊 Report saved as: ${pageName}-latest-comparison.html`);
});
