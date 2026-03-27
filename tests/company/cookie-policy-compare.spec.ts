import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Cookie Policy Comparison", async ({ page }) => {
  const pagePath = "/cookie-policy";
  const pageName = "cookie-policy";

  console.log("🔍 Comparing Cookie Policy page...");

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
  
  console.log("✅ Cookie Policy comparison completed");
  console.log(`📊 Report saved as: ${pageName}-latest-comparison.html`);
});
