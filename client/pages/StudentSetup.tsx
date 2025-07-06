import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function StudentSetup() {
  const navigate = useNavigate();
  const [name, setName] = useState(
    sessionStorage.getItem("studentName") || "Nik",
  );

  const handleContinue = () => {
    if (name.trim()) {
      // Store name in sessionStorage for persistence on refresh
      sessionStorage.setItem("studentName", name);
      navigate("/student-waiting");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md mx-auto text-center space-y-8">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Interactive Poll
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Let's Get Started
          </h1>
          <p className="text-lg text-gray-600">
            If you're a student, you'll be able to{" "}
            <span className="font-semibold">submit your answers</span>,
            participate in live polls, and see how your responses compare with
            your classmates
          </p>

          <div className="space-y-4">
            <label className="block text-left text-lg font-semibold text-gray-900">
              Enter your Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-14 text-lg bg-gray-100 border-0 focus-visible:ring-2 focus-visible:ring-primary"
              placeholder="Your name"
            />
          </div>

          <Button
            onClick={handleContinue}
            disabled={!name.trim()}
            className="px-12 py-3 text-lg font-medium rounded-full disabled:opacity-50"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
