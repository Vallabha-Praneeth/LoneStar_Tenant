import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

export type MobilePlatform = 'android' | 'ios';

type CapabilityMap = Record<string, string | number | boolean>;

export interface SessionConfig {
  hostname: string;
  port: number;
  path: string;
  logLevel: 'info' | 'warn' | 'error';
  capabilities: CapabilityMap;
}

loadEnvFiles();

export function buildSessionConfig(platform: MobilePlatform): SessionConfig {
  const hostname = process.env.APPIUM_HOST ?? '127.0.0.1';
  const port = Number(process.env.APPIUM_PORT ?? '4723');
  const basePath = process.env.APPIUM_BASE_PATH ?? '/wd/hub';

  return {
    hostname,
    port,
    path: basePath,
    logLevel: 'info',
    capabilities: platform === 'android' ? buildAndroidCapabilities() : buildIosCapabilities(),
  };
}

function buildAndroidCapabilities(): CapabilityMap {
  const appPath = optionalPath(process.env.ANDROID_APP_PATH);
  const appPackage = process.env.ANDROID_APP_PACKAGE;
  const appActivity = process.env.ANDROID_APP_ACTIVITY;

  if (!appPath && (!appPackage || !appActivity)) {
    throw new Error('Android Appium config requires ANDROID_APP_PATH or both ANDROID_APP_PACKAGE and ANDROID_APP_ACTIVITY.');
  }

  return {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': process.env.ANDROID_DEVICE_NAME ?? 'Android Emulator',
    ...(process.env.ANDROID_PLATFORM_VERSION ? { 'appium:platformVersion': process.env.ANDROID_PLATFORM_VERSION } : {}),
    ...(process.env.ANDROID_UDID ? { 'appium:udid': process.env.ANDROID_UDID } : {}),
    ...(appPath ? { 'appium:app': appPath } : {}),
    ...(appPackage ? { 'appium:appPackage': appPackage } : {}),
    ...(appActivity ? { 'appium:appActivity': appActivity } : {}),
    ...(process.env.ANDROID_APP_ACTIVITY ? { 'appium:appWaitActivity': process.env.ANDROID_APP_ACTIVITY } : {}),
    'appium:autoGrantPermissions': true,
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240
  };
}

function buildIosCapabilities(): CapabilityMap {
  const appPath = optionalPath(process.env.IOS_APP_PATH);
  const bundleId = process.env.IOS_BUNDLE_ID;

  if (!appPath && !bundleId) {
    throw new Error('iOS Appium config requires IOS_APP_PATH or IOS_BUNDLE_ID.');
  }

  return {
    platformName: 'iOS',
    'appium:automationName': 'XCUITest',
    'appium:deviceName': process.env.IOS_DEVICE_NAME ?? 'iPhone 16',
    ...(process.env.IOS_PLATFORM_VERSION ? { 'appium:platformVersion': process.env.IOS_PLATFORM_VERSION } : {}),
    ...(process.env.IOS_UDID ? { 'appium:udid': process.env.IOS_UDID } : {}),
    ...(appPath ? { 'appium:app': appPath } : {}),
    ...(bundleId ? { 'appium:bundleId': bundleId } : {}),
    'appium:noReset': false,
    'appium:fullReset': false,
    'appium:newCommandTimeout': 240
  };
}

function optionalPath(value?: string) {
  if (!value) {
    return undefined;
  }
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

function loadEnvFiles() {
  for (const fileName of ['.env.local', '.env']) {
    const filePath = path.resolve(process.cwd(), fileName);
    if (fs.existsSync(filePath)) {
      dotenv.config({ path: filePath, override: false });
    }
  }
}
