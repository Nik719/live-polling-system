import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { useSocket } from "@/contexts/SocketContext";

interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function CreatePoll() {
  const [question, setQuestion] = useState(
    "Which planet is known as the Red Planet?",
  );
  const [duration, setDuration] = useState("60");
  const [options, setOptions] = useState<PollOption[]>([
    { id: uuidv4(), text: "Mars", isCorrect: true },
    { id: uuidv4(), text: "Venus", isCorrect: false },
  ]);
  const [pollHistory, setPollHistory] = useState<any[]>([]);
  const { createPoll, pollHistory: socketPollHistory } = useSocket();

  // Update local poll history when socket poll history changes
  useEffect(() => {
    if (socketPollHistory && socketPollHistory.length > 0) {
      setPollHistory(socketPollHistory.map(poll => ({
        id: poll.id,
        question: poll.question,
        results: poll.options.map((opt: any) => ({
          id: opt.id,
          label: opt.text,
          letter: String.fromCharCode(65 + poll.options.indexOf(opt)),
          percentage: poll.results ? (poll.results[opt.id] || 0) : 0,
          isCorrect: opt.isCorrect
        }))
      })));
    }
  }, [socketPollHistory]);

  const handleAddOption = () => {
    setOptions([...options, { id: uuidv4(), text: "", isCorrect: false }]);
  };

  const handleOptionChange = (id: string, field: keyof PollOption, value: string | boolean) => {
    setOptions(
      options.map((option) =>
        option.id === id ? { ...option, [field]: value } : option
      )
    );
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((option) => option.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (options.filter(opt => opt.isCorrect).length === 0) {
      alert("Please mark at least one option as correct");
      return;
    }
    if (options.some(opt => !opt.text.trim())) {
      alert("Please fill in all options");
      return;
    }
    
    createPoll({
      question,
      options: options.map(opt => ({
        id: opt.id,
        text: opt.text,
        isCorrect: opt.isCorrect
      })),
      duration: parseInt(duration, 10)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Create New Poll</h1>

        {/* Create Poll Form */}
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Input */}
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Enter your question"
                required
              />
            </div>

            {/* Options */}
            <div className="space-y-4">
              <Label>Options</Label>
              <div className="space-y-3">
                {options.map((option, index) => (
                  <div key={option.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`correct-${option.id}`}
                      checked={option.isCorrect}
                      onCheckedChange={(checked) =>
                        handleOptionChange(option.id, 'isCorrect', checked)
                      }
                      className="h-5 w-5"
                    />
                    <Input
                      value={option.text}
                      onChange={(e) =>
                        handleOptionChange(option.id, 'text', e.target.value)
                      }
                      placeholder={`Option ${index + 1}`}
                      required
                      className="flex-1"
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(option.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="10"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                className="w-32"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <Button type="submit" className="w-full md:w-auto">
                Create Poll
              </Button>
            </div>
          </form>
        </Card>

        {/* Poll History */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Poll History</h2>
          {pollHistory.length === 0 ? (
            <p className="text-gray-500">No poll history available</p>
          ) : (
            <div className="space-y-6">
              {pollHistory.map((poll, index) => (
                <Card key={poll.id || index} className="overflow-hidden">
                  <div className="bg-gray-800 text-white p-4 font-medium">
                    {poll.question}
                  </div>
                  <CardContent className="p-6 space-y-4">
                    {poll.results.map((result) => (
                      <div key={result.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white text-sm font-medium">
                              {result.letter}
                            </div>
                            <span className="text-gray-900 font-medium">
                              {result.label}
                              {result.isCorrect && (
                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
                                  Correct
                                </span>
                              )}
                            </span>
                          </div>
                          <span className="font-medium">
                            {result.percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="h-3 rounded-full bg-blue-600"
                            style={{ width: `${result.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
