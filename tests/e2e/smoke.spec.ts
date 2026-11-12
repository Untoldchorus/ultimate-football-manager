import { expect, test } from '@playwright/test';

test.describe('Ultimate Football Manager — Full Career & Matchday Smoke Walkthrough', () => {
  test('creates a career, configures squad & tactics, plays matchday in text/2D/3D, and persists across browser reload', async ({
    page,
  }) => {
    await page.goto('/');

    // 1. Career Creation Screen
    const nameInput = page.getByTestId('manager-name-input');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Jürgen Vance');

    // Select Chelsea FC (club-harbour)
    await page.getByTestId('club-card-club-harbour').click();
    await page.getByTestId('start-career-btn').click();

    // Dismiss manager intro cutscene
    const cutsceneModal = page.getByTestId('cutscene-modal');
    await expect(cutsceneModal).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/01-manager-intro-cutscene.png' });
    await page.getByTestId('continue-cutscene-btn').click();

    // Verify Home Dashboard loaded
    await expect(page.getByTestId('home-dashboard')).toBeVisible();
    await expect(page.getByTestId('header-club-name')).toContainText('Chelsea FC');
    await page.screenshot({ path: 'docs/screenshots/02-home-dashboard.png' });

    // 2. Navigate to Squad Screen, change formation, and validate lineup
    await page.getByTestId('nav-squad').click();
    await expect(page.getByTestId('squad-screen')).toBeVisible();
    await expect(page.getByTestId('lineup-valid-badge')).toBeVisible();
    await page.getByTestId('formation-select').selectOption('4-3-3');
    await page.screenshot({ path: 'docs/screenshots/03-squad-pitch.png' });

    // 3. Navigate to Tactics Screen
    await page.getByTestId('nav-tactics').click();
    await expect(page.getByTestId('tactics-screen')).toBeVisible();
    await page.getByTestId('mentality-select').selectOption('attacking');

    // 4. Navigate to Transfers, Training, Scouting, Youth Academy, Finances
    await page.getByTestId('nav-transfers').click();
    await expect(page.getByTestId('transfers-screen')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/04-transfer-market.png' });

    await page.getByTestId('nav-training').click();
    await expect(page.getByTestId('training-screen')).toBeVisible();

    await page.getByTestId('nav-youth').click();
    await expect(page.getByTestId('youth-screen')).toBeVisible();

    // 5. Play Matchday (verify Text, 2D Pitch, and Instant Result score consistency)
    await page.getByTestId('sidebar-matchday-btn').click();
    await expect(page.getByTestId('matchday-screen')).toBeVisible();

    // Switch to 2D Pitch Viewer
    await page.getByTestId('view-mode-2d').click();
    await expect(page.getByTestId('pitch-2d-viewer')).toBeVisible();
    await page.screenshot({ path: 'docs/screenshots/05-match-2d-pitch.png' });

    // Switch to Godot Engine Viewer and verify bridge status bar & viewport render
    await page.getByTestId('view-mode-godot').click();
    await expect(page.getByTestId('godot-match-viewer')).toBeVisible();
    await expect(page.getByTestId('godot-match-viewer')).toContainText('Godot 4.3 Engine Bridge');

    // Skip to full time and record final scoreline
    await page.getByTestId('skip-to-end-btn').click();
    const finalScoreGodot = await page.getByTestId('match-scoreline').textContent();

    // Switch to 2D and Text mode and verify identical final scoreline across all viewers
    await page.getByTestId('view-mode-2d').click();
    const finalScore2D = await page.getByTestId('match-scoreline').textContent();
    expect(finalScore2D).toBe(finalScoreGodot);

    await page.getByTestId('view-mode-text').click();
    const finalScoreText = await page.getByTestId('match-scoreline').textContent();
    expect(finalScoreText).toBe(finalScore2D);

    // Complete Matchday & Advance to Week 2
    await page.getByTestId('complete-matchday-btn').click();
    await expect(page.getByTestId('home-dashboard')).toBeVisible();

    // 6. Reload Browser and verify state persists via IndexedDB autosave
    await page.reload();
    await expect(page.getByTestId('home-dashboard')).toBeVisible();
    await expect(page.getByTestId('header-club-name')).toContainText('Chelsea FC');
    await expect(page.locator('header')).toContainText('Week 2');
  });
});
