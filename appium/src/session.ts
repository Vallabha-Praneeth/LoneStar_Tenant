import { remote } from 'webdriverio';
import type { MobilePlatform } from './config.js';
import { buildSessionConfig } from './config.js';

export async function withSession<T>(
  platform: MobilePlatform,
  work: (driver: WebdriverIO.Browser) => Promise<T>,
): Promise<T> {
  const config = buildSessionConfig(platform);
  const driver = await remote(config);
  let workError: unknown;

  try {
    return await work(driver);
  } catch (err) {
    workError = err;
    throw err;
  } finally {
    try {
      await driver.deleteSession();
    } catch (teardownError) {
      if (workError !== undefined) {
        // The original test failure is already being propagated; log the teardown
        // error so it is not silently lost, but do not let it replace the root cause.
        console.error('[session] deleteSession also failed after a test error:', teardownError);
      } else {
        throw teardownError;
      }
    }
  }
}
