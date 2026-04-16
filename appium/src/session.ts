import { remote } from 'webdriverio';
import type { MobilePlatform } from './config.js';
import { buildSessionConfig } from './config.js';

export async function withSession<T>(
  platform: MobilePlatform,
  work: (driver: WebdriverIO.Browser) => Promise<T>,
): Promise<T> {
  const config = buildSessionConfig(platform);
  const driver = await remote(config);

  try {
    return await work(driver);
  } finally {
    await driver.deleteSession();
  }
}
