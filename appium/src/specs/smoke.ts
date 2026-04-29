import { selectors } from '../selectors.js';
import { withSession } from '../session.js';
import {
  assertPresent,
  assertVisible,
  clickA11y,
  fillA11y,
  sleep,
  submitFromField,
} from '../utils.js';
import type { MobilePlatform } from '../config.js';

const DEMO_PASSWORD = 'Demo123!';
const LONESTAR_ADMIN_CAMPAIGN_ID = '11111111-1111-1111-1111-111111111401';
const SKYLINE_CLIENT_CAMPAIGN_ID = '22222222-2222-2222-2222-222222222401';

export async function runSmoke(platform: MobilePlatform) {
  await runAdminScenario(platform);
  await runDriverScenario(platform);
  await runClientScenario(platform);
}

async function runAdminScenario(platform: MobilePlatform) {
  await withSession(platform, async (driver) => {
    await assertVisible(driver, selectors.screenOrgSelection, 60000);
    await clickA11y(driver, selectors.orgOption('lonestar'));
    await assertVisible(driver, selectors.screenLogin);
    await clickA11y(driver, selectors.roleOption('admin'));
    await fillA11y(driver, selectors.loginPassword, DEMO_PASSWORD);
    await submitFromField(driver, selectors.loginPassword);
    await assertPresent(driver, selectors.screenAdminHome, 60000);
    await clickA11y(driver, selectors.campaignCard(LONESTAR_ADMIN_CAMPAIGN_ID));
    await assertPresent(driver, selectors.screenCampaignDetail);
  });
}

async function runDriverScenario(platform: MobilePlatform) {
  await withSession(platform, async (driver) => {
    await assertVisible(driver, selectors.screenOrgSelection, 60000);
    await clickA11y(driver, selectors.orgOption('skyline'));
    await assertVisible(driver, selectors.screenLogin);
    await clickA11y(driver, selectors.roleOption('driver'));
    await fillA11y(driver, selectors.loginPassword, DEMO_PASSWORD);
    await submitFromField(driver, selectors.loginPassword);
    await assertPresent(driver, selectors.screenDriverHome, 60000);
    await clickA11y(driver, selectors.driverUploadProof);
    await assertPresent(driver, selectors.screenProofUpload);
    await clickA11y(driver, selectors.appHeaderBack);
    await assertPresent(driver, selectors.screenDriverHome);
    await clickA11y(driver, selectors.driverShiftLog);
    await assertPresent(driver, selectors.screenShift);
    await sleep(500);
  });
}

async function runClientScenario(platform: MobilePlatform) {
  await withSession(platform, async (driver) => {
    await assertVisible(driver, selectors.screenOrgSelection, 60000);
    await clickA11y(driver, selectors.orgOption('skyline'));
    await assertVisible(driver, selectors.screenLogin);
    await clickA11y(driver, selectors.roleOption('client'));
    await fillA11y(driver, selectors.loginPassword, DEMO_PASSWORD);
    await submitFromField(driver, selectors.loginPassword);
    await assertPresent(driver, selectors.screenClientHome, 60000);
    await clickA11y(driver, selectors.campaignCard(SKYLINE_CLIENT_CAMPAIGN_ID));
    await assertPresent(driver, selectors.screenCampaignDetail);
  });
}
