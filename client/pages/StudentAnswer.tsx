import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import FloatingChatPanel from "@/components/FloatingChatPanel";
import { useSocket } from "@/contexts/SocketContext";

export default function StudentAnswer() {
  const navigate = useNavigate();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const {
    isConnected,
    activePoll,
    userType,
    userName,
    joinRoom,
    submitAnswer,
  } = useSocket();

  // Auto-join as student when component mounts
  useEffect(() => {
    const studentName = sessionStorage.getItem("studentName");
    if (!userName && studentName) {
      joinRoom(studentName, "student");
    }
  }, [userName, joinRoom]);

  // Load poll data from Socket.IO or sessionStorage fallback
  useEffect(() => {
    if (activePoll && activePoll.isActive) {
      setTimeLeft(activePoll.duration);
    } else if (!isConnected) {
      // Fallback to sessionStorage for development
      const pollData = sessionStorage.getItem("currentPoll");
      if (pollData) {
        const poll = JSON.parse(pollData);
        setTimeLeft(parseInt(poll.duration) || 60);
      } else {
        navigate("/student-waiting");
      }
    } else if (!activePoll) {
      // No active poll, redirect back to waiting
      navigate("/student-waiting");
    }
  }, [activePoll, navigate, isConnected]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Auto-submit when time runs out
      handleSubmit(true);
    }
  }, [timeLeft]);

  const handleSubmit = (autoSubmit = false) => {
    if (selectedAnswer || autoSubmit) {
      if (isConnected && activePoll) {
        // Use Socket.IO for real-time answer submission
        submitAnswer(selectedAnswer);
      } else {
        // Fallback: Store answer in sessionStorage for development
        const pollData = sessionStorage.getItem("currentPoll");
        const poll = pollData ? JSON.parse(pollData) : null;
        const answerData = {
          question: poll?.question || activePoll?.question,
          selectedAnswer,
          submittedAt: new Date().toISOString(),
          timeRemaining: timeLeft,
          autoSubmitted: autoSubmit,
        };
        sessionStorage.setItem("studentAnswer", JSON.stringify(answerData));
      }
      navigate("/student-results");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Get poll data from Socket.IO or sessionStorage fallback
  const pollData =
    activePoll ||
    (() => {
      const sessionPoll = sessionStorage.getItem("currentPoll");
      return sessionPoll ? JSON.parse(sessionPoll) : null;
    })();

  if (!pollData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Active Poll
          </h2>
          <p className="text-gray-600">
            Please wait for the teacher to start a poll.
          </p>
          <Button onClick={() => navigate("/student-waiting")} className="mt-4">
            Go Back to Waiting
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Question 1</h2>
          <div className="flex items-center gap-2 text-red-600 font-medium">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                clipRule="evenodd"
              />
            </svg>
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Question Card */}
        <Card>
          <CardContent className="p-0">
            {/* Question Header */}
            <div className="bg-gray-700 text-white p-4 font-medium">
              {pollData.question}
            </div>

            {/* Options */}
            <div className="p-6">
              <RadioGroup
                value={selectedAnswer}
                onValueChange={setSelectedAnswer}
              >
                <div className="space-y-3">
                  {pollData.options.map((option: any, index: number) => (
                    <div
                      key={option.id}
                      className="flex items-center space-x-3"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex items-center space-x-2 flex-1">
                        <RadioGroupItem value={option.text} id={option.id} />
                        <Label
                          htmlFor={option.id}
                          className="text-lg font-medium cursor-pointer flex-1"
                        >
                          {option.text}
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            onClick={() => handleSubmit(false)}
            disabled={!selectedAnswer}
            size="lg"
            className="px-8 py-3 text-lg font-medium rounded-full"
          >
            Submit Answer
          </Button>
        </div>

        {/* Navigation Helper */}
        <div className="text-center">
          <Button
            variant="outline"
            onClick={() => navigate("/student-waiting")}
            className="text-sm"
          >
            Back to Waiting Room
          </Button>
        </div>

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
