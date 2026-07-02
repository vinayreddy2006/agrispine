# AgriSpine Farmer App Setup

This document describes how to setup and run the AgriSpine Farmer Mobile Application (built with Flutter).

## Prerequisites

- Flutter SDK (>=3.0.0)
- Android Studio or VS Code with Flutter extension
- An Android Emulator or physical device connected
- Node.js backend running locally

## Backend Configuration

The Flutter app expects the backend to be running on `http://10.0.2.2:5000` (which is the localhost alias for Android emulators). 
Ensure your AgriSpine Node.js backend is running.

## Running the App

1. Navigate to the `app` directory:
   ```bash
   cd app
   ```

2. Get the dependencies:
   ```bash
   flutter pub get
   ```

3. Run the application:
   ```bash
   flutter run
   ```

## Architecture Overview

This application follows a modern Feature-First architecture using:
- **State Management**: `flutter_riverpod`
- **Routing**: `go_router`
- **Networking**: `dio`
- **Local Storage**: `flutter_secure_storage`
- **Real-time**: `socket_io_client`

### Modules Implemented
- **Auth**: Login, Register, Persistent Session handling.
- **Dashboard**: Quick actions and user overview.
- **Market**: Live Mandi Rates fetched from backend.
- **Schemes**: Government Schemes feed.
- **Machinery**: Rent Machinery catalog and details.
- **Community**: Forum to post and read updates.
- **Messages**: Real-time 1-on-1 socket.io chat infrastructure.
- **Plant Doctor**: Placeholder UI for future AI integration.
