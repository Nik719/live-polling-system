import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/contexts/SocketContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export default function CreatePoll() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, userType, joinRoom, createPoll } = useSocket();
  
  const [question, setQuestion] = useState("Which planet is known as the Red Planet?");
  const [duration, setDuration] = useState("60");
  const [options, setOptions] = useState<PollOption[]>([
    { id: "1", text: "Mars", isCorrect: true },
    { id: "2", text: "Venus", isCorrect: false },
  ]);
  const [roomName, setRoomName] = useState("");
  const [isCopied, setIsCopied] = useState(false);

  // Auto-join as teacher when component mounts
  useEffect(() => {
    const roomNameFromState = location.state?.roomName || `room-${Math.floor(1000 + Math.random() * 9000)}`;
    setRoomName(roomNameFromState);
    
    const teacherName = sessionStorage.getItem("teacherName") || "Teacher";
    if (teacherName) {
      joinRoom(teacherName, "teacher", roomNameFromState);
    }
  }, [joinRoom, location.state]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomName);
    setIsCopied(true);
    toast.success("Room ID copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const addOption = () => {
    if (options.length >= 6) return;
    const newOption: PollOption = {
      id: Date.now().toString(),
      text: "",
      isCorrect: false,
    };
    setOptions([...options, newOption]);
  };

  const removeOption = (id: string) => {
    if (options.length <= 2) return;
    setOptions(options.filter((opt) => opt.id !== id));
  };

  const updateOption = (id: string, text: string) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const updateCorrectAnswer = (id: string, isCorrect: boolean) => {
    setOptions(
      options.map((opt) => ({
        ...opt,
        isCorrect: opt.id === id ? isCorrect : opt.isCorrect
      }))
    );
  };

  const handleCreatePoll = () => {
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

    const pollData = {
      question: question.trim(),
      options: validOptions,
      duration: parseInt(duration),
    };

    if (isConnected && userType === "teacher") {
      createPoll(pollData);
      toast.success("Poll sent to all students!");
      navigate("/teacher-live");
    } else {
      const fallbackData = {
        ...pollData,
        createdAt: new Date().toISOString(),
      };
      sessionStorage.setItem("currentPoll", JSON.stringify(fallbackData));
      toast.success("Poll created (development mode)!");
      navigate("/teacher-live");
    }
  };

  const resetForm = () => {
    setQuestion("");
    setDuration("60");
    setOptions([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false },
    ]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Room Info Banner */}
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex flex-col md:flex-row justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-primary">Your Classroom</h2>
              <p className="text-sm text-muted-foreground">
                Share this room ID with your students to join
              </p>
            </div>
            <div className="flex items-center mt-2 md:mt-0">
              <div className="bg-white px-4 py-2 rounded-md border border-primary/20 font-mono text-sm">
                {roomName}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2"
                onClick={copyToClipboard}
              >
                {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span className="ml-2">{isCopied ? 'Copied!' : 'Copy'}</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Poll Creation Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create a New Poll</CardTitle>
            <CardDescription>
              Enter your question and options below to create a new poll for your students.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Question Input */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="question">Question</Label>
                  <Textarea
                    id="question"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Enter your question here"
                    className="min-h-[100px]"
                  />
                </div>

                {/* Duration Selector */}
                <div className="flex items-center justify-between">
                  <Label className="text-base">Poll Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 seconds</SelectItem>
                      <SelectItem value="60">1 minute</SelectItem>
                      <SelectItem value="120">2 minutes</SelectItem>
                      <SelectItem value="180">3 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Options List */}
                <div className="space-y-3">
                  <Label>Options</Label>
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {index + 1}
                      </div>
                      <Input
                        value={option.text}
                        onChange={(e) => updateOption(option.id, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        className="flex-1"
                      />
                      {options.length > 2 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(option.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addOption}
                    className="w-full mt-2"
                    disabled={options.length >= 6}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Option
                  </Button>
                </div>
              </div>

              {/* Correct Answers */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Correct Answers</h3>
                <div className="space-y-4">
                  {options.map((option, index) => (
                    <div key={`correct-${option.id}`} className="space-y-2">
                      <div className="text-sm font-medium text-gray-600">
                        Option {index + 1}: {option.text || "(empty)"}
                      </div>
                      <RadioGroup
                        value={option.isCorrect ? "yes" : "no"}
                        onValueChange={(value) =>
                          updateCorrectAnswer(option.id, value === "yes")
                        }
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="yes" id={`${option.id}-yes`} />
                          <Label htmlFor={`${option.id}-yes`}>Correct</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="no" id={`${option.id}-no`} />
                          <Label htmlFor={`${option.id}-no`}>Incorrect</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    type="button"
                  >
                    Reset Form
                  </Button>
                  <Button
                    onClick={handleCreatePoll}
                    disabled={
                      !question.trim() ||
                      options.length < 2 ||
                      options.some((opt) => !opt.text.trim()) ||
                      !options.some((opt) => opt.isCorrect)
                    }
                  >
                    Create Poll
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
