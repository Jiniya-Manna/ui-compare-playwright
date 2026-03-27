import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { generateHtmlReport, ComparisonData } from "./report-generator";

// Environment configuration
export const ENV_CONFIG = {
  ENV1_URL: process.env.ENV1_URL || "https://software-value.wordpress-studio.io",
  ENV2_URL: process.env.ENV2_URL || "https://www.softwarevalue.ai",
  ENV1_NAME: "Staging",
  ENV2_NAME: "Production",
};

// Page analysis function
export async function analyzePage(page: any) {
  return await page.evaluate(() => {
    const getElements = (selector: string) =>
      Array.from(document.querySelectorAll(selector)).map((el: Element) => {
        const rect = el.getBoundingClientRect();
        return {
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          text: (el as HTMLElement).innerText?.substring(0, 200) || "",
          top: rect.top,
          height: rect.height,
          visible: rect.height > 0,
        };
      });

    return {
      sections: getElements("section, header, nav, main, footer, .section, .container"),
      headings: Array.from(document.querySelectorAll("h1, h2, h3, h4, h5, h6"))
        .map((el: Element, index: number) => {
          const rect = el.getBoundingClientRect();
          return {
            index,
            level: parseInt(el.tagName.substring(1)),
            text: (el as HTMLElement).innerText?.trim() || "",
            top: rect.top,
            visible: rect.height > 0,
          };
        }),
    };
  });
}

// Enhanced mismatch detection with section content analysis
export function generateMismatchPoints(
  env1Data: any,
  env2Data: any,
  sizeMatch: boolean,
  titleMatch: boolean,
  urlStructureMatch: boolean,
  sizeDifference: number,
  differencePercent: number,
  env1Title: string,
  env2Title: string,
) {
  const points = [];

  // Check sections count
  if (env1Data.sections && env2Data.sections && env1Data.sections.length !== env2Data.sections.length) {
    const diff = env1Data.sections.length - env2Data.sections.length;
    points.push(
      `Sections: ${
        diff > 0
          ? diff + " missing in Production"
          : Math.abs(diff) + " missing in Staging"
      }`,
    );
  }

  // Check headings count
  if (env1Data.headings && env2Data.headings && env1Data.headings.length !== env2Data.headings.length) {
    const diff = env1Data.headings.length - env2Data.headings.length;
    points.push(
      `Headings: ${
        diff > 0
          ? diff + " missing in Production"
          : Math.abs(diff) + " missing in Staging"
      }`,
    );
  }

  if (!sizeMatch) points.push(`Size difference: ${(sizeDifference / 1024).toFixed(2)} KB (${differencePercent.toFixed(2)}%)`);
  if (!titleMatch) points.push(`Title differs: "${env1Title}" vs "${env2Title}"`);
  if (!urlStructureMatch) points.push("URL structure mismatch between environments");
  
  return points;
}

// Cookie popup handling
export async function handleCookiePopup(page: any) {
  try {
    const acceptBtn = page.locator(
      'button#cky-btn-accept, button:has-text("Accept All"), button:has-text("Accept")',
    );

    await acceptBtn.first().waitFor({ state: "visible", timeout: 8000 });
    await acceptBtn.first().click();

    await page.waitForTimeout(1500);
  } catch {
    // fallback (force remove cookie banner)
    await page.evaluate(() => {
      const cookie = document.querySelectorAll(
        '.cky-consent-container, [id*="cookie"], [class*="cookie"]',
      );
      cookie.forEach((el: any) => el.remove());
    });
  }
}

// Remove other popups
export async function removeOtherPopups(page: any) {
  await page.evaluate(() => {
    const modals = document.querySelectorAll(
      '.modal, .popup, .dialog, .overlay, [role="dialog"]',
    );
    modals.forEach((el: any) => el.remove());
  });
}

// Test environment function
export async function testEnvironment(
  page: any,
  url: string,
  pagePath: string,
  screenshotDir: string,
  pageName: string,
) {
  await page.goto(url + pagePath);
  await page.waitForTimeout(10000);

  await handleCookiePopup(page);
  await removeOtherPopups(page);

  await page.waitForLoadState("networkidle");

  const sections = await analyzePage(page);

  const screenshot = await page.screenshot({
    fullPage: true,
    path: join(screenshotDir, `${url === ENV_CONFIG.ENV1_URL ? "env1" : "env2"}_${pageName}.png`),
  });

  return { sections, screenshot, title: await page.title(), url: page.url() };
}

// Generate comparison data
export function generateComparisonData(
  env1Data: any,
  env2Data: any,
  pageName: string,
  screenshotDir: string,
) {
  const sizeDifference = Math.abs(
    env1Data.screenshot.length - env2Data.screenshot.length,
  );
  const differencePercent =
    (sizeDifference /
      Math.max(env1Data.screenshot.length, env2Data.screenshot.length)) *
    100;
  const sizeMatch = differencePercent < 3;
  const titleMatch = env1Data.title === env2Data.title;
  const urlStructureMatch =
    env1Data.url.includes(env1Data.url.split("/")[2]) &&
    env2Data.url.includes(env2Data.url.split("/")[2]);

  const mismatchPoints = generateMismatchPoints(
    env1Data,
    env2Data,
    sizeMatch,
    titleMatch,
    urlStructureMatch,
    sizeDifference,
    differencePercent,
    env1Data.title,
    env2Data.title,
  );

  return {
    isMatch:
      sizeMatch && titleMatch && urlStructureMatch && mismatchPoints.length === 0,
    mismatchPoints,
    sizeDifference,
    differencePercent,
    sizeMatch,
    titleMatch,
    urlStructureMatch,
    env1Title: env1Data.title,
    env1Url: env1Data.url,
    env1Screenshot: env1Data.screenshot,
    env2Title: env2Data.title,
    env2Url: env2Data.url,
    env2Screenshot: env2Data.screenshot,
    ENV1_NAME: ENV_CONFIG.ENV1_NAME,
    ENV2_NAME: ENV_CONFIG.ENV2_NAME,
    pageName,
    screenshotDir,
  };
}

// Save reports and screenshots
export function saveComparisonResults(comparisonData: ComparisonData, screenshotDir: string, pageName: string) {
  const htmlReport = generateHtmlReport(comparisonData);
  writeFileSync(join(screenshotDir, `${pageName}-comparison-report.html`), htmlReport);
  writeFileSync(join(screenshotDir, `${pageName}-latest-comparison.html`), htmlReport);
}

// Main comparison function
export async function runPageComparison(
  page: any,
  pagePath: string,
  pageName: string,
) {
  const screenshotDir = "test-results";
  
  mkdirSync(screenshotDir, { recursive: true });

  const env1Data = await testEnvironment(
    page,
    ENV_CONFIG.ENV1_URL,
    pagePath,
    screenshotDir,
    pageName,
  );

  const env2Data = await testEnvironment(
    page,
    ENV_CONFIG.ENV2_URL,
    pagePath,
    screenshotDir,
    pageName,
  );

  const comparisonData = generateComparisonData(
    env1Data,
    env2Data,
    pageName,
    screenshotDir,
  );

  saveComparisonResults(comparisonData, screenshotDir, pageName);

  return {
    env1Data,
    env2Data,
    comparisonData,
  };
}
