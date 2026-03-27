import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Blog Category Comparison", async ({ page }) => {
  // Configure which category to select (0 = first category, 1 = second category, etc.)
  const CATEGORY_INDEX = 0; // Change this to select different category
  
  console.log(`🎯 Configured to compare category index: ${CATEGORY_INDEX}`);
  
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
    // Handle silently
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
    // Handle silently
  }

  // Find and click on the first blog post to get to blog details page
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
      
      console.log("📋 Looking for blog categories...");
      
      // Look for categories on the blog details page
      const categorySelectors = [
        '.categories-single-post a',
        '.categories a',
        '.post-categories a',
        '.blog-categories a',
        '[class*="category"] a',
        'a[href*="/category/"]',
        'a[href*="/cat/"]'
      ];

      let categoryLink = null;
      let foundSelector = null;
      
      for (const selector of categorySelectors) {
        try {
          const categories = await page.locator(selector).all();
          if (categories.length > 0) {
            console.log(`Found ${categories.length} categories with selector: ${selector}`);
            categoryLink = categories[CATEGORY_INDEX];
            foundSelector = selector;
            
            // Display available categories
            console.log("📝 Available categories:");
            for (let i = 0; i < Math.min(categories.length, 5); i++) {
              try {
                const categoryText = await categories[i].innerText();
                const categoryHref = await categories[i].getAttribute('href');
                if (categoryText && categoryText.trim()) {
                  console.log(`${i + 1}. ${categoryText.trim()} (${categoryHref})`);
                }
              } catch (error) {
                console.log(`Error getting category ${i + 1}:`, error);
              }
            }
            break;
          }
        } catch (error) {
          // Try next selector
        }
      }
      
      if (categoryLink && foundSelector) {
        // Validate category index
        const allCategories = await page.locator(foundSelector).all();
        if (CATEGORY_INDEX >= allCategories.length) {
          console.log(`\n❌ Invalid CATEGORY_INDEX ${CATEGORY_INDEX}. Only ${allCategories.length} categories available.`);
          console.log(`💡 Valid range: 0 to ${allCategories.length - 1}`);
          return;
        }
        
        try {
          const categoryText = await categoryLink.innerText();
          const categoryUrl = await categoryLink.getAttribute('href');
          console.log(`\n🎯 Selected category ${CATEGORY_INDEX + 1}: ${categoryText.trim()}`);
          
          // Click on the category
          await categoryLink.click();
          await page.waitForTimeout(3000);
          await page.waitForLoadState("networkidle");
          
          // Extract the category page path from URL
          const categoryPath = categoryUrl?.split('software-value.wordpress-studio.io')[1] || 
                            categoryUrl?.split('www.softwarevalue.ai')[1] || '';
          
          if (categoryPath) {
            console.log(`🔍 Comparing category page: ${categoryPath}`);
            
            // Use the existing comparison function for the category page
            const pageName = `blog-category-${CATEGORY_INDEX + 1}-${categoryPath.replace(/[^a-zA-Z0-9]/g, '-')}`;
            
            const { env1Data, env2Data, comparisonData } = await runPageComparison(
              page,
              categoryPath,
              pageName,
            );

            expect(env1Data.screenshot).toBeTruthy();
            expect(env2Data.screenshot).toBeTruthy();
            
            console.log(`\n✅ Category comparison completed for: ${categoryText.trim()}`);
            console.log(`📊 Report saved as: ${pageName}-latest-comparison.html`);
            console.log(`\n🔧 To compare different category, change CATEGORY_INDEX to: 0-${allCategories.length - 1}`);
          } else {
            console.log("❌ Could not extract category path from URL");
          }
        } catch (error) {
          console.log("❌ Error selecting category:", error);
        }
      } else {
        console.log("❌ No categories found on blog page");
      }
    } else {
      console.log("❌ No blog post found");
    }
  } catch (error) {
    console.log("❌ Error finding blog post:", error);
  }
});
