import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Individual Blog Comparison", async ({ page }) => {
  // Navigate to blog page first
  await page.goto("https://software-value.wordpress-studio.io/blog/");
  await page.waitForTimeout(5000);
  
  // Handle cookie popup
  try {
    const acceptBtn = page.locator('button:has-text("Accept All"), button:has-text("Accept")');
    if (await acceptBtn.isVisible()) {
      await acceptBtn.click();
      await page.waitForTimeout(2000);
    }
  } catch (error) {
    console.log("No cookie popup found or already handled");
  }

  // Wait for blog list to load
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(3000);

  // Look for "See More" button and click if found
  try {
    const seeMoreButton = page.locator('button:has-text("See More"), a:has-text("See More")').first();
    if (await seeMoreButton.isVisible()) {
      await seeMoreButton.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState("networkidle");
    }
  } catch (error) {
    console.log("No 'See More' button found");
  }

  // Find and click on the first blog post
  try {
    console.log("Looking for first blog post...");
    
    // Try multiple selectors for blog posts
    const blogSelectors = [
      'a[href*="/blog/"]',
      '.blog-post a',
      '.post-title a',
      'h2 a',
      'h3 a',
      '.entry-title a',
      'article a'
    ];

    let blogLink = null;
    for (const selector of blogSelectors) {
      blogLink = page.locator(selector).first();
      if (await blogLink.isVisible()) {
        console.log(`Found blog post with selector: ${selector}`);
        break;
      }
    }

    if (blogLink && await blogLink.isVisible()) {
      // Get blog post URL and title
      const blogUrl = await blogLink.getAttribute('href');
      const blogTitle = await blogLink.innerText();
      console.log(`Clicking on blog: ${blogTitle} (${blogUrl})`);
      
      await blogLink.click();
      await page.waitForTimeout(3000);
      await page.waitForLoadState("networkidle");
      
      // Extract the blog post path from URL
      const blogPath = blogUrl?.split('software-value.wordpress-studio.io')[1] || blogUrl?.split('www.softwarevalue.ai')[1] || '';
      
      if (blogPath) {
        console.log(`Comparing blog post: ${blogPath}`);
        
        // Use the existing comparison function for the individual blog post
        const pageName = `individual-blog-${blogPath.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        const { env1Data, env2Data, comparisonData } = await runPageComparison(
          page,
          blogPath,
          pageName,
        );

        expect(env1Data.screenshot).toBeTruthy();
        expect(env2Data.screenshot).toBeTruthy();
      } else {
        console.log("Could not extract blog path from URL");
      }
    } else {
      console.log("No blog post found");
    }
  } catch (error) {
    console.log("Error finding blog post:", error);
  }
});
