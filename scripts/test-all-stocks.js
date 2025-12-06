/**
 * Test Script: Phase 2 + Phase 3 API Testing
 * Tests all stocks in nasdaq and nyse folders
 * Outputs results to test-results.md
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const OUTPUT_FILE = path.join(__dirname, '..', 'test-results.md');

// Extract ticker from filename (e.g., "AAPL_애플.json" -> "AAPL")
function extractTicker(filename) {
  return filename.split('_')[0];
}

// Get all tickers from nasdaq and nyse folders
function getAllTickers() {
  const nasdaqPath = path.join(__dirname, '..', 'data', 'stocks', 'finance', 'nasdaq');
  const nysePath = path.join(__dirname, '..', 'data', 'stocks', 'finance', 'nyse');

  const nasdaqFiles = fs.existsSync(nasdaqPath) ? fs.readdirSync(nasdaqPath) : [];
  const nyseFiles = fs.existsSync(nysePath) ? fs.readdirSync(nysePath) : [];

  const nasdaqTickers = nasdaqFiles
    .filter(f => f.endsWith('.json'))
    .map(extractTicker);

  const nyseTickers = nyseFiles
    .filter(f => f.endsWith('.json'))
    .map(extractTicker);

  return {
    nasdaq: nasdaqTickers,
    nyse: nyseTickers,
    all: [...nasdaqTickers, ...nyseTickers]
  };
}

// Fetch API with error handling
async function fetchAPI(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    }
    return await response.json();
  } catch (error) {
    return { error: error.message };
  }
}

// Format Phase 2 result (Combined Data)
function formatPhase2(data) {
  if (data.error) {
    return `**Error**: ${data.error}`;
  }

  const { ticker, market_status, financial_history } = data;

  let output = `**Ticker**: ${ticker}\n`;
  output += `**Data Source**: ${data.data_source}\n\n`;

  output += `**Market Status**:\n`;
  output += `- Current Price: $${market_status.current_price.toFixed(2)}\n`;
  output += `- Market Cap: $${(market_status.market_cap / 1e9).toFixed(2)}B\n`;
  output += `- 52W High: $${market_status['52w_high'].toFixed(2)}\n`;
  output += `- 52W Low: $${market_status['52w_low'].toFixed(2)}\n`;
  output += `- 200D MA: $${market_status['200d_ma'].toFixed(2)}\n`;
  output += `- TTM PER: ${market_status.ttm_per ? market_status.ttm_per.toFixed(2) : 'N/A'}\n\n`;

  output += `**Financial History** (${financial_history.length} years):\n\n`;
  output += `| Year | EPS | ROE | PER | PBR | PSR | SPS | FCF |\n`;
  output += `|------|-----|-----|-----|-----|-----|-----|-----|\n`;

  financial_history.forEach(h => {
    output += `| ${h.year} | ${h.eps.toFixed(2)} | ${h.roe.toFixed(1)}% | ${h.per.toFixed(1)} | ${h.pbr.toFixed(1)} | ${h.psr.toFixed(1)} | ${h.sps.toFixed(2)} | $${(h.fcf / 1e9).toFixed(1)}B |\n`;
  });

  return output;
}

// Format Phase 3 result (Investment Analysis)
function formatPhase3(data) {
  if (data.error) {
    return `**Error**: ${data.error}`;
  }

  const { ticker, meta, results } = data;

  let output = `**Ticker**: ${ticker}\n`;
  output += `**Current Price**: $${meta.current_price.toFixed(2)}\n`;
  output += `**Data Period**: ${meta.data_period_used}\n\n`;

  output += `### Investment Verdicts\n\n`;

  const algorithms = [
    { key: 'buffett', name: 'Warren Buffett (Quality & Value)' },
    { key: 'lynch', name: 'Peter Lynch (Growth at Reasonable Price)' },
    { key: 'graham', name: 'Benjamin Graham (Deep Value)' },
    { key: 'fisher', name: 'Ken Fisher (Sales-Based)' },
    { key: 'druckenmiller', name: 'Stanley Druckenmiller (Trend Following)' },
    { key: 'marks', name: 'Howard Marks (Cycle/Contrarian)' }
  ];

  algorithms.forEach(({ key, name }) => {
    const result = results[key];
    output += `#### ${name}\n`;
    output += `- **Verdict**: ${result.verdict}\n`;

    if (result.target_price !== null && result.target_price !== undefined) {
      output += `- **Target Price**: $${result.target_price.toFixed(2)}\n`;
    }

    if (result.sell_price) {
      output += `- **Sell Price**: $${result.sell_price.toFixed(2)}\n`;
    }

    if (result.peg_ratio) {
      output += `- **PEG Ratio**: ${result.peg_ratio.toFixed(2)}\n`;
    }

    if (result.graham_number) {
      output += `- **Graham Number**: $${result.graham_number.toFixed(2)}\n`;
    }

    if (result.exit_condition) {
      output += `- **Exit Condition**: ${result.exit_condition}\n`;
    }

    output += `- **Logic**: ${result.logic}\n\n`;
  });

  return output;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Phase 2 & Phase 3 API Tests...\n');

  const tickers = getAllTickers();
  console.log(`Found ${tickers.all.length} stocks:`);
  console.log(`- NASDAQ: ${tickers.nasdaq.length} stocks`);
  console.log(`- NYSE: ${tickers.nyse.length} stocks\n`);

  let markdown = `# Stock Analysis Test Results\n\n`;
  markdown += `**Test Date**: ${new Date().toLocaleString()}\n`;
  markdown += `**Total Stocks**: ${tickers.all.length}\n`;
  markdown += `- NASDAQ: ${tickers.nasdaq.length}\n`;
  markdown += `- NYSE: ${tickers.nyse.length}\n\n`;
  markdown += `---\n\n`;

  let successCount = 0;
  let failCount = 0;

  // Test each ticker
  for (const ticker of tickers.all) {
    console.log(`Testing ${ticker}...`);

    markdown += `## ${ticker}\n\n`;

    // Phase 2: Combined Data API
    markdown += `### Phase 2: Combined Data\n\n`;
    const phase2Data = await fetchAPI(`${BASE_URL}/api/analysis/${ticker}`);
    markdown += formatPhase2(phase2Data) + '\n\n';

    // Phase 3: Investment Analysis API
    markdown += `### Phase 3: Investment Analysis\n\n`;
    const phase3Data = await fetchAPI(`${BASE_URL}/api/invest/${ticker}`);
    markdown += formatPhase3(phase3Data) + '\n\n';

    markdown += `---\n\n`;

    // Track success/failure
    if (!phase2Data.error && !phase3Data.error) {
      successCount++;
      console.log(`✅ ${ticker} - SUCCESS\n`);
    } else {
      failCount++;
      console.log(`❌ ${ticker} - FAILED\n`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Summary
  markdown += `## Summary\n\n`;
  markdown += `- **Total Stocks Tested**: ${tickers.all.length}\n`;
  markdown += `- **Successful**: ${successCount}\n`;
  markdown += `- **Failed**: ${failCount}\n`;
  markdown += `- **Success Rate**: ${((successCount / tickers.all.length) * 100).toFixed(1)}%\n`;

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, markdown, 'utf-8');

  console.log(`\n✅ Test completed!`);
  console.log(`📄 Results saved to: ${OUTPUT_FILE}`);
  console.log(`\nSummary:`);
  console.log(`- Successful: ${successCount}/${tickers.all.length}`);
  console.log(`- Failed: ${failCount}/${tickers.all.length}`);
}

// Run tests
runTests().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});
