import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, RefreshCw } from "lucide-react";
import FloatingChatPanel from "@/components/FloatingChatPanel";
import { useSocket } from "@/contexts/SocketContext";
// Removed unused toast import

interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  duration: number;
  createdAt: string;
  endTime?: string;
  isActive: boolean;
  results: Record<string, number>;
  roomId: string;  // Added roomId to the Poll interface
  [key: string]: any;  // Allow for additional properties
}

type PollResults = Record<string, number>;

export default function TeacherLive() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { isConnected, activePoll, results, userType, userName, joinRoom } =
    useSocket();
  const [fallbackPoll, setFallbackPoll] = useState<Poll | null>(null);
  const [fallbackResults, setFallbackResults] = useState<PollResults>({});

  const [roomId, setRoomId] = useState(
    sessionStorage.getItem("teacherRoomId") || "default-room",
  );

  // Auto-join as teacher when component mounts
  useEffect(() => {
    const teacherName = sessionStorage.getItem("teacherName") || "Teacher";
    if (!userName && teacherName) {
      joinRoom(teacherName, "teacher", roomId);
    }
  }, [userName, joinRoom, roomId]);

  // Fallback: Load current poll data from sessionStorage for development
  useEffect(() => {
    if (!isConnected) {
      const pollData = sessionStorage.getItem("currentPoll");
      if (pollData) {
        const poll = JSON.parse(pollData);
        setFallbackPoll(poll);

        // Simulate some results for demonstration
        const simulatedResults: any = {};
        poll.options.forEach((option: any, index: number) => {
          simulatedResults[option.id] = Math.floor(Math.random() * 20) + 1;
        });
        setFallbackResults(simulatedResults);
      }
    }
  }, [isConnected]);

  // Get current poll and results data
  const currentPoll = (activePoll && 'roomId' in activePoll && activePoll.roomId === roomId) 
    ? activePoll 
    : fallbackPoll;
  const currentResults = results || fallbackResults;

  // Calculate total votes
  const getTotalVotes = (): number => {
    return Object.values(currentResults).reduce((total: number, count) => total + (typeof count === 'number' ? count : 0), 0);
  };

  // Calculate percentage for an option
  const getPercentage = (optionId: string): number => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    const votes = currentResults[optionId] || 0;
    return Math.round((votes / total) * 100);
  };

  // Calculate percentage for an option (removed duplicate function)

  const handleEndPoll = () => {
    if (currentPoll) {
      if (isConnected) {
        // Socket.IO will handle poll ending
        // For now, just navigate to create new poll
        navigate("/create-poll");
      } else {
        // Fallback: move to poll history and clear sessionStorage
        const history = JSON.parse(
          sessionStorage.getItem("pollHistory") || "[]",
        );
        history.push({
          ...currentPoll,
          results: currentResults,
          endedAt: new Date().toISOString(),
        });
        sessionStorage.setItem("pollHistory", JSON.stringify(history));
        sessionStorage.removeItem("currentPoll");
        setFallbackPoll(null);
        navigate("/create-poll");
      }
    }
  };

  const refreshResults = () => {
    // In Socket.IO mode, results update automatically
    // For development fallback, simulate new votes
    if (!isConnected && currentPoll) {
      const newResults: any = {};
      currentPoll.options.forEach((option: any) => {
        newResults[option.id] = Math.floor(Math.random() * 30) + 1;
      });
      setFallbackResults(newResults);
    }
  };

  if (!currentPoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="bg-white p-6 rounded-lg shadow-md inline-block">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              No Active Poll in Room: {roomId}
            </h2>
            <p className="text-gray-600 mb-6">
              Create a new poll to start engaging with students in this room.
            </p>
            <div className="space-y-4">
              <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                <p className="font-medium">Room ID: {roomId}</p>
                <p className="text-xs">Share this ID with your students to join this session</p>
              </div>
              <Button 
                onClick={() => navigate("/create-poll")} 
                size="lg"
                className="px-8"
              >
                Create New Poll
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Room Info */}
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Room: {roomId}</h3>
              <p className="text-sm text-gray-500">Share this ID with your students</p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigator.clipboard.writeText(roomId)}
            >
              Copy Room ID
            </Button>
          </div>
        </div>
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Live Poll: {currentPoll.question}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                refreshResults();
                // Show a simple browser alert since we're not using a toast library
                alert('Results refreshed');
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={() => navigate("/poll-history")}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Eye className="w-4 h-4" />
              History
            </Button>
          </div>
        </div>



        {/* Poll Results */}
        <Card>
          <CardContent className="p-0">
            {/* Results */}
            <div className="p-6 space-y-6">
              {currentPoll.options.map((option, index) => {
                const percentage = getPercentage(option.id);
                const votes = currentResults[option.id] || 0;
                const isCorrect = option.isCorrect;
                const totalVotes = getTotalVotes();

                return (
                  <div key={option.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium ${
                            isCorrect ? "bg-green-600" : "bg-primary"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <span className="text-lg font-medium text-gray-900">
                          {option.text}
                          {isCorrect && (
                            <span className="ml-2 text-green-600 text-sm">
                              ✓ Correct
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-lg font-medium text-gray-900">
                          {percentage}%
                        </span>
                        <div className="text-sm text-gray-500">
                          {votes} {votes === 1 ? 'vote' : 'votes'}
                          {totalVotes > 0 && (
                            <span className="ml-1 text-gray-400">
                              ({Math.round((votes / totalVotes) * 100)}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCorrect ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.max(5, percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Poll Stats */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total Responses</h3>
                  <p className="text-2xl font-bold">{getTotalVotes()}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Time Remaining</h3>
                  <p className="text-2xl font-bold">
                    {currentPoll.endTime && typeof currentPoll.endTime === 'string'
                      ? Math.max(0, Math.ceil((new Date(currentPoll.endTime).getTime() - Date.now()) / 1000)) + 's' 
                      : 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button
                  onClick={() => {
                    if (confirm('Are you sure you want to end this poll?')) {
                      handleEndPoll();
                    }
                  }}
                  variant="destructive"
                  size="lg"
                  className="px-8 py-3 text-lg font-medium rounded-full"
                >
                  End Poll
                </Button>
                <Button
                  onClick={() => navigate("/create-poll")}
                  size="lg"
                  className="px-8 py-3 text-lg font-medium rounded-full"
                >
                  + New Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>



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
          isTeacher={true}
        />
      </div>
    </div>
  );
}
