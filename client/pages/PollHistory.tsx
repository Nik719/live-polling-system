import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import FloatingChatPanel from "@/components/FloatingChatPanel";

export default function PollHistory() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const pollHistory = [
    {
      id: 1,
      question: "Which planet is known as the Red Planet?*",
      results: [
        { id: "mars", label: "Mars", letter: "A", percentage: 75 },
        { id: "venus", label: "Venus", letter: "B", percentage: 5 },
        { id: "jupiter", label: "Jupiter", letter: "C", percentage: 5 },
        { id: "saturn", label: "Saturn", letter: "D", percentage: 15 },
      ],
    },
    {
      id: 2,
      question: "Which planet is known as the Red Planet?*",
      results: [
        { id: "mars", label: "Mars", letter: "A", percentage: 75 },
        { id: "venus", label: "Venus", letter: "B", percentage: 5 },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-4xl font-bold text-gray-900">View Poll History</h1>

        {/* Poll History */}
        <div className="space-y-8">
          {pollHistory.map((poll) => (
            <div key={poll.id} className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Question {poll.id}
              </h2>

              <Card>
                <CardContent className="p-0">
                  {/* Question Header */}
                  <div className="bg-gray-700 text-white p-4 font-medium">
                    {poll.question}
                  </div>

                  {/* Results */}
                  <div className="p-6 space-y-4">
                    {poll.results.map((result) => (
                      <div key={result.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white text-sm font-medium">
                              {result.letter}
                            </div>
                            <span className="text-lg font-medium text-white">
                              {result.label}
                            </span>
                          </div>
                          <span className="text-lg font-medium text-gray-900">
                            {result.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-8">
                          <div
                            className="h-8 rounded-full flex items-center justify-start pl-3 bg-primary"
                            style={{ width: `${result.percentage}%` }}
                          >
                            {result.percentage > 10 && (
                              <span className="text-white text-sm font-medium">
                                {result.label}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
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
          isTeacher={true}
        />
      </div>
    </div>
  );
}
