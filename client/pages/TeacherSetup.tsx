import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSocket } from "@/contexts/SocketContext";

export default function TeacherSetup() {
  const navigate = useNavigate();
  const { joinRoom } = useSocket();
  const [teacherName, setTeacherName] = useState(
    sessionStorage.getItem("teacherName") || ""
  );
  const [roomName, setRoomName] = useState("");
  const [isJoining, setIsJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherName.trim() || !roomName.trim()) return;
    
    setIsJoining(true);
    sessionStorage.setItem("teacherName", teacherName);
    
    try {
      await joinRoom(teacherName, "teacher", roomName.trim().toLowerCase());
      navigate("/create-poll", { state: { roomName: roomName.trim().toLowerCase() } });
    } catch (error) {
      console.error("Failed to create room:", error);
      alert("Failed to create room. Please try again.");
      setIsJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8">
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Create Your Classroom</h2>
              <p className="text-gray-600">
                Set up your virtual classroom to start engaging with students
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="teacherName">Your Name</Label>
                <Input
                  id="teacherName"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="roomName">Classroom Name</Label>
                <Input
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="Enter a name for your classroom"
                  required
                />
                <p className="text-sm text-gray-500">
                  Students will use this name to join your classroom
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={isJoining}
              >
                {isJoining ? "Creating Classroom..." : "Create Classroom"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
