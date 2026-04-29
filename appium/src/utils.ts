import assert from 'node:assert/strict';

export async function waitForA11y(driver: WebdriverIO.Browser, selector: string, timeout = 30000) {
  let visibleElement: WebdriverIO.Element | undefined;

  await driver.waitUntil(
    async () => {
      const elements = await driver.$$(selector);
      for (const element of elements) {
        if (await element.isDisplayed()) {
          visibleElement = element;
          return true;
        }
      }
      return false;
    },
    {
      timeout,
      interval: 500,
      timeoutMsg: `Timed out waiting for visible accessibility selector ${selector}`,
    },
  );

  return assertNonEmpty(visibleElement, `Expected visible accessibility selector ${selector}`);
}

export async function waitForA11yPresent(driver: WebdriverIO.Browser, selector: string, timeout = 30000) {
  let foundElement: WebdriverIO.Element | undefined;

  await driver.waitUntil(
    async () => {
      const elements = await driver.$$(selector);
      if (elements.length > 0) {
        foundElement = elements[0];
        return true;
      }
      return false;
    },
    {
      timeout,
      interval: 500,
      timeoutMsg: `Timed out waiting for accessibility selector ${selector}`,
    },
  );

  return assertNonEmpty(foundElement, `Expected accessibility selector ${selector}`);
}

export async function clickA11y(driver: WebdriverIO.Browser, selector: string, timeout = 30000) {
  const element = await waitForA11y(driver, selector, timeout);
  await element.click();
}

export async function fillA11y(
  driver: WebdriverIO.Browser,
  selector: string,
  value: string,
  timeout = 30000,
) {
  const element = await waitForA11y(driver, selector, timeout);
  await element.setValue(value);
}

export async function dismissKeyboard(driver: WebdriverIO.Browser) {
  try {
    await driver.hideKeyboard();
  } catch {
    // Ignore when the keyboard is already hidden or the driver cannot dismiss it.
  }
}

export async function submitFromField(
  driver: WebdriverIO.Browser,
  selector: string,
  timeout = 30000,
) {
  const element = await waitForA11yPresent(driver, selector, timeout);
  await element.addValue('\n');
}

export async function assertVisible(driver: WebdriverIO.Browser, selector: string, timeout = 30000) {
  await waitForA11y(driver, selector, timeout);
}

export async function assertPresent(driver: WebdriverIO.Browser, selector: string, timeout = 30000) {
  await waitForA11yPresent(driver, selector, timeout);
}

export async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export function assertNonEmpty<T>(value: T | null | undefined, message: string): T {
  assert.ok(value, message);
  return value;
}
