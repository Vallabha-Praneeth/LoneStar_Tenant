# Appium Workspace

This workspace contains a standalone Appium smoke-test harness for the mobile app.

## Scope

- org selection
- branded login
- admin landing and campaign detail
- driver landing plus proof-upload and shift placeholders
- client landing and campaign detail

The tests target stable accessibility IDs added to the React Native app. They do not depend on text matching.

## Prerequisites

1. Install workspace dependencies:

```bash
npm install
```

2. Install Appium drivers once:

```bash
npm run appium:drivers:install
```

3. Start the Appium server:

```bash
npm run appium:server
```

4. Prepare the mobile app on your emulator or simulator.

You can either:

- launch an already-installed app by package or bundle id, or
- point Appium to an `.apk` / `.app` via env vars

## Environment

Copy [appium/.env.example](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/appium/.env.example) to `appium/.env.local` and adjust values.

Android usually needs:

- `ANDROID_APP_PACKAGE`
- `ANDROID_APP_ACTIVITY`

iOS usually needs:

- `IOS_BUNDLE_ID`

If you want Appium to install the binary itself, set:

- `ANDROID_APP_PATH`
- `IOS_APP_PATH`

## Run

Android:

```bash
npm run test:appium:android
```

iOS:

```bash
npm run test:appium:ios
```

## Notes

- The workspace keeps Appium state and installed drivers in `appium/.appium-home` instead of `~/.appium`.
- The tests create a fresh Appium session per scenario.
- The current smoke suite assumes mock login remains enabled.
- If you change accessibility IDs in `mobile/app` or `mobile/components`, update [appium/src/selectors.ts](/Users/praneeth/LoneStar_ERP/LoneStar_Tenant/appium/src/selectors.ts).
