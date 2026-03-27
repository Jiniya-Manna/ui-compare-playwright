# UI Environment Comparison with Playwright

Automated visual comparison between two environments to ensure UI consistency.

## Features

- **Visual Regression Testing**: Pixel-perfect comparison between environments
- **Multi-viewport Testing**: Desktop, tablet, and mobile responsive testing
- **Dynamic Page Discovery**: Automatically crawl and discover all pages
- **CI/CD Integration**: Run in pipelines for automated testing
- **Comprehensive Reporting**: HTML reports with visual diffs

## Setup

1. Install dependencies:
```bash
npm install
npm run install-deps
```

2. Configure environments:
```bash
cp .env.example .env
# Edit .env with your environment URLs
```

3. Update pages to test in `tests/environment-comparison.spec.ts`

## Usage

### Run Environment Comparison
```bash
# Run all comparison tests
npm test

# Run with interactive UI
npm run test:ui

# View HTML report
npm run report
```

### Page Discovery
```bash
# Discover all pages automatically
npx playwright test tests/page-discovery.spec.ts
```

## Configuration

### Environment URLs
Set your environment URLs in `.env`:
```env
STAGING_URL=https://staging.yourapp.com
PRODUCTION_URL=https://www.yourapp.com
```

### Custom Pages
Update `PAGES_TO_TEST` in `tests/environment-comparison.spec.ts`:
```typescript
const PAGES_TO_TEST = [
  '/',
  '/about',
  '/products',
  // Add your pages here
];
```

### Viewport Sizes
Modify `VIEWPORTS` array for different screen sizes:
```typescript
const VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 667, name: 'mobile' },
];
```

## Advanced Features

### Authentication
For protected pages, add authentication logic:
```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', process.env.USERNAME);
  await page.fill('#password', process.env.PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
});
```

### Ignore Regions
Exclude dynamic content from comparison:
```typescript
await page.locator('.dynamic-content').evaluate(el => el.style.display = 'none');
```

### Custom Wait Conditions
Handle complex loading scenarios:
```typescript
await page.waitForFunction(() => {
  return document.querySelector('[data-loaded="true"]') !== null;
});
```

## CI/CD Integration

### GitHub Actions
```yaml
name: UI Comparison
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run install-deps
      - run: npm test
        env:
          STAGING_URL: ${{ secrets.STAGING_URL }}
          PRODUCTION_URL: ${{ secrets.PRODUCTION_URL }}
```

### Docker Support
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run install-deps
CMD ["npm", "test"]
```

## Troubleshooting

### Common Issues

1. **Dynamic Content**: Use wait conditions and ignore regions
2. **Authentication**: Set up login flows in test hooks
3. **Performance**: Use parallel execution and limit viewport sizes
4. **False Positives**: Adjust comparison thresholds and ignore dynamic elements

### Debug Mode
```bash
# Run with debugging
npx playwright test --debug

# Run with trace viewer
npx playwright test --trace on
```

## Alternative Frameworks

If Playwright doesn't fit your needs, consider:

- **Cypress + cypress-image-snapshot**
- **Puppeteer + pixelmatch**
- **WebdriverIO + wdio-image-comparison-service**

## Best Practices

1. **Start Small**: Test critical pages first
2. **Use CI Integration**: Automate in deployment pipeline
3. **Handle Dynamic Content**: Exclude timestamps, counters, etc.
4. **Monitor Performance**: Track test execution time
5. **Regular Updates**: Keep dependencies current
# ui-compare-playwright
