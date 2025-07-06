import React, { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

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
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  userId: string | null;
  userName: string | null;
  userType: "teacher" | "student" | null;
  participants: Participant[];
  activePoll: Poll | null;
  chatMessages: ChatMessage[];
  pollHistory: Poll[];
  results: Record<string, number>;
  joinRoom: (userName: string, userType: "teacher" | "student") => void;
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

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io(
      process.env.NODE_ENV === "production"
        ? window.location.origin
        : "http://localhost:8080",
      {
        transports: ["polling", "websocket"],
        upgrade: true,
        autoConnect: true,
        timeout: 20000,
      },
    );

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to server");
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from server");
    });

    socketInstance.on("connect_error", (error) => {
      setIsConnected(false);
      console.log("Connection error:", error.message);
      // In development, we'll work with mock data if socket fails
    });

    socketInstance.on(
      "userJoined",
      (data: {
        userId: string;
        participants: Participant[];
        activePoll: Poll | null;
        chatMessages: ChatMessage[];
      }) => {
        setUserId(data.userId);
        setParticipants(data.participants);
        setActivePoll(data.activePoll);
        setChatMessages(data.chatMessages);
        if (data.activePoll) {
          setResults(data.activePoll.results);
        }
      },
    );

    socketInstance.on(
      "participantUpdate",
      (data: { participants: Participant[] }) => {
        setParticipants(data.participants);
      },
    );

    socketInstance.on(
      "newPoll",
      (data: { poll: Poll; participants: Participant[] }) => {
        setActivePoll(data.poll);
        setParticipants(data.participants);
        setResults(data.poll.results);
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

    socketInstance.on("chatMessage", (message: ChatMessage) => {
      setChatMessages((prev) => [...prev, message]);
    });

    socketInstance.on("pollHistory", (history: Poll[]) => {
      setPollHistory(history);
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

  const joinRoom = (name: string, type: "teacher" | "student") => {
    if (socket) {
      setUserName(name);
      setUserType(type);
      socket.emit("joinRoom", { userName: name, userType: type });
    }
  };

  const createPoll = (pollData: {
    question: string;
    options: Array<{ id: string; text: string; isCorrect: boolean }>;
    duration: number;
  }) => {
    if (socket) {
      socket.emit("createPoll", pollData);
    }
  };

  const submitAnswer = (optionId: string) => {
    if (socket && userId) {
      socket.emit("submitAnswer", { participantId: userId, optionId });
    }
  };

  const sendMessage = (text: string) => {
    if (socket && userId && userName && userType) {
      socket.emit("sendMessage", {
        text,
        senderId: userId,
        senderName: userName,
        isTeacher: userType === "teacher",
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

  const value: SocketContextType = {
    socket,
    isConnected,
    userId,
    userName,
    userType,
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
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
