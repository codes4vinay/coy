import { test, expect } from '@playwright/test';
for (const width of [320, 375, 430, 768, 1024, 1440]) {
  test(`discovery fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await expect(page.getByRole('article')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Like this profile' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('article')).toHaveCSS('opacity', '1');
    await page.waitForFunction(() =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0),
    );
    await page.screenshot({ path: `test-results/discover-${width}.png`, fullPage: true });
  });
}
test('preferences persist, filter introductions, and pause without removing matches', async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/');
  await page.getByRole('button', { name: 'Discovery preferences' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Where would you like to meet people?').selectOption('Bengaluru');
  await dialog.getByRole('button', { name: 'Coffee', exact: true }).click();
  await page.screenshot({ path: 'test-results/preferences-mobile.png' });
  await dialog.getByRole('button', { name: 'Save preferences' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('article')).toContainText('Bengaluru');
  await page.reload();
  await page.getByRole('button', { name: 'Discovery preferences' }).click();
  await expect(dialog.getByLabel('Where would you like to meet people?')).toHaveValue('Bengaluru');
  await expect(dialog.getByRole('button', { name: 'Coffee', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await dialog.getByRole('switch', { name: /Pause discovery/ }).check();
  await dialog.getByRole('button', { name: 'Save preferences' }).click();
  await expect(page.getByRole('heading', { name: 'A little room to breathe.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'A little room to breathe.' })).toBeVisible();
  await page.getByRole('button', { name: /Matches/ }).click();
  await expect(page.getByRole('heading', { name: 'Good things take two.' })).toBeVisible();
  await page.getByRole('button', { name: 'Discovery preferences' }).click();
  await dialog.getByRole('switch', { name: /Pause discovery/ }).uncheck();
  await dialog.getByLabel('Where would you like to meet people?').selectOption('');
  await dialog.getByRole('button', { name: 'Save preferences' }).click();
  await page.getByRole('button', { name: 'For you' }).click();
  await expect(page.getByRole('article')).toBeVisible();
});
test('mutual match, saved matches and passes survive reload; Home is a placeholder', async ({
  page,
  request,
}) => {
  await page.goto('/');
  const first = page.getByRole('article');
  await expect(first).toBeVisible();
  const name = await first.getAttribute('aria-label');
  await page.getByRole('button', { name: 'Like this profile' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByText('It’s a match!')).toBeVisible();
  await page.getByRole('dialog').locator('summary').click();
  await expect(page.getByRole('dialog')).toContainText('You both enjoy coffee');
  await expect(page.getByRole('dialog')).toContainText('café');
  await expect(page.getByRole('dialog').locator('.match-content')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: 'test-results/match.png' });
  await page.getByRole('button', { name: 'View all matches' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.reload();
  await page.getByRole('button', { name: /Matches/ }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('button', { name: 'For you' }).click();
  await expect(page.getByRole('article')).not.toHaveAttribute('aria-label', name!);
  const second = await page.getByRole('article').getAttribute('aria-label');
  await page.getByRole('button', { name: 'Pass on this profile' }).click();
  await expect(page.getByRole('article')).not.toHaveAttribute('aria-label', second!);
  await page.reload();
  await expect(page.getByRole('article')).not.toHaveAttribute('aria-label', second!);
  await page.getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'You’re home.' })).toBeVisible();
  const reset = await request.put('http://localhost:4100/preferences', {
    data: { paused: false, city: '', interests: [] },
  });
  expect(reset.status()).toBe(200);
});
test('dragging right records a like and advances the feed', async ({ page }) => {
  await page.goto('/');
  const card = page.getByRole('article');
  await expect(card).toBeVisible();
  const name = await card.getAttribute('aria-label');
  const box = (await card.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 150, box.y + 110, { steps: 12 });
  await page.mouse.up();
  await expect(card).not.toHaveAttribute('aria-label', name!);
});
test('network failure has a working retry and failed swipes keep the current profile', async ({
  page,
}) => {
  await page.route('**/feed', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: { message: 'Temporarily unavailable.' } }),
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('main').getByRole('alert')).toContainText('Temporarily unavailable.');
  await page.unroute('**/feed');
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('article')).toBeVisible();
  const name = await page.getByRole('article').getAttribute('aria-label');
  await page.route('**/swipe', (route) => route.abort());
  await page.getByRole('button', { name: 'Like this profile' }).click();
  await expect(page.getByRole('status')).toContainText('Couldn’t reach Coy');
  await expect(page.getByRole('article')).toHaveAttribute('aria-label', name!);
});
test('touch drag left passes a profile on a mobile device', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3100');
  const card = page.getByRole('article');
  await expect(card).toBeVisible();
  await expect(card).toHaveCSS('opacity', '1');
  const name = await card.getAttribute('aria-label');
  const box = (await card.boundingBox())!;
  const cdp = await context.newCDPSession(page);
  const startX = box.x + box.width * 0.75,
    y = box.y + 100;
  await cdp.send('Input.dispatchTouchEvent', {
    type: 'touchStart',
    touchPoints: [{ x: startX, y }],
  });
  for (let i = 1; i <= 12; i++)
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: startX - i * 13, y }],
    });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect(card).not.toHaveAttribute('aria-label', name!);
  await page.reload();
  await expect(card).not.toHaveAttribute('aria-label', name!);
  await context.close();
});
test('feed exhaustion shows the saved-state empty view and matches remain accessible', async ({
  page,
  request,
}) => {
  const response = await request.get('http://localhost:4100/feed');
  const { profiles } = await response.json();
  for (const profile of profiles) {
    const saved = await request.post('http://localhost:4100/swipe', {
      data: { profileId: profile._id, direction: 'pass' },
    });
    expect(saved.status()).toBe(201);
  }
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'You’ve met everyone for now.' })).toBeVisible();
  await page.getByRole('button', { name: 'See your matches' }).click();
  await expect(page.getByRole('article')).toHaveCount(1);
});
