# PixelSqueeze iOS Deployment Guide

## Prerequisites
- ✅ Apple Developer Account (you have this!)
- macOS with Xcode installed
- iOS deployment certificate and provisioning profile
- Node.js and npm installed

## Step 1: Build the Web App

```bash
# Install dependencies (if not done)
npm install

# Build the production web app
npm run build

# This creates the 'dist' folder that Capacitor will use
```

## Step 2: Initialize Capacitor iOS (One-time setup)

```bash
# Add the iOS platform to Capacitor
npx cap add ios

# This creates the 'ios/' folder with the Xcode project
```

## Step 3: Open in Xcode and Configure Signing

```bash
# Open the iOS project in Xcode
npx cap open ios
```

### In Xcode:
1. Select the **pixelsqueeze** project in the left sidebar
2. Select the **pixelsqueeze** target
3. Go to the **Signing & Capabilities** tab
4. Set your **Team** (your Apple Developer account)
5. Update the **Bundle Identifier** to match your provisioning profile
   - Default: `com.pixelsqueeze.app`
   - Must be unique and match your App Store profile
6. Select your provisioning profile

## Step 4: Update iOS App on Device/Simulator

After making changes to the web code:

```bash
# Rebuild the web app
npm run build

# Sync changes to the iOS project
npx cap sync ios

# Then rebuild in Xcode or run:
npx cap run ios
```

## Step 5: Deploy to App Store or TestFlight

### Option A: TestFlight (Testing)
1. In Xcode, select **Any iOS Device (arm64)** from the build scheme
2. Go to **Product** → **Archive**
3. Click **Distribute App**
4. Select **TestFlight & App Store**
5. Follow the prompts to upload to TestFlight

### Option B: App Store (Production)
Same as TestFlight but select "App Store" instead.

## Step 6: Submit for Review
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Select your app
3. Fill in app details, screenshots, description
4. Submit for review

## Useful Commands

```bash
# Build the web app for production
npm run build

# Sync web changes to iOS
npx cap sync ios

# Run on iOS simulator
npx cap run ios

# Run on connected iOS device
npx cap run ios --device

# Update Capacitor dependencies
npm update @capacitor/core @capacitor/ios @capacitor/cli
```

## Troubleshooting

### Pod issues
```bash
cd ios/App
pod repo update
pod install --repo-update
cd ../..
```

### Clear build cache
```bash
npx cap sync ios
rm -rf ios/App/Pods
cd ios/App
pod install --repo-update
cd ../..
```

### App ID / Bundle ID mismatch
- Ensure the bundle ID in Xcode matches your provisioning profile
- Bundle ID format: `com.yourcompany.appname`
- Can be changed in Xcode under **Build Settings** → **Bundle Identifier**

## iOS App Features Already Configured

✅ **Progressive Web App (PWA)** - Installable on home screen
✅ **Responsive Design** - Works on all iOS screen sizes
✅ **Tailwind CSS** - Mobile-optimized styling
✅ **Supabase Integration** - Backend authentication & data
✅ **Touch-friendly UI** - shadcn-ui components optimized for mobile

## Performance Tips

1. **Minimize app size** - Remove unused dependencies
2. **Optimize images** - Use responsive images
3. **Enable caching** - Capacitor plugins handle offline mode
4. **Test on real devices** - Simulator may not catch performance issues

## Support

For more info:
- [Capacitor iOS Documentation](https://capacitorjs.com/docs/ios)
- [App Store Connect Help](https://help.apple.com/app-store-connect)
- [Xcode Help](https://help.apple.com/xcode)