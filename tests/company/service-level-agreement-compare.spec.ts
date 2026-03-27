import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Service Level Agreement Comparison", async ({ page }) => {
  const pagePath = "/service-level-agreement";
  const pageName = "service-level-agreement";

  console.log("🔍 Comparing Service Level Agreement page...");

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
  
  console.log("✅ Service Level Agreement comparison completed");
  console.log(`📊 Report saved as: ${pageName}-latest-comparison.html`);
});
