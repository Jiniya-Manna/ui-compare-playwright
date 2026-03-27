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

// Page analysis function - enhanced to capture actual content
export async function analyzePage(page: any) {
  const title = await page.title();
  const url = page.url();
  
  // Wait a bit more for content to load
  await page.waitForTimeout(2000);
  
  try {
    // Get all visible text content with better extraction
    const bodyText = await page.evaluate(() => {
      const text = document.body.innerText || "";
      return text.replace(/\s+/g, ' ').trim().substring(0, 3000);
    });
    
    // Get all headings with better extraction
    const headings = await page.evaluate(() => {
      const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
      return Array.from(headingElements).map((el: any) => {
        const text = el.innerText?.trim() || "";
        return text;
      }).filter((text: string) => text.length > 0);
    });
    
    // Get all sections/containers with text
    const sections = await page.evaluate(() => {
      const sectionElements = document.querySelectorAll("section, header, nav, main, footer, div, article, aside");
      return Array.from(sectionElements).map((el: any) => {
        const text = el.innerText?.trim() || "";
        const hasText = text.length > 10;
        return {
          tagName: el.tagName.toLowerCase(),
          className: el.className,
          id: el.id,
          text: text.substring(0, 150),
          hasText
        };
      }).filter((section: any) => section.hasText);
    });
    
    console.log("Page analysis successful - text:", bodyText.length, "headings:", headings.length, "sections:", sections.length);
    
    return {
      title,
      url,
      bodyText,
      headings,
      sections,
      hasContent: bodyText.length > 0 || headings.length > 0 || sections.length > 0
    };
  } catch (error) {
    console.log("Text extraction failed:", error);
    return {
      title,
      url,
      bodyText: "",
      headings: [],
      sections: [],
      hasContent: false
    };
  }
}

// Enhanced mismatch detection with actual section comparison
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

  console.log("=== ENHANCED COMPARISON DEBUG ===");
  console.log("Env1 has content:", env1Data.hasContent);
  console.log("Env2 has content:", env2Data.hasContent);
  console.log("Env1 body text length:", env1Data.bodyText?.length || 0);
  console.log("Env2 body text length:", env2Data.bodyText?.length || 0);
  console.log("Env1 headings:", env1Data.headings?.length || 0);
  console.log("Env2 headings:", env2Data.headings?.length || 0);
  console.log("Env1 sections:", env1Data.sections?.length || 0);
  console.log("Env2 sections:", env2Data.sections?.length || 0);

  // Compare sections and identify missing content
  if (env1Data.sections && env2Data.sections && env1Data.sections.length > 0 && env2Data.sections.length > 0) {
    const env1SectionTexts = env1Data.sections.map((s: any) => s.text.toLowerCase().trim()).filter((t: string) => t);
    const env2SectionTexts = env2Data.sections.map((s: any) => s.text.toLowerCase().trim()).filter((t: string) => t);
    
    console.log("Env1 section texts:", env1SectionTexts.slice(0, 5));
    console.log("Env2 section texts:", env2SectionTexts.slice(0, 5));
    
    // Find sections missing in production (env2)
    env1Data.sections.forEach((section: any) => {
      const sectionText = section.text.toLowerCase().trim();
      if (sectionText && sectionText.length > 15 && !env2SectionTexts.includes(sectionText)) {
        points.push(`Missing in Production: ${section.tagName.toUpperCase()} "${section.text}"`);
      }
    });
    
    // Find sections missing in staging (env1)
    env2Data.sections.forEach((section: any) => {
      const sectionText = section.text.toLowerCase().trim();
      if (sectionText && sectionText.length > 15 && !env1SectionTexts.includes(sectionText)) {
        points.push(`Missing in Staging: ${section.tagName.toUpperCase()} "${section.text}"`);
      }
    });
  }

  // Compare headings
  if (env1Data.headings && env2Data.headings) {
    const env1HeadingTexts = env1Data.headings.map((h: string) => h.toLowerCase().trim()).filter((t: string) => t);
    const env2HeadingTexts = env2Data.headings.map((h: string) => h.toLowerCase().trim()).filter((t: string) => t);
    
    console.log("Env1 heading texts:", env1HeadingTexts.slice(0, 3));
    console.log("Env2 heading texts:", env2HeadingTexts.slice(0, 3));
    
    // Find headings missing in production
    env1Data.headings.forEach((heading: string) => {
      const headingText = heading.toLowerCase().trim();
      if (headingText && headingText.length > 5 && !env2HeadingTexts.includes(headingText)) {
        points.push(`Missing in Production: Heading "${heading}"`);
      }
    });
    
    // Find headings missing in staging
    env2Data.headings.forEach((heading: string) => {
      const headingText = heading.toLowerCase().trim();
      if (headingText && headingText.length > 5 && !env1HeadingTexts.includes(headingText)) {
        points.push(`Missing in Staging: Heading "${heading}"`);
      }
    });
  }

  // Compare body text for missing content
  if (env1Data.bodyText && env2Data.bodyText && env1Data.bodyText !== env2Data.bodyText) {
    // Find missing text chunks
    const env1Sentences = env1Data.bodyText.split('.').filter((s: string) => s.trim().length > 15);
    const env2Sentences = env2Data.bodyText.split('.').filter((s: string) => s.trim().length > 15);
    
    env1Sentences.forEach((sentence: string) => {
      if (!env2Data.bodyText.includes(sentence.trim())) {
        points.push(`Missing in Production: "${sentence.trim().substring(0, 100)}..."`);
      }
    });
    
    env2Sentences.forEach((sentence: string) => {
      if (!env1Data.bodyText.includes(sentence.trim())) {
        points.push(`Missing in Staging: "${sentence.trim().substring(0, 100)}..."`);
      }
    });
  }

  // Add visual difference information
  if (!sizeMatch) {
    points.push(`Visual difference: ${(sizeDifference / 1024).toFixed(2)} KB (${differencePercent.toFixed(2)}%)`);
    
    if (differencePercent > 20) {
      points.push("Major visual differences detected");
    } else if (differencePercent > 10) {
      points.push("Significant visual differences detected");
    } else if (differencePercent > 5) {
      points.push("Moderate visual differences detected");
    }
  }

  // Add general mismatch information
  if (!titleMatch) points.push(`Title differs: "${env1Title}" vs "${env2Title}"`);
  if (!urlStructureMatch) points.push("URL structure mismatch between environments");

  // If no content was extracted
  if (!env1Data.hasContent && !env2Data.hasContent) {
    points.push("Content extraction failed - comparison based on screenshots only");
  }

  console.log("Final mismatch points:", points);
  console.log("=== END ENHANCED COMPARISON DEBUG ===");
  
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
  await page.waitForTimeout(5000); // Extra wait for content to load

  // Add debug info before analysis
  console.log(`=== BEFORE ANALYSIS - ${url} ===`);
  console.log("Page title:", await page.title());
  console.log("Page URL:", page.url());
  
  const analysisData = await analyzePage(page);
  
  console.log(`=== AFTER ANALYSIS - ${url} ===`);
  console.log("Sections found:", analysisData.sections?.length || 0);
  console.log("Headings found:", analysisData.headings?.length || 0);
  console.log("Body text length:", analysisData.bodyText?.length || 0);

  const screenshot = await page.screenshot({
    fullPage: true,
    path: join(screenshotDir, `${url === ENV_CONFIG.ENV1_URL ? "env1" : "env2"}_${pageName}.png`),
  });

  // Return the full analysis data, not nested
  return { 
    sections: analysisData.sections, 
    screenshot, 
    title: analysisData.title || await page.title(), 
    url: analysisData.url || page.url(),
    bodyText: analysisData.bodyText,
    headings: analysisData.headings,
    hasContent: analysisData.hasContent
  };
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
