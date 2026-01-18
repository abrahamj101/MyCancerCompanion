# MyCancerCompanion

[![Expo](https://img.shields.io/badge/Runs%20with-Expo-4630EB.svg?style=flat-square&logo=EXPO&logoColor=white)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://reactnative.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)

**MyCancerCompanion** is a cross-platform mobile application designed to empower patients by streamlining the tracking of medical data, symptoms, and appointment logistics.

Built with **React Native** and **Expo**, the app utilizes a unified codebase to deploy to both iOS and Android. It leverages **Firebase** for real-time data synchronization and secure authentication, ensuring critical health information is accessible and protected.

Created in collaboration with Jensen Joy.

---

## 🎥 Application Demo

[![Watch the Demo](https://img.youtube.com/vi/lyKE2Wz9Jpw/0.jpg)](https://youtu.be/lyKE2Wz9Jpw)

*> Click the image above to watch the full demo on YouTube.*

> **[🚀 View the Live Build on Expo (Web)](https://expo.dev/accounts/abrahamj101/projects/MyCancerCompanion/branches/main)**
> 
> **[🚀 View the Live Build on Expo (Mobile)](exp://exp.host/@abrahamj101/MyCancerCompanion)**

---

## 🚀 Key Features

* **Cross-Platform Architecture:** Single codebase deploying native binaries for both iOS and Android using Expo.
* **Real-Time Data Sync:** Implements **asynchronous data exchange** via Firebase Firestore to log and retrieve patient records instantly.
* **Secure Authentication:** User management and secure login flows utilizing Firebase Auth.
* **Modular UI Components:** Custom-built, reusable components ensuring a consistent and responsive user experience across different screen sizes.
* **Complex Form Handling:** Dynamic inputs for tracking symptoms, medication adherence, and daily health metrics.

---

## 🛠 Tech Stack

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | **React Native** | Component-based UI logic & native rendering |
| **Tooling** | **Expo / EAS** | Managed workflow, OTA updates, and CI/CD builds |
| **Language** | **JavaScript / TypeScript** | Core application logic |
| **Backend** | **Firebase** | NoSQL Database (Firestore) & Authentication |
| **Navigation** | **React Navigation** | Stack & Tab routing for intuitive app flow |
| **Version Control** | **Git / GitHub** | Feature branching and source control |

---

## 📸 Engineering Highlights

### Asynchronous Data Handling
The app communicates with the Firebase backend using JSON-structured data. This mirrors modern IoT communication patterns by handling state changes, connectivity issues, and data persistence asynchronously.

### CI/CD Pipeline
This project uses **EAS (Expo Application Services)** for continuous integration.
* **Development Builds:** Rapid iteration using Expo Go.
* **Preview Builds:** OTA (Over-the-Air) updates pushed to the main branch for immediate testing.

---

## 🏁 Getting Started
To run this project locally, follow these steps:

### Prerequisites
* Node.js (LTS version recommended)
* npm or yarn
* iOS Simulator (Mac) or Android Emulator

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/abrahamj101/MyCancerCompanion.git](https://github.com/abrahamj101/MyCancerCompanion.git)
    cd MyCancerCompanion
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Start the development server**
    ```bash
    npx expo start
    ```

4.  **Run on device**
    * Press `a` for Android Emulator.
    * Press `i` for iOS Simulator.
    * Or scan the QR code with your physical device using the Expo Go app.

---

## 👤 Author

**Joshua Abraham**
* **GitHub:** [abrahamj101](https://github.com/abrahamj101)
* **Education:** B.S. Computer Engineering, Texas A&M University

---

*This project is currently under active development.*
