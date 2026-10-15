import puppeteer from 'puppeteer';
import { spawn } from 'child_process';
import http from 'http';

const ROUTES = [
  '/', 
  '/monitor', 
  '/review/mock', 
  '/search', 
  '/workflows', 
  '/operations', 
  '/settings', 
  '/demo/interview', 
  '/trace/mock-id'
];

async function waitForServer(url, maxRetries = 30) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`Status Code: ${res.statusCode}`));
        });
        req.on('error', reject);
        req.end();
      });
      return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
  return false;
}

async function runQAPass() {
  console.log('Starting preview server...');
  const server = spawn('npm', ['run', 'preview', '--', '--port', '4173'], {
    shell: true,
    stdio: 'ignore'
  });

  const serverReady = await waitForServer('http://localhost:4173');
  if (!serverReady) {
    console.error('Preview server failed to start.');
    server.kill();
    process.exit(1);
  }

  console.log('Server is ready. Launching Puppeteer...');
  const browser = await puppeteer.launch({ 
    headless: "new",
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1280, height: 800 }
  });
  
  const page = await browser.newPage();
  
  const report = {};
  let totalErrors = 0;

  // Listen to console
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[BROWSER ${msg.type().toUpperCase()}] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.log(`[PAGE ERROR] ${err.toString()}`);
    totalErrors++;
  });

  for (const route of ROUTES) {
    console.log(`\nTesting Route: ${route}`);
    try {
      await page.goto(`http://localhost:4173${route}`, { waitUntil: 'networkidle0', timeout: 15000 });
      console.log(`- Loaded successfully.`);
      
      // Basic check for Canvas
      const hasCanvas = await page.$eval('canvas', el => !!el).catch(() => false);
      console.log(`- CoreVisualization Canvas present: ${hasCanvas}`);
      
      // Look for known heavy components to ensure they mounted
      if (route === '/workflows') {
        const hasReactFlow = await page.$eval('.react-flow', el => !!el).catch(() => false);
        console.log(`- ReactFlow canvas present: ${hasReactFlow}`);
      }

      // Test Theme Switching (Settings page)
      if (route === '/settings') {
        console.log(`- Testing Theme Switching...`);
        // Find buttons with 'Nebula Violet' and 'Solar Flare'
        await page.evaluate(() => {
          const btns = Array.from(document.querySelectorAll('button'));
          const nebula = btns.find(b => b.textContent.includes('Nebula Violet'));
          if (nebula) nebula.click();
        });
        await new Promise(r => setTimeout(r, 500));
        const bg = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-deep'));
        console.log(`  - Nebula Violet --bg-deep: ${bg.trim()}`);
      }

      // Test Command Palette on an arbitrary page
      if (route === '/monitor') {
        console.log(`- Testing Command Palette (Cmd+K)...`);
        await page.keyboard.down('Meta');
        await page.keyboard.press('k');
        await page.keyboard.up('Meta');
        await new Promise(r => setTimeout(r, 500));
        // Check if modal dialog or input with placeholder 'Type a command or search...' exists
        const hasCmdModal = await page.$eval('input[placeholder*="search"]', el => !!el).catch(() => false);
        console.log(`  - Command Palette opened: ${hasCmdModal}`);
        await page.keyboard.press('Escape');
      }

      report[route] = 'PASS';
    } catch (err) {
      console.error(`- FAILED: ${err.message}`);
      report[route] = 'FAIL';
      totalErrors++;
    }
  }

  await browser.close();
  server.kill();

  console.log('\n--- QA PASS REPORT ---');
  Object.entries(report).forEach(([r, status]) => console.log(`${status.padEnd(5)} | ${r}`));
  console.log(`Total Errors/Crashes: ${totalErrors}`);
}

runQAPass().catch(err => {
  console.error(err);
  process.exit(1);
});
