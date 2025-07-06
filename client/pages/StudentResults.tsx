import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSocket } from "@/contexts/SocketContext";
import FloatingChatPanel from "@/components/FloatingChatPanel";

export default function StudentResults() {
  const navigate = useNavigate();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const { activePoll, results, submitAnswer, userId } = useSocket();
  const [studentAnswer, setStudentAnswer] = useState<{
    optionId: string;
    optionText: string;
    submittedAt: Date;
  } | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // Calculate percentages
  const getTotalVotes = () => {
    if (!results) return 0;
    return Object.values(results).reduce((a: any, b: any) => a + b, 0);
  };

  const getPercentage = (optionId: string) => {
    const total = getTotalVotes();
    if (total === 0 || !results || !results[optionId]) return 0;
    return Math.round((results[optionId] / total) * 100);
  };

  // Handle poll timer
  useEffect(() => {
    if (!activePoll?.endTime) return;

    const endTime = new Date(activePoll.endTime).getTime();
    const updateTimer = () => {
      const now = new Date().getTime();
      const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
      setTimeRemaining(remaining);

      if (now >= endTime) {
        clearInterval(timer);
        setTimeRemaining(0);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);

    return () => clearInterval(timer);
  }, [activePoll?.endTime]);

  // Handle answer submission
  const handleAnswerSubmit = (optionId: string, optionText: string) => {
    if (hasSubmitted) return;
    
    submitAnswer(optionId);
    setStudentAnswer({
      optionId,
      optionText,
      submittedAt: new Date()
    });
    setHasSubmitted(true);
  };

  if (!activePoll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Active Poll
          </h2>
          <p className="text-gray-600">
            Please wait for a poll to be started by the teacher.
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
          <h2 className="text-xl font-semibold text-gray-900">
            {activePoll.question}
          </h2>
          {timeRemaining > 0 && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              {timeRemaining}s remaining
            </div>
          )}
        </div>

        {/* Your Answer */}
        {studentAnswer && (
          <Card className="border-blue-500 bg-blue-50">
            <CardContent className="p-4">
              <div className="text-sm font-medium text-blue-700 mb-1">
                Your Answer:
              </div>
              <div className="text-lg font-semibold text-gray-900">
                {studentAnswer.optionText}
              </div>
              {timeRemaining > 0 && (
                <div className="text-sm text-blue-600 mt-1">
                  Submitted at: {studentAnswer.submittedAt.toLocaleTimeString()}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Results Card */}
        <Card>
          <CardContent className="p-0">
            {/* Question Header */}
            <div className="bg-gray-700 text-white p-4 font-medium">
              {activePoll.question}
            </div>

            {/* Poll Options */}
            <div className="p-6 space-y-4">
              {activePoll.options.map((option: any, index: number) => {
                const percentage = getPercentage(option.id);
                const votes = results ? results[option.id] || 0 : 0;
                const isStudentAnswer = studentAnswer?.optionId === option.id;
                const isCorrect = option.isCorrect;
                const isPollActive = timeRemaining > 0 && !hasSubmitted;

                return (
                  <div key={option.id} className="space-y-2">
                    <button
                      onClick={() => isPollActive && handleAnswerSubmit(option.id, option.text)}
                      disabled={!isPollActive || hasSubmitted}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isStudentAnswer
                          ? 'border-blue-500 bg-blue-50'
                          : isPollActive
                            ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            : 'border-gray-100 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium ${
                              isCorrect
                                ? 'bg-green-600'
                                : isStudentAnswer
                                  ? 'bg-blue-600'
                                  : 'bg-gray-400'
                            }`}
                          >
                            {String.fromCharCode(65 + index)}
                          </div>
                          <span className="text-lg font-medium text-gray-900">
                            {option.text}
                            {isStudentAnswer && (
                              <span className="ml-2 text-blue-600 text-sm">
                                👤 Your choice
                              </span>
                            )}
                            {isCorrect && !isPollActive && (
                              <span className="ml-2 text-green-600 text-sm">
                                ✓ Correct
                              </span>
                            )}
                          </span>
                        </div>
                        {!isPollActive && (
                          <div className="text-right">
                            <span className="text-lg font-medium text-gray-900">
                              {percentage}%
                            </span>
                            <div className="text-sm text-gray-500">
                              {votes} {votes === 1 ? 'vote' : 'votes'}
                            </div>
                          </div>
                        )}
                      </div>
                      {!isPollActive && (
                        <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
                          <div
                            className={`h-3 rounded-full transition-all ${
                              isCorrect
                                ? 'bg-green-600'
                                : isStudentAnswer
                                  ? 'bg-blue-600'
                                  : 'bg-gray-400'
                            }`}
                            style={{ width: `${Math.max(percentage, 5)}%` }}
                          />
                        </div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Stats */}
            <div className="border-t p-4 bg-gray-50">
              <div className="text-sm text-gray-600 text-center">
                {timeRemaining > 0
                  ? hasSubmitted
                    ? `Waiting for other students... (${getTotalVotes()} responses)`
                    : 'Select your answer above'
                  : `Poll ended • ${getTotalVotes()} total responses`}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">
            {timeRemaining > 0
              ? hasSubmitted
                ? 'Waiting for other students...'
                : 'Select your answer above'
              : 'Wait for the teacher to ask a new question...'}
          </p>
          <Button
            variant="outline"
            onClick={() => navigate("/student-waiting")}
            className="text-sm"
          >
            Leave Session
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
