<!-- eas build --platform android --profile production -->

# Expo React Native – Android Build Guide

A complete guide to configuring, building, and distributing an Android application using **Expo EAS Build**.

## 1. Prerequisites

Make sure the following tools are installed:

- Node.js (LTS)
- npm
- Expo CLI
- EAS CLI
- Git

Check installed versions:

```bash
node -v
npm -v
eas --version
```

## 2. Project Setup

Clone or navigate to your project directory:

```bash
cd your-project-name
```

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npx expo start
```

## 3. Install EAS CLI

Install Expo Application Services CLI globally:

```bash
npm install -g eas-cli
```

Verify installation:

```bash
eas --version
```

## 4. Expo Account Login

Login to your Expo account:

```bash
eas login
```

Check the logged-in account:

```bash
eas whoami
```

## 5. Configure EAS Build

Initialize EAS configuration:

```bash
eas build:configure
```

This creates the `eas.json` configuration file.

## 6. EAS Build Configuration

Create or update `eas.json` in the project root:

```json
{
  "cli": {
    "version": ">= 16.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true,
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### Build Profiles

| Profile | Purpose | Output |
|---|---|---|
| development | Development testing | Development build |
| preview | Internal distribution | APK |
| production | Play Store release | AAB |

## 7. Android APK Build

Generate an APK for direct installation on Android devices:

```bash
eas build --platform android --profile preview
```

Use this build for:
- Internal testing
- QA testing
- Direct Android installation
- Sharing with testers

## 8. Android AAB Production Build

Generate an Android App Bundle for Google Play Store:

```bash
eas build --platform android --profile production
```

Use this build for:
- Google Play Store submission
- Production releases
- Play Store distribution

## 9. Local Android Build

To generate an Android build locally, configure the Android development environment and use:

```bash
npx expo prebuild --platform android
```

Build APK using Gradle on Windows:

```bash
cd android
gradlew.bat assembleRelease
```

Build AAB:

```bash
gradlew.bat bundleRelease
```

Output locations:

**APK**
```text
android/app/build/outputs/apk/release/app-release.apk
```

**AAB**
```text
android/app/build/outputs/bundle/release/app-release.aab
```

Note: Local builds require the Android SDK, JDK, and correctly configured signing credentials.

## 10. Check Build Status

List recent builds:

```bash
eas build:list
```

View build details:

```bash
eas build:view
```

## 11. Download Build

After successful EAS Cloud Build:

1. Open the build URL provided by EAS.
2. Download the generated APK or AAB.
3. Install the APK directly on an Android device or upload the AAB to Google Play Console.

## 12. Common Commands

| Command | Description |
|---|---|
| `npx expo start` | Start development server |
| `npx expo doctor` | Check project configuration |
| `npx expo install --check` | Check dependency compatibility |
| `eas login` | Login to Expo |
| `eas whoami` | Check Expo account |
| `eas build:configure` | Configure EAS |
| `eas build --platform android --profile preview` | Generate APK |
| `eas build --platform android --profile production` | Generate AAB |
| `eas build:list` | List builds |

## 13. Troubleshooting

### Dependency Issues

```bash
npm install
npx expo install --fix
npx expo doctor
```

### Clear Expo Cache

```bash
npx expo start --clear
```

### EAS Build Issues

```bash
eas build:configure
eas build --platform android --profile preview --clear-cache
```

### Android Device Not Detected

For local USB testing:

```bash
adb devices
```

Enable USB debugging on your Android device and verify that ADB recognizes it.

## 14. Important Notes

- Keep Expo SDK and React Native dependencies compatible.
- Never commit keystores, passwords, API secrets, or signing credentials to Git.
- Use APK builds for internal testing.
- Use AAB builds for Google Play Store releases.
- Verify API URLs and environment variables before production builds.
- Test release builds on actual Android devices before deployment.

## 15. Official Documentation

- Expo Documentation: https://docs.expo.dev/
- EAS Build: https://docs.expo.dev/build/introduction/
- EAS Configuration: https://docs.expo.dev/build/eas-json/
- Android App Signing: https://docs.expo.dev/app-signing/app-credentials/

---

**Build workflow:** Install Dependencies → Configure EAS → Generate APK/AAB → Test → Release.