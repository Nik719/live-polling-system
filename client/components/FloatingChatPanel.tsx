import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, UserX } from "lucide-react";
import { useSocket } from "@/contexts/SocketContext";
import { toast } from "sonner";

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
  const [activeTab, setActiveTab] = useState("participants");
  const [newMessage, setNewMessage] = useState("");
  const { participants, chatMessages, sendMessage, kickStudent, userName } =
    useSocket();

  const handleKickStudent = (
    participantId: string,
    participantName: string,
  ) => {
    if (window.confirm(`Are you sure you want to remove ${participantName}?`)) {
      kickStudent(participantId);
      toast.success(`${participantName} has been removed from the session`);
    }
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage("");
    }
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
              <div className="space-y-5 max-h-[350px] overflow-y-auto">
                {participants.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No participants in the room yet
                  </div>
                ) : (
                  participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="flex justify-between items-center"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium text-gray-900">
                          {participant.userName}
                          {participant.userType === "teacher" && " (Teacher)"}
                        </span>
                        {participant.userType === "student" && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              participant.hasAnswered
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {participant.hasAnswered
                              ? "Answered"
                              : "Waiting..."}
                          </span>
                        )}
                      </div>
                      {isTeacher && participant.userType === "student" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700 p-1 h-8 w-8"
                          onClick={() =>
                            handleKickStudent(
                              participant.id,
                              participant.userName,
                            )
                          }
                          title={`Remove ${participant.userName}`}
                        >
                          <UserX className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Content */}
          {activeTab === "chat" && (
            <div className="flex-1 p-6 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 space-y-4 overflow-y-auto mb-6 max-h-[350px]">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isOwnMessage = msg.senderName === userName;
                    return (
                      <div key={msg.id} className="space-y-2">
                        {/* User Name */}
                        <div
                          className={`text-sm font-medium ${
                            isOwnMessage
                              ? "text-primary text-right"
                              : "text-primary"
                          }`}
                        >
                          {msg.senderName}
                        </div>

                        {/* Message Bubble */}
                        <div
                          className={`flex ${
                            isOwnMessage ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[280px] px-4 py-3 rounded-2xl text-sm text-white ${
                              isOwnMessage
                                ? "bg-primary rounded-br-md"
                                : "bg-gray-800 rounded-bl-md"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
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
