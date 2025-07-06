import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  isTeacher?: boolean;
}

interface ChatDialogProps {
  children: React.ReactNode;
  isTeacher?: boolean;
}

export default function ChatDialog({
  children,
  isTeacher = false,
}: ChatDialogProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      user: "User 1",
      message: "Hey There, how can I help?",
      timestamp: new Date(),
      isTeacher: false,
    },
    {
      id: "2",
      user: isTeacher ? "Teacher" : "User 2",
      message: "Nothing bro, just chilling",
      timestamp: new Date(),
      isTeacher: true,
    },
  ]);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: Date.now().toString(),
        user: isTeacher ? "Teacher" : "Student",
        message: newMessage,
        timestamp: new Date(),
        isTeacher,
      };
      setMessages([...messages, message]);
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chat</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col h-96">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4 border rounded-md">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="text-xs text-gray-500 flex justify-between">
                    <span>{msg.user}</span>
                    <span>{msg.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <div
                    className={`p-2 rounded text-sm max-w-[80%] ${
                      msg.isTeacher
                        ? "bg-primary text-white ml-auto"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="flex gap-2 mt-4">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button onClick={handleSendMessage} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
