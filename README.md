# One Delhi - Premium Transit Experience 🚌💨

[![Version](https://img.shields.io/badge/version-2.0.1-brightgreen.svg)](https://github.com/codebysrk/one-delhi)
[![Expo](https://img.shields.io/badge/built%20with-Expo-000020.svg)](https://expo.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance, premium redesign and UI clone of the **One Delhi** mobile application. Built with **React Native** and **Expo**, this project is created **strictly for educational purposes** to demonstrate modern UI/UX principles and mobile performance optimizations.

> [!IMPORTANT]
> **Disclaimer:** This is an unofficial clone and is NOT affiliated with the Delhi Transport Department or the official One Delhi app. All logos and brand names are the property of their respective owners.

---

## 📖 Project Overview

This project serves as a comprehensive case study in modernizing a public utility application. The goal was to take the core functionality of the One Delhi app and elevate it using:
- **Advanced State Management:** Scaling with complex ticketing flows.
- **Native Performance:** Achieving fluid animations and fast list rendering.
- **Modern UI/UX:** Implementing a design system that feels alive and responsive.

## ✨ Key Features

- **🎫 Smart Ticketing:** Book bus and metro tickets with a modern QR-based flow.
- **📍 Real-time Tracking:** Live bus positions and route visualization on interactive maps.
- **⚡ EV Station Finder:** Locate and track 0+ charging points across the city.
- **🔄 Trip Planner:** Seamlessly plan journeys across Bus, Metro, and Auto.
- **📜 Ticket History:** Lightning-fast access to past tickets with offline support.
- **🛡️ High Security:** Real-time device-level security and user moderation.

---

## 🚀 Recent Optimizations (v2.0.1)

This version focuses on peak performance and a premium feel:

- **Performance Overhaul:** Migrated heavy lists to `@shopify/flash-list` for 60FPS scrolling.
- **Zustand Selectors:** Optimized state management to prevent unnecessary UI re-renders.
- **Reanimated Timer:** Implemented a non-blocking 3-minute timer using `SharedValues` to save battery and improve responsiveness.
- **Skeleton UI:** Replaced generic loading indicators with modern Skeleton placeholders.
- **Micro-Animations:** Added snappy `FadeInUp` transitions for dropdowns and UI elements.
- **Bundle Optimization:** Reduced app size by removing unused assets and fonts.

---

## 🛠️ Tech Stack

- **Frontend:** React Native (Expo)
- **Styling:** StyleSheet (Vanilla) + Material Design Principles
- **State Management:** Zustand (Optimized with Selectors)
- **Animations:** React Native Reanimated v3
- **Database/Auth:** Firebase (Firestore & Auth)
- **Icons:** MaterialCommunityIcons, MaterialIcons

---

## 📦 Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/codebysrk/one-delhi.git
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npx expo start
   ```

4. **Run on Android/iOS:**
   - Press `a` for Android Emulator or `i` for iOS Simulator.
   - For a local release build:
     ```bash
     npx expo run:android --variant release
     ```

---

## 📸 Design Philosophy

The app follows a **Rail Red (#A51F38)** primary theme, emphasizing:
- **Visual Clarity:** High-contrast typography and intuitive icons.
- **Premium Feel:** Use of glassmorphism, subtle gradients, and smooth transitions.
- **Performance-First:** Every component is memoized and optimized for low-end devices.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Crafted with ❤️ for the citizens of Delhi.*
