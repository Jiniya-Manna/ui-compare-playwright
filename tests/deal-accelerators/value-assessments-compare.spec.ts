import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Value Assessments Comparison", async ({ page }) => {
  const pagePath = "/value-assessments";
  const pageName = "value-assessments";

  const { env1Data, env2Data, comparisonData } = await runPageComparison(
    page,
    pagePath,
    pageName,
  );

  expect(env1Data.screenshot).toBeTruthy();
  expect(env2Data.screenshot).toBeTruthy();
});
