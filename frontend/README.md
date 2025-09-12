# OkayGoal Frontend

The frontend web application for OkayGoal - Football Live Scores & Statistics.

## 🚀 Features

- **Live Scores Dashboard** - Real-time football match updates
- **Authentication System** - Secure user registration and login
- **Responsive Design** - Mobile-first design with Tailwind CSS
- **Dark Mode Support** - System preference detection and manual toggle
- **Progressive Web App** - Offline capabilities and native app feel
- **Real-time Updates** - WebSocket integration for live match data
- **User Personalization** - Follow teams, players, and competitions

## 🛠 Tech Stack

- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **Redux Toolkit** for state management
- **React Hook Form** + Zod for form validation
- **React Query** for server state management
- **WebSocket** for real-time updates
- **PWA** with service worker support

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── ui/             # Basic UI components
│   ├── auth/           # Authentication components
│   ├── matches/        # Match-related components
│   ├── layout/         # Layout components
│   └── common/         # Common components
├── pages/              # Page components
├── store/              # Redux store and slices
├── services/           # API and WebSocket services
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── main.tsx           # Application entry point
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Backend API running on port 3001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

## 🔧 Environment Variables

Create a `.env.local` file with:

```env
VITE_API_URL=http://localhost:3001/api/v1
VITE_WS_URL=ws://localhost:3001/ws
```

## 🎨 Design System

### Colors
- **Primary Green**: #00C851 (Success, live indicators)
- **Primary Blue**: #0066CC (Links, CTAs) 
- **Background**: #FFFFFF (Light), #121212 (Dark)

### Typography
- **Font**: Inter (Clean, modern, excellent readability)
- **Headers**: Inter Bold, 24px-32px
- **Body**: Inter Regular, 16px
- **Live Scores**: Inter Black, 48px

### Components
- Modular component library in `components/ui/`
- Consistent prop interfaces
- Dark mode support
- Accessibility compliant

## 📱 PWA Features

- **Offline Support** - Works without internet connection
- **Install Prompt** - Can be installed as native app
- **Push Notifications** - Live match updates
- **Background Sync** - Updates when connection restored

## 🔐 Authentication

- JWT-based authentication
- Refresh token rotation
- Persistent login state
- Protected routes

## 📊 Real-time Updates

- WebSocket connection for live scores
- Automatic reconnection handling
- Fallback to polling when WebSocket unavailable
- Real-time notifications for followed teams

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify

```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🔍 Performance

- **Target**: <3 second load time
- **Bundle size**: Optimized with code splitting
- **Images**: Lazy loading and WebP format
- **Caching**: Aggressive caching strategy
- **CDN**: Assets served from CDN

## 🎯 Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Mobile 88+)

## 📝 License

Private - All rights reserved