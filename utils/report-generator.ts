import { writeFileSync } from 'fs';
import { join } from 'path';

export interface ComparisonData {
  isMatch: boolean;
  mismatchPoints: string[];
  sizeDifference: number;
  differencePercent: number;
  sizeMatch: boolean;
  titleMatch: boolean;
  urlStructureMatch: boolean;
  env1Title: string;
  env1Url: string;
  env1Screenshot: Buffer;
  env2Title: string;
  env2Url: string;
  env2Screenshot: Buffer;
  ENV1_NAME: string;
  ENV2_NAME: string;
  pageName: string;
  screenshotDir: string;
}

export function generateHtmlReport(data: ComparisonData): string {
  const {
    isMatch,
    mismatchPoints,
    sizeDifference,
    differencePercent,
    sizeMatch,
    titleMatch,
    urlStructureMatch,
    env1Title,
    env1Url,
    env1Screenshot,
    env2Title,
    env2Url,
    env2Screenshot,
    ENV1_NAME,
    ENV2_NAME,
    pageName,
    screenshotDir,
  } = data;

  return `<!DOCTYPE html>
<html>
<head>
    <title>UI Comparison Report - ${pageName}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .result-box { padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .match { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .mismatch { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .result-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .page-name { font-size: 20px; color: #666; margin-bottom: 15px; }
        .stats { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .comparison-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .environment { border: 1px solid #ddd; border-radius: 8px; padding: 15px; }
        .env1 { border-left: 4px solid #ff6b6b; }
        .env2 { border-left: 4px solid #4ecdc4; }
        .screenshot-container { text-align: center; margin-top: 15px; }
        .screenshot-container img { max-width: 100%; height: auto; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .details { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
        .detail-item { background: #f8f9fa; padding: 10px; border-radius: 4px; }
        h1 { color: #333; }
        h2 { color: #555; margin-top: 0; }
        .url { word-break: break-all; color: #0066cc; font-size: 12px; }
        .mismatch-points { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .mismatch-points h3 { color: #856404; margin-top: 0; }
        .mismatch-points ul { margin: 10px 0; padding-left: 20px; }
        .mismatch-points li { color: #856404; margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔍 UI Comparison Report</h1>
            <div class="page-name">📄 Page: ${pageName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
            <p>Generated: ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="${isMatch ? 'match' : 'mismatch'} result-box">
            <div class="result-title">
                ${isMatch ? '✅ PAGES MATCH' : '❌ PAGES MISMATCH'}
            </div>
            <p>UI comparison result based on visual analysis</p>
        </div>
        
        ${!isMatch && mismatchPoints.length > 0 ? `
        <div class="mismatch-points">
            <h3>⚠️ UI Mismatch Points Detected:</h3>
            <ul>
                ${mismatchPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
            <p><em>Review the screenshots below to identify specific visual differences</em></p>
        </div>
        ` : ''}
        
        <div class="stats">
            <h2>📊 Comparison Metrics</h2>
            <div class="details">
                <div class="detail-item">
                    <strong>Overall Match:</strong><br>
                    ${isMatch ? '✅ All Sections Match' : '❌ Sections Mismatch'}
                </div>
                <div class="detail-item">
                    <strong>Size Match:</strong><br>
                    ${sizeMatch ? '✅ Yes' : '❌ No'} (${differencePercent.toFixed(2)}% < 3%)
                </div>
                <div class="detail-item">
                    <strong>Title Match:</strong><br>
                    ${titleMatch ? '✅ Yes' : '❌ No'}
                </div>
                <div class="detail-item">
                    <strong>URL Structure:</strong><br>
                    ${urlStructureMatch ? '✅ Valid' : '❌ Invalid'}
                </div>
                <div class="detail-item">
                    <strong>Match Criteria:</strong><br>
                    Size + Title + URL Structure
                </div>
            </div>
        </div>
        
        <div class="comparison-grid">
            <div class="environment env1">
                <h2>🔴 ${ENV1_NAME}</h2>
                <p><strong>Title:</strong> ${env1Title}</p>
                <p><strong>URL:</strong> <span class="url">${env1Url}</span></p>
                <p><strong>Screenshot Size:</strong> ${(data.env1Screenshot.length / 1024 / 1024).toFixed(2)} MB</p>
                <div class="screenshot-container">
                    <img src="env1_${pageName}.png" alt="${ENV1_NAME}" />
                    <p><em>${ENV1_NAME} Screenshot</em></p>
                </div>
            </div>
            
            <div class="environment env2">
                <h2>🔵 ${ENV2_NAME}</h2>
                <p><strong>Title:</strong> ${env2Title}</p>
                <p><strong>URL:</strong> <span class="url">${env2Url}</span></p>
                <p><strong>Screenshot Size:</strong> ${(data.env2Screenshot.length / 1024 / 1024).toFixed(2)} MB</p>
                <div class="screenshot-container">
                    <img src="env2_${pageName}.png" alt="${ENV2_NAME}" />
                    <p><em>${ENV2_NAME} Screenshot</em></p>
                </div>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><strong>📁 Screenshots Location:</strong> ${screenshotDir}</p>
            <p><em>Compare the screenshots above to identify visual differences</em></p>
        </div>
    </div>
</body>
</html>`;
}
