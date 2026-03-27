import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Homepage Comparison", async ({ page }) => {
  const pagePath = "/";
  const pageName = "homepage";

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
});
