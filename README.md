# IV Drug Manager

A cross-platform desktop application for managing IV drug preparations in hospital pharmacy settings. Built with Electron, React, TypeScript, and SQLite.

![Electron](https://img.shields.io/badge/Electron-30.0-47848F?style=flat-square&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?style=flat-square&logo=typescript&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite&logoColor=white)

## Features

### 📋 Patient Management

- Add, edit, and delete patients with comprehensive details
- Filter patients by entry date
- Import patients in bulk
- Track patient information: hospital ID, department, DOB, gender, weight, and height

### 💊 Drug Database

- Pre-seeded with common IV drugs following AIVPC V5.4 format
- Comprehensive drug information including:
  - Trade name, generic name, and Arabic name
  - Form (Powder/Solution) and container type (Vial/Ampoule)
  - Reconstitution details and diluent compatibility (NS, D5W, SWI)
  - Further dilution specifications
  - Stability information (room temperature and refrigeration)
  - Dosing ranges (min/max dose per kg, per dose, per day)
  - Special alerts (photosensitive, biohazard)
  - Infusion time and special instructions

### 📝 IV Preparation Worksheet

- Generate preparation worksheets for each patient
- Calculate doses based on patient weight
- Calculate BSA (Body Surface Area) and BMI
- Track preparation status (pending/completed)

### 👥 User Management

- Role-based access control (Admin/Pharmacist)
- Customizable permissions:
  - Manage patients
  - Manage drugs
  - Manage preparations
  - Manage users
  - View audit logs

### 📊 Audit Logs

- Track all system actions
- Record user activity with timestamps
- View detailed action history

## Tech Stack

- **Frontend**: React 18, TypeScript, TailwindCSS
- **Desktop Framework**: Electron 30
- **Database**: SQLite (better-sqlite3)
- **Routing**: React Router DOM v7
- **Build Tool**: Vite
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/iv-drug-manager.git
   cd iv-drug-manager
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Building for Production

Build the application for your platform:

```bash
npm run build
```

This will:

1. Compile TypeScript
2. Build the Vite frontend
3. Package the Electron app using electron-builder

Built packages will be available in the `release` directory.

## Default Credentials

The application creates a default admin user on first run:

- **Username**: `admin`
- **Password**: `admin`

> ⚠️ **Important**: Change the default password after first login for security.

## Project Structure

```
iv-drug-manager/
├── electron/                 # Electron main process
│   ├── db/                   # Database setup and seed data
│   │   ├── index.ts          # Database initialization & migrations
│   │   └── drug-seed-data.ts # Pre-seeded drug data
│   ├── ipc.ts                # IPC handlers for main-renderer communication
│   ├── main.ts               # Electron main entry
│   └── preload.ts            # Preload script for secure IPC
├── src/                      # React frontend
│   ├── components/           # Reusable UI components
│   ├── context/              # React context (Auth)
│   ├── layouts/              # Layout components
│   ├── lib/                  # Utility functions
│   ├── pages/                # Page components
│   │   ├── Dashboard.tsx     # Main patient list
│   │   ├── DrugsPage.tsx     # Drug database management
│   │   ├── PreparationWorksheet.tsx  # IV prep worksheet
│   │   ├── UsersPage.tsx     # User management
│   │   ├── AuditLogsPage.tsx # Audit log viewer
│   │   └── Login.tsx         # Login page
│   ├── App.tsx               # App routes and providers
│   └── main.tsx              # React entry point
├── public/                   # Static assets
└── package.json
```

## Database

The application uses SQLite with the following main tables:

- **users** - User accounts with roles and permissions
- **patients** - Patient records with entry dates
- **drugs** - IV drug database with comprehensive preparation info
- **preparations** - IV preparation records linked to patients and drugs
- **audit_logs** - System activity tracking

The database file is stored at:

- **macOS**: `~/Library/Application Support/iv-drug-administrator/iv_drug_manager.db`
- **Windows**: `%APPDATA%/iv-drug-administrator/iv_drug_manager.db`
- **Linux**: `~/.config/iv-drug-administrator/iv_drug_manager.db`

## Scripts

| Script            | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `npm run dev`     | Start development server with hot reload               |
| `npm run build`   | Build for production and package with electron-builder |
| `npm run lint`    | Run ESLint                                             |
| `npm run preview` | Preview production build                               |

## License

This project is private and proprietary.

## Author

**Mahmoud Metwalli**
