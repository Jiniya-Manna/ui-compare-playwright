import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Data Processing Addendum Comparison", async ({ page }) => {
  const pagePath = "/data-processing-addendum";
  const pageName = "data-processing-addendum";

  console.log("🔍 Comparing Data Processing Addendum page...");

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
  
  console.log("✅ Data Processing Addendum comparison completed");
  console.log(`📊 Report saved as: ${pageName}-latest-comparison.html`);
});
