import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import FloatingChatPanel from "@/components/FloatingChatPanel";

export default function StudentResults() {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const results = [
    {
      id: "mars",
      label: "Mars",
      letter: "A",
      percentage: 75,
      isSelected: true,
    },
    {
      id: "venus",
      label: "Venus",
      letter: "B",
      percentage: 5,
      isSelected: false,
    },
    {
      id: "jupiter",
      label: "Jupiter",
      letter: "C",
      percentage: 5,
      isSelected: false,
    },
    {
      id: "saturn",
      label: "Saturn",
      letter: "D",
      percentage: 15,
      isSelected: false,
    },
  ];

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
            00:15
          </div>
        </div>

        {/* Results Card */}
        <Card>
          <CardContent className="p-0">
            {/* Question Header */}
            <div className="bg-gray-700 text-white p-4 font-medium">
              Which planet is known as the Red Planet?*
            </div>

            {/* Results */}
            <div className="p-6 space-y-4">
              {results.map((result) => (
                <div key={result.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`flex items-center justify-center w-8 h-8 rounded-full text-white text-sm font-medium ${
                          result.isSelected ? "bg-primary" : "bg-gray-400"
                        }`}
                      >
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
                      className={`h-8 rounded-full flex items-center justify-start pl-3 ${
                        result.isSelected ? "bg-primary" : "bg-gray-400"
                      }`}
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

        {/* Footer Text */}
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900">
            Wait for the teacher to ask a new question..
          </p>
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
