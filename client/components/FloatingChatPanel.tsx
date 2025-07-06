import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, UserX, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { useSocket } from "@/contexts/SocketContext";

interface FloatingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isTeacher?: boolean;
}

export default function FloatingChatPanel({
  isOpen,
  onClose,
  isTeacher = false,
}: FloatingChatPanelProps) {
  const { 
    participants, 
    chatMessages, 
    sendMessage, 
    kickStudent, 
    userName, 
    userType 
  } = useSocket();
  
  const [activeTab, setActiveTab] = useState("chat");
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleKickStudent = (participantId: string, participantName: string) => {
    if (window.confirm(`Are you sure you want to remove ${participantName}?`)) {
      kickStudent(participantId);
      toast.success(`${participantName} has been removed`);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim() && sendMessage) {
      sendMessage(newMessage);
      setNewMessage("");
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-[150]"
        onClick={onClose}
        style={{ pointerEvents: "auto" }}
      />

      {/* Floating Panel - Exact dimensions from images */}
      <div
        className="fixed top-1/2 right-8 transform -translate-y-1/2 w-[450px] h-[520px] bg-white rounded-xl shadow-xl border border-gray-200 z-[200]"
        onClick={(e) => e.stopPropagation()}
        style={{ pointerEvents: "auto" }}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-100 z-10 pointer-events-auto"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Custom Tabs Implementation to match exact design */}
        <div className="h-full flex flex-col">
          {/* Tab Headers */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("chat")}
              className={`flex-1 py-4 px-6 text-left font-medium transition-colors relative ${
                activeTab === "chat"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Chat
              {activeTab === "chat" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab("participants")}
              className={`flex-1 py-4 px-6 text-left font-medium transition-colors relative ${
                activeTab === "participants"
                  ? "text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Participants
              {activeTab === "participants" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>

          {/* Participants Content */}
          {activeTab === "participants" && (
            <div className="flex-1 p-6">
              {/* Header Row */}
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
                <span className="text-sm font-medium text-gray-400">Name</span>
                {isTeacher && (
                  <span className="text-sm font-medium text-gray-400">
                    Action
                  </span>
                )}
              </div>

              {/* Participants List */}
              <div className="p-4 space-y-2 overflow-y-auto max-h-96">
                {participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-gray-100"
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          participant.userType === "teacher"
                            ? "bg-blue-500"
                            : participant.hasAnswered
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      />
                      <span className="flex items-center">
                        {participant.userName}
                        {participant.userType === "teacher" && " 👨‍🏫"}
                        {participant.userType === "student" && " 👨‍🎓"}
                      </span>
                    </div>
                    {isTeacher && participant.userType === "student" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleKickStudent(participant.id, participant.userName)
                        }
                        title={`Remove ${participant.userName}`}
                      >
                        <UserX className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                ))}
                <div className="text-xs text-gray-500 mt-4 text-center">
                  Total Participants: {participants.length}
                </div>
              </div>
            </div>
          )}

          {/* Chat Content */}
          {activeTab === "chat" && (
            <div className="flex-1 p-6 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.senderName === userName ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg p-3 ${
                        msg.senderName === userName
                          ? "bg-blue-500 text-white"
                          : msg.isTeacher
                          ? "bg-purple-500 text-white"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      <div className="font-medium">
                        {msg.senderName} {msg.isTeacher ? "👨‍🏫" : "👨‍🎓"}
                      </div>
                      <div>{msg.text}</div>
                      <div className="text-xs opacity-70 mt-1">
                        {formatTime(msg.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className="flex-1 rounded-lg border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="rounded-lg w-10 h-10"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
