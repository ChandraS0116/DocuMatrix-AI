import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    } else {
      console.log('BROWSER LOG:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('BROWSER PAGE EXCEPTION:', error.message);
  });

  page.on('requestfailed', request => {
    console.log('BROWSER REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  try {
    console.log("Navigating to preview server...");
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle0', timeout: 10000 });
    console.log("Navigation complete.");
    
    // Also capture the HTML to see if ErrorBoundary rendered
    const html = await page.content();
    if (html.includes('Frontend Crashed!')) {
      console.log("HTML shows ErrorBoundary rendered!");
    } else if (html.includes('id="root"></div>') && !html.includes('id="root"><div')) {
      console.log("HTML shows empty root div (White screen)!");
    }
    
  } catch (err) {
    console.log("Puppeteer Error:", err.message);
  } finally {
    await browser.close();
  }
})();
