import { test, expect } from "@playwright/test";
import { runPageComparison } from "../../utils/ui-comparison-utils";

test.setTimeout(120000);

test("Blog Tag Comparison", async ({ page }) => {
  // Configure which tag to select (0 = first tag, 1 = second tag, etc.)
  const TAG_INDEX = 0; // Change this to select different tag
  
  console.log(`🎯 Configured to compare tag index: ${TAG_INDEX}`);
  
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
      
      console.log("📋 Looking for blog tags...");
      
      // Look for tags on the blog details page
      const tagSelectors = [
        '.single-blog-tags a',
        '.tags a',
        '.post-tags a',
        '.blog-tags a',
        '[class*="tag"] a',
        'a[href*="/tag/"]',
        'a[href*="/category/"]'
      ];

      let tagLink = null;
      let foundSelector = null;
      
      for (const selector of tagSelectors) {
        try {
          const tags = await page.locator(selector).all();
          if (tags.length > 0) {
            console.log(`Found ${tags.length} tags with selector: ${selector}`);
            tagLink = tags[TAG_INDEX];
            foundSelector = selector;
            
            // Display available tags
            console.log("📝 Available tags:");
            for (let i = 0; i < Math.min(tags.length, 5); i++) {
              try {
                const tagText = await tags[i].innerText();
                const tagHref = await tags[i].getAttribute('href');
                if (tagText && tagText.trim()) {
                  console.log(`${i + 1}. ${tagText.trim()} (${tagHref})`);
                }
              } catch (error) {
                console.log(`Error getting tag ${i + 1}:`, error);
              }
            }
            break;
          }
        } catch (error) {
          // Try next selector
        }
      }
      
      if (tagLink && foundSelector) {
        // Validate tag index
        const allTags = await page.locator(foundSelector).all();
        if (TAG_INDEX >= allTags.length) {
          console.log(`\n❌ Invalid TAG_INDEX ${TAG_INDEX}. Only ${allTags.length} tags available.`);
          console.log(`💡 Valid range: 0 to ${allTags.length - 1}`);
          return;
        }
        
        try {
          const tagText = await tagLink.innerText();
          const tagUrl = await tagLink.getAttribute('href');
          console.log(`\n🎯 Selected tag ${TAG_INDEX + 1}: ${tagText.trim()}`);
          
          // Click on the tag
          await tagLink.click();
          await page.waitForTimeout(3000);
          await page.waitForLoadState("networkidle");
          
          // Extract the tag page path from URL
          const tagPath = tagUrl?.split('software-value.wordpress-studio.io')[1] || 
                        tagUrl?.split('www.softwarevalue.ai')[1] || '';
          
          if (tagPath) {
            console.log(`🔍 Comparing tag page: ${tagPath}`);
            
            // Use the existing comparison function for the tag page
            const pageName = `blog-tag-${TAG_INDEX + 1}-${tagPath.replace(/[^a-zA-Z0-9]/g, '-')}`;
            
            const { env1Data, env2Data, comparisonData } = await runPageComparison(
              page,
              tagPath,
              pageName,
            );

            expect(env1Data.screenshot).toBeTruthy();
            expect(env2Data.screenshot).toBeTruthy();
            
            console.log(`\n✅ Tag comparison completed for: ${tagText.trim()}`);
            console.log(`📊 Report saved as: ${pageName}-latest-comparison.html`);
            console.log(`\n🔧 To compare different tag, change TAG_INDEX to: 0-${allTags.length - 1}`);
          } else {
            console.log("❌ Could not extract tag path from URL");
          }
        } catch (error) {
          console.log("❌ Error selecting tag:", error);
        }
      } else {
        console.log("❌ No tags found on blog page");
      }
    } else {
      console.log("❌ No blog post found");
    }
  } catch (error) {
    console.log("❌ Error finding blog post:", error);
  }
});
