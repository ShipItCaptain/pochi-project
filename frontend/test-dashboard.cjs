const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errors = [];
  page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // Step 1: Load signup page
    console.log('=== Step 1: Load signup page ===');
    await page.goto('http://localhost:3002/signup', { waitUntil: 'networkidle' });
    console.log('URL:', page.url());
    console.log('Title:', await page.title());

    // Step 2: Fill signup form
    console.log('\n=== Step 2: Fill signup form ===');
    const nameInput = await page.$('input[placeholder*="name" i], input[type="text"]');
    const phoneInput = await page.$('input[placeholder*="phone" i], input[type="tel"]');
    console.log('Name input found:', !!nameInput);
    console.log('Phone input found:', !!phoneInput);

    // Step 3: Inject token directly and navigate to dashboard
    console.log('\n=== Step 3: Inject auth token and test dashboard ===');
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYyMDI5ZDE0LWYyNWMtNDVlMC05MTE2LTYxZjUxMTBkNzYwYiIsInBob25lX251bWJlciI6IjI1NDcxMjM0NTY3OCIsImlhdCI6MTc4MDc3NjMxNCwiZXhwIjoxNzgxMzgxMTE0fQ.HJ71pwPKkJcPZMWFsrCbSkNrjtid4OxI2_6oUtsCsz8';

    await page.evaluate((t) => {
      const state = {
        state: {
          token: t,
          organizer: {
            id: '62029d14-f25c-45e0-9116-61f5110d760b',
            phone_number: '254712345678',
            full_name: 'Test User',
            subscription_plan: 'spark',
            subscription_status: 'trial'
          }
        },
        version: 0
      };
      localStorage.setItem('auth-storage', JSON.stringify(state));
    }, token);

    await page.goto('http://localhost:3002/', { waitUntil: 'networkidle' });
    console.log('Dashboard URL:', page.url());
    await page.screenshot({ path: '/tmp/dashboard.png' });
    console.log('Dashboard screenshot saved');

    // Step 4: Check dashboard content
    console.log('\n=== Step 4: Check dashboard content ===');
    const bodyText = await page.textContent('body');
    console.log('Has fundraiser text:', bodyText.includes('Fundraiser') || bodyText.includes('fundraiser'));
    console.log('Has create button:', bodyText.includes('Create') || bodyText.includes('New'));
    console.log('Page excerpt:', bodyText.slice(0, 300));

    // Step 5: Navigate to create fundraiser
    console.log('\n=== Step 5: Navigate to create fundraiser ===');
    await page.goto('http://localhost:3002/fundraisers/new', { waitUntil: 'networkidle' });
    console.log('Create URL:', page.url());
    await page.screenshot({ path: '/tmp/create-fundraiser.png' });

    const createBody = await page.textContent('body');
    console.log('Has form fields:', createBody.includes('Title') || createBody.includes('Amount'));
    console.log('Create page excerpt:', createBody.slice(0, 300));

    // Step 6: Fill and submit create fundraiser form
    console.log('\n=== Step 6: Submit create fundraiser form ===');
    const titleInput = await page.$('input[name="title"], input[placeholder*="title" i], input[placeholder*="Title" i]');
    const amountInput = await page.$('input[name="target_amount"], input[placeholder*="amount" i], input[type="number"]');
    console.log('Title input:', !!titleInput);
    console.log('Amount input:', !!amountInput);

    if (titleInput && amountInput) {
      await titleInput.fill('Wedding Fundraiser');
      await amountInput.fill('50000');
      await page.screenshot({ path: '/tmp/create-form-filled.png' });
      console.log('Form filled, screenshot saved');
    }

  } catch (err) {
    console.error('ERROR:', err.message);
    await page.screenshot({ path: '/tmp/error-state.png' });
  }

  console.log('\n=== Console errors ===');
  errors.forEach(e => console.log('ERR:', e));

  await browser.close();
})();
