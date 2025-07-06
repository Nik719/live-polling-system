# Live Polling System

A real-time polling application that enables interactive Q&A sessions between teachers and students. Built with modern web technologies to provide a seamless, real-time experience.

## 🚀 Features

- **Real-time Polling**: Create and participate in live polls with instant results
- **User Roles**: Separate interfaces for teachers and students
- **Interactive Dashboard**: Real-time updates and visualizations
- **Chat Functionality**: Integrated chat for discussions during sessions
- **Responsive Design**: Works on desktop and mobile devices
- **Persistent History**: View past poll results and analytics

## 🛠️ Tech Stack

- **Frontend**: 
  - React 18 with TypeScript
  - Vite for fast development and building
  - Tailwind CSS for styling
  - Socket.IO for real-time communication
  - React Query for server state management
  - Framer Motion for animations

- **Backend**:
  - Node.js with Express
  - Socket.IO for WebSocket connections
  - TypeScript for type safety

- **Development Tools**:
  - Vite for development server and builds
  - TypeScript for type checking
  - Prettier for code formatting

## 📦 Project Structure

```
├── client/                 # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/              # Page components
│   ├── contexts/           # React contexts
│   └── hooks/              # Custom React hooks
│
├── server/                 # Backend server
│   ├── socket.ts           # Socket.IO implementation
│   ├── routes/             # API routes
│   └── dev-server.ts       # Development server setup
│
├── shared/                 # Shared code between client and server
│   └── api.ts              # Shared TypeScript types and utilities
│
├── public/                 # Static files
└── dist/                   # Build output (generated)
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/live-polling-system.git
   cd live-polling-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=3000
   NODE_ENV=development
   ```

### Running Locally

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
# Build both client and server
npm run build

# Start the production server
npm start
```

## 🌐 Deployment

The application is configured for deployment on Vercel. The `vercel.json` file includes the necessary routing and build configurations.

### Vercel Deployment Steps:

1. Push your code to a Git repository
2. Import the repository into Vercel
3. Configure environment variables in Vercel's project settings
4. Deploy!

## 📚 Documentation

### API Endpoints

- `POST /api/polls` - Create a new poll
- `GET /api/polls/:id` - Get poll details
- `POST /api/polls/:id/vote` - Submit a vote
- `GET /api/polls/:id/results` - Get poll results

### WebSocket Events

- `joinSession` - Join a polling session
- `createPoll` - Create a new poll
- `submitVote` - Submit a vote
- `endPoll` - End the current poll
- `chatMessage` - Send a chat message

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👏 Acknowledgments

- Built with ❤️ using modern web technologies
- Special thanks to all contributors
