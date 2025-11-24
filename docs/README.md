# Astrova - Vedic Astrology App

🌟 **Modern Vedic Astrology platform** built with React (Vite) frontend and Node.js backend.

## ✨ Features

- **Birth Chart Generation** - Accurate Vedic astrology calculations using Swiss Ephemeris
- **Planetary Positions** - Real-time planetary position tracking
- **Vimshottari Dasha** - Complete dasha period calculations
- **Chart Visualization** - Traditional North Indian chart display
- **Transit Analysis** - Current planetary transit effects

## 🏗️ Project Structure

```
astrova hf/
├── backend/              # Node.js backend server
│   ├── controllers/      # API controllers
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── ingestion/       # Event data ingestion
│   ├── utils/           # Utilities
│   └── server.js        # Main server
├── src/                 # React frontend
│   ├── components/      # UI components
│   ├── pages/          # Page components
│   ├── services/       # API services
│   └── utils/          # Utilities
├── public/             # Static assets
└── scripts/           # Build scripts
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd "astrova"
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install
   
   # Backend
   cd backend
   npm install
   cd ..
   ```

3. **Start the applications**
   
   **Backend** (Terminal 1):
   ```bash
   cd backend
   npm start
   ```
   
   **Frontend** (Terminal 2):
   ```bash
   npm start
   ```

4. **Access the app**
   - Frontend: http://localhost:4028
   - Backend API: http://localhost:3001

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Calculations**: Swiss Ephemeris
- **Styling**: Tailwind CSS with custom themes

## 🎯 Core Features

### Birth Chart Analysis
- Accurate sidereal calculations
- Lahiri Ayanamsa
- House system calculations
- Planetary strength analysis

### Dasha System
- Complete Vimshottari Dasha periods
- Mahadasha and Antardasha calculations
- Timing predictions

### Transit Analysis
- Current planetary positions
- Transit effects analysis

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**:
```env
VITE_API_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001
```

**Backend (backend/.env)**:
```env
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:4028
EPHEMERIS_PATH=./ephemeris
LOG_LEVEL=info
```

## 📊 API Endpoints

- `GET /api/planetary-positions` - Get planetary positions
- `POST /api/kundli/generate` - Generate birth chart
- `GET /api/dasha/vimshottari` - Calculate dasha periods
- `GET /api/transits/current` - Current transits
- `POST /api/panchang` - Daily panchang

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📜 License

This project is licensed under the MIT License.

---

**Built with ❤️ for Vedic Astrology enthusiasts**
