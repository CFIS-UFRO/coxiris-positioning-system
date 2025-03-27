# COXIRIS Positioning System

GUI to use the COXIRIS Positioning System.

# Releases

For stable releases, please visit the [Releases](https://github.com/CFIS-UFRO/coxiris-positioning-system/releases) page.

## Mac Security Warning

When first opening the app on macOS, you may see a security warning. To resolve this:

1. Open Terminal
2. Run: `xattr -d com.apple.quarantine /path/to/app.app`
   - Or type `xattr -d com.apple.quarantine ` and drag the app into Terminal

This removes the quarantine flag that blocks unidentified developer apps.

# For developers

This development is based on the [Electron Development Temaplate](https://github.com/CFIS-UFRO/electron-development-template). You can find some technical details there.

## Requirements

- Node.js
- npm
- git

## Install dependencies

```bash
npm install
```

## Run the app
```bash
npm run dev
# or
npm run start
```

## Compile the app 
```bash
npm run build:mac
# or
npm run build:win
# or
npm run build:linux
```

## Publish the app on GitHub Releases

1. Create a .env file with the following content:
```
GITHUB_TOKEN=your_github_token (Token with `repo` scope for `versions_repository`)
```
2. Ensure everything is committed and pushed to the repository.
3. Run the following command:
```
npm run publish
```

This will trigger the GitHub Actions workflow to publish the app on GitHub Releases.

## Communication Protocol

Initially, a custom communication protocol was proposed for this project. You can find the proposal inside the `communication_protocol_proposal` folder along with an Arduino library in the `communication_protocol_proposal/CommandParser` folder.

After evaluation, we decided to use G-code instead of the custom protocol for better compatibility with existing standards. The current implementation uses standard G-code commands for positioning and control.