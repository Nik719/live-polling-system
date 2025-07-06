import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import FloatingChatPanel from "@/components/FloatingChatPanel";
import { useSocket } from "@/contexts/SocketContext";

export default function StudentWaiting() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { activePoll, isConnected } = useSocket();

  // Redirect to answer page when a new poll is created
  useEffect(() => {
    if (activePoll && activePoll.isActive) {
      navigate("/student-answer");
    }
  }, [activePoll, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Interactive Poll
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? "bg-green-500" : "bg-red-500"
            }`}
          ></div>
          <span className="text-gray-600">
            {isConnected ? "Connected to server" : "Connecting..."}
          </span>
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin" />
        </div>

        {/* Main Text */}
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
          Wait for the teacher to ask questions..
        </h1>

        {/* Chat Button */}
        <div className="fixed bottom-8 right-8">
          <button
            onClick={() => setIsChatOpen(!isChatOpen)}
            className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </button>
        </div>

        {/* Floating Chat Panel */}
        <FloatingChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          isTeacher={false}
        />
      </div>
    </div>
  );
}
