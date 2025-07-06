import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

interface Participant {
  id: string;
  userName: string;
  userType: "teacher" | "student";
  hasAnswered?: boolean;
}

interface Poll {
  id: string;
  question: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  duration: number;
  createdAt: string;
  endTime?: string;
  isActive: boolean;
  results: Record<string, number>;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isTeacher: boolean;
  roomId: string;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | null;
  userName: string | null;
  userType: "teacher" | "student" | null;
  roomId: string | null;
  participants: Participant[];
  activePoll: Poll | null;
  chatMessages: ChatMessage[];
  pollHistory: Poll[];
  results: Record<string, number>;
  joinRoom: (userName: string, userType: "teacher" | "student", roomId: string) => void;
  createPoll: (pollData: {
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    duration: number;
  }) => void;
  submitAnswer: (optionId: string) => void;
  sendMessage: (text: string) => void;
  kickStudent: (studentId: string) => void;
  getPollHistory: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

interface SocketProviderProps {
  children: React.ReactNode;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [userType, setUserType] = useState<"teacher" | "student" | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [pollHistory, setPollHistory] = useState<Poll[]>([]);
  const [results, setResults] = useState<Record<string, number>>({});
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection with relative URL
    const socketInstance = io({
      path: "/socket.io/",
      // Use relative URL for both development and production
      hostname: window.location.hostname,
      // Auto-detect secure connection
      secure: window.location.protocol === 'https:',
      // Auto-detect port
      port: window.location.port ? parseInt(window.location.port) : 
           (window.location.protocol === 'https:' ? 443 : 80),
      // Enable both transports with websocket as primary
      transports: ["websocket", "polling"],
      // Enable auto-upgrade
      upgrade: true,
      // Auto-connect
      autoConnect: true,
      // Timeout settings
      timeout: 30000,
      // Reconnection settings
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      // Important: Enable websocket transport first
      withCredentials: true,
      // Add debug logging in development
      ...(process.env.NODE_ENV === 'development' && { debug: true })
    });

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log("Connected to server with ID:", socketInstance.id);
      setIsConnected(true);
      setUserId(socketInstance.id);
      
      // Try to reconnect with stored session data if available
      const storedUserName = sessionStorage.getItem('userName');
      const storedUserType = sessionStorage.getItem('userType') as "teacher" | "student" | null;
      const storedRoomId = sessionStorage.getItem('roomId');
      
      console.log('Stored session data:', { storedUserName, storedUserType, storedRoomId });
      
      if (storedUserName && storedUserType && storedRoomId) {
        console.log('Attempting to rejoin room with stored data...');
        joinRoom(storedUserName, storedUserType, storedRoomId);
      } else {
        console.log('No stored session data found for auto-rejoin');
      }
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    socketInstance.on("connect_error", (error) => {
      setIsConnected(false);
      console.log("Connection error:", error.message);
      // Show error toast to user
      toast.error("Connection error. Attempting to reconnect...");
    });

    socketInstance.on("reconnect_attempt", (attemptNumber) => {
      console.log(`Reconnection attempt: ${attemptNumber}`);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log(`Reconnected after ${attemptNumber} attempts`);
      toast.success("Reconnected to the server");
    });

    socketInstance.on("reconnect_failed", () => {
      console.log("Failed to reconnect");
      toast.error("Failed to reconnect to the server. Please refresh the page.");
    });

    socketInstance.on(
      "userJoined",
      (data: {
        userId: string;
        participants: Participant[];
        activePoll: any | null;
        chatMessages: ChatMessage[];
        roomId: string;
      }) => {
        setUserId(data.userId);
        setParticipants(data.participants);
        
        // Process activePoll if it exists
        if (data.activePoll) {
          const processedPoll = {
            ...data.activePoll,
            createdAt: typeof data.activePoll.createdAt === 'string' 
              ? data.activePoll.createdAt 
              : new Date(data.activePoll.createdAt).toISOString(),
            endTime: data.activePoll.endTime 
              ? (typeof data.activePoll.endTime === 'string' 
                  ? data.activePoll.endTime 
                  : new Date(data.activePoll.endTime).toISOString())
              : undefined,
          };
          setActivePoll(processedPoll);
          setResults(data.activePoll.results);
        } else {
          setActivePoll(null);
          setResults({});
        }
        
        // Process chat messages timestamps if needed
        const processedMessages = data.chatMessages.map(msg => ({
          ...msg,
          timestamp: typeof msg.timestamp === 'string' ? msg.timestamp : new Date(msg.timestamp).toISOString()
        }));
        setChatMessages(processedMessages);
        setRoomId(data.roomId);
      },
    );

    socketInstance.on(
      "participantUpdate",
      (data: { 
        participants: Participant[];
        roomId: string;
        message?: string;
      }) => {
        // Only update if the participants are from the current room
        if (data.roomId === roomId) {
          setParticipants(data.participants);
          if (data.message) {
            toast.info(data.message);
          }
        }
      },
    );

    socketInstance.on("chatMessage", (message: ChatMessage) => {
      // Only add message if it's for the current room
      if (message.roomId === roomId) {
        setChatMessages((prev) => {
          // Check if message already exists to prevent duplicates
          if (!prev.some(m => m.id === message.id)) {
            return [...prev, message];
          }
          return prev;
        });
        
        // Show notification for new messages not from current user
        if (message.senderId !== userId) {
          const isTeacherMessage = message.isTeacher;
          toast.message(message.text, {
            description: `From: ${message.senderName}${isTeacherMessage ? ' (Teacher)' : ''}`,
            duration: 3000,
            position: 'bottom-right',
            className: 'bg-gray-800 text-white',
          });
        }
      }
    });

    socketInstance.on("teacherLeft", () => {
      toast.error("The teacher has ended the session");
      // Redirect to home after a delay
      setTimeout(() => {
        window.location.href = "/";
      }, 3000);
    });

    socketInstance.on(
      "newPoll",
      (data: { 
        poll: Poll; 
        participants: Participant[];
        roomId: string;
      }) => {
        // Only update if the poll is for the current room
        if (data.roomId === roomId) {
          setActivePoll(data.poll);
          setParticipants(data.participants);
          setResults({});
          toast.success("New poll started!");
        }
      },
    );

    socketInstance.on(
      "answerSubmitted",
      (data: {
        results: Record<string, number>;
        participants: Participant[];
      }) => {
        setResults(data.results);
        setParticipants(data.participants);
      },
    );

    socketInstance.on(
      "pollEnded",
      (data: {
        results: Record<string, number>;
        participants: Participant[];
      }) => {
        setResults(data.results);
        setParticipants(data.participants);
        setActivePoll((prev) => (prev ? { ...prev, isActive: false } : null));
      },
    );

    socketInstance.on("pollHistory", (history: any[]) => {
      // Process each poll in history to ensure proper date formats
      const processedHistory = history.map(poll => ({
        ...poll,
        createdAt: typeof poll.createdAt === 'string' ? poll.createdAt : new Date(poll.createdAt).toISOString(),
        endTime: poll.endTime ? (typeof poll.endTime === 'string' ? poll.endTime : new Date(poll.endTime).toISOString()) : undefined,
      }));
      setPollHistory(processedHistory);
    });

    socketInstance.on("kicked", () => {
      window.location.href = "/student-kicked";
    });

    socketInstance.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const joinRoom = (userName: string, userType: "teacher" | "student", roomId: string) => {
    if (!socket) return;

    const userData = {
      userName,
      userType,
      roomId: roomId.toLowerCase().trim(),
    };

    socket.emit("joinRoom", userData);
    setUserName(userName);
    setUserType(userType);
    setRoomId(userData.roomId);
    
    // Store user data in session storage for reconnection
    sessionStorage.setItem('userName', userName);
    sessionStorage.setItem('userType', userType);
    sessionStorage.setItem('roomId', userData.roomId);
  };

  const createPoll = (pollData: {
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    duration: number;
  }) => {
    if (socket && roomId) {
      socket.emit("createPoll", { ...pollData, roomId });
    }
  };

  const submitAnswer = (optionId: string) => {
    if (socket && userId) {
      socket.emit("submitAnswer", { participantId: userId, optionId });
    }
  };

  const sendMessage = (text: string) => {
    if (socket && userId && userName && userType && roomId) {
      socket.emit("sendMessage", {
        text,
        senderId: userId,
        senderName: userName,
        isTeacher: userType === "teacher",
        roomId,
      });
    }
  };

  const kickStudent = (studentId: string) => {
    if (socket) {
      socket.emit("kickStudent", { studentId });
    }
  };

  const getPollHistory = () => {
    if (socket) {
      socket.emit("getPollHistory");
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        userId,
        userName,
        userType,
        roomId,
        participants,
        activePoll,
        chatMessages,
        pollHistory,
        results,
        joinRoom,
        createPoll,
        submitAnswer,
        sendMessage,
        kickStudent,
        getPollHistory,
        disconnect,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export default SocketProvider;
