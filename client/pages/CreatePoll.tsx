import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function CreatePoll() {
  const navigate = useNavigate();
  const { joinRoom, createPoll, userName } = useSocket();
  const [question, setQuestion] = useState(
    "Which planet is known as the Red Planet?",
  );
  const [duration, setDuration] = useState("60");
  const [options, setOptions] = useState<PollOption[]>([
    { id: uuidv4(), text: "Mars", isCorrect: true },
    { id: uuidv4(), text: "Venus", isCorrect: false },
  ]);

  // Ensure teacher is connected to socket
  useEffect(() => {
    const teacherName = sessionStorage.getItem("teacherName") || "Teacher";
    if (userName !== teacherName) {
      joinRoom(teacherName, "teacher");
      sessionStorage.setItem("teacherName", teacherName);
    }
  }, [joinRoom, userName]);

  const addOption = () => {
    const newOption: PollOption = {
      id: uuidv4(),
      text: "",
      isCorrect: false,
    };
    setOptions([...options, newOption]);
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const updateCorrectAnswer = (id: string, isCorrect: boolean) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, isCorrect } : opt)),
    );
  };

  const handleAskQuestion = () => {
    // Validate inputs
    if (!question.trim()) {
      toast.error("Please enter a question");
      return;
    }

    const validOptions = options.filter((opt) => opt.text.trim());
    if (validOptions.length < 2) {
      toast.error("Please provide at least 2 options");
      return;
    }

    const hasCorrectAnswer = validOptions.some((opt) => opt.isCorrect);
    if (!hasCorrectAnswer) {
      toast.error("Please mark at least one option as correct");
      return;
    }

    // Create poll via socket
    createPoll({
      question: question.trim(),
      options: validOptions,
      duration: parseInt(duration),
    });

    toast.success("Poll created successfully!");
    navigate("/teacher-live");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Badge */}
        <div className="flex justify-start pt-4">
          <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            Interactive Poll
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Title Section */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              Let's Get Started
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl">
              you'll have the ability to create and manage polls, ask questions,
              and monitor your students' responses in real-time.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Question and Options */}
            <div className="lg:col-span-2 space-y-6">
              {/* Question Input */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-lg font-semibold text-gray-900">
                    Enter your question
                  </label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">60 seconds</SelectItem>
                      <SelectItem value="90">90 seconds</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Card>
                  <CardContent className="p-6">
                    <Textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="min-h-[120px] text-lg resize-none border-0 shadow-none focus-visible:ring-0 p-0"
                      maxLength={200}
                      placeholder="Enter your question here..."
                    />
                    <div className="flex justify-end mt-4 text-sm text-gray-500">
                      {question.length}/200
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Edit Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Edit Options
                </h3>

                <div className="space-y-3">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <Input
                        value={option.text}
                        onChange={(e) =>
                          updateOption(option.id, e.target.value)
                        }
                        className="flex-1"
                        placeholder="Enter option text"
                      />
                    </div>
                  ))}
                </div>

                <Button variant="outline" onClick={addOption} className="w-fit">
                  <Plus className="w-4 h-4 mr-2" />
                  Add More option
                </Button>
              </div>
            </div>

            {/* Right Column - Correct Answers */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Is it Correct?
              </h3>

              <div className="space-y-4">
                {options.map((option, index) => (
                  <div key={option.id} className="space-y-2">
                    <div className="text-sm font-medium text-gray-600 mb-2">
                      Option {index + 1}
                    </div>
                    <RadioGroup
                      value={option.isCorrect ? "yes" : "no"}
                      onValueChange={(value) =>
                        updateCorrectAnswer(option.id, value === "yes")
                      }
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`${option.id}-yes`} />
                          <Label htmlFor={`${option.id}-yes`}>Yes</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`${option.id}-no`} />
                          <Label htmlFor={`${option.id}-no`}>No</Label>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Ask Question Button */}
        <div className="fixed bottom-8 right-8">
          <Button
            onClick={handleAskQuestion}
            disabled={
              !question.trim() || options.every((opt) => !opt.text.trim())
            }
            size="lg"
            className="px-8 py-3 text-lg font-medium rounded-full shadow-lg"
          >
            Ask Question
          </Button>
        </div>
      </div>
    </div>
  );
}
