# SimSync - Sims 4 Custom Content Backup Tool

## 🧩 Project Overview
SimSync allows Sims 4 players to back up and restore their Mods and Tray folders easily between computers. Perfect for content creators who work on multiple devices!

## 🏗️ Project Structure
```
simsync/
├── frontend/                   # React + Tailwind app
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Main app pages
│   │   └── firebase.js         # Firebase client config
├── backend/                    # FastAPI Python server
│   ├── routes/                 # API endpoints
│   └── main.py                 # Server entry point
└── README.md                   # This file
```

## 🚀 Tech Stack
- **Frontend**: React + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Authentication**: Firebase Auth
- **Database**: Firestore
- **Storage**: Firebase Cloud Storage

## 🎯 Features (v1)
- 🔑 User authentication (email/password)
- ☁️ Upload Sims 4 custom content folders
- 💾 Store file metadata in cloud database
- 📥 Download/restore content on new devices
- 🧹 Clean, modern UI with progress indicators

## 📦 Getting Started
(Setup instructions will be added as we build)

---
*Built for The Sims 4 community with ❤️*