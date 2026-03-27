import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Value Coach Comparison", async ({ page }) => {
  const pagePath = "/value-coach";
  const pageName = "value-coach";

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
});
