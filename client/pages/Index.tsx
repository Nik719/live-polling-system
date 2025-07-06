import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Index() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<
    "student" | "teacher" | null
  >(null);

  const handleContinue = () => {
    if (selectedRole === "teacher") {
      navigate("/teacher-setup");
    } else if (selectedRole === "student") {
      navigate("/student-setup");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto text-center space-y-8">
        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          Interactive Poll
        </div>

        {/* Main Heading */}
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
            Welcome to the{" "}
            <span className="text-primary">Live Polling System</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-lg mx-auto">
            Please select the role that best describes you to begin using the
            live polling system
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Student Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedRole === "student"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedRole("student")}
          >
            <CardContent className="p-8 text-left">
              <div className="space-y-4">
                <div className="text-xl font-medium text-gray-900">
                  I'm a Student
                </div>
                <p className="text-gray-600">
                  Lorem Ipsum is simply dummy text of the printing and
                  typesetting industry
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Teacher Card */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${
              selectedRole === "teacher"
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedRole("teacher")}
          >
            <CardContent className="p-8 text-left">
              <div className="space-y-4">
                <div className="text-xl font-medium text-gray-900">
                  I'm a Teacher
                </div>
                <p className="text-gray-600">
                  Submit answers and view live poll results in real-time.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Continue Button */}
        <div className="pt-4">
          <Button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="px-12 py-3 text-lg font-medium rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
