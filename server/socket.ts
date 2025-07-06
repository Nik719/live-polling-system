import { Server as SocketIOServer } from "socket.io";
import { v4 as uuidv4 } from "uuid";

interface Participant {
  id: string;
  userName: string;
  userType: "teacher" | "student";
  socketId: string;
  hasAnswered?: boolean;
  answer?: string;
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
  createdAt: Date;
  endTime?: Date;
  isActive: boolean;
  results: Record<string, number>;
  roomId: string;
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isTeacher: boolean;
  roomId: string;
}

class PollManager {
  // Track participants by their ID
  private participants: Map<string, Participant> = new Map();
  // Track active polls by room ID
  private activePolls: Map<string, Poll> = new Map();
  // Track all polls by their ID
  private polls: Map<string, Poll> = new Map();
  // Track chat messages by room ID
  private roomChats: Map<string, ChatMessage[]> = new Map();
  // Track poll history by room ID
  private roomHistories: Map<string, Poll[]> = new Map();

  addParticipant(participant: Participant): void {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
  }

  getParticipants(roomId?: string): Participant[] {
    const allParticipants = Array.from(this.participants.values());
    if (!roomId) return allParticipants;
    
    return allParticipants.filter(participant => {
      const socketId = participant.socketId;
      const userRoom = userToRoom.get(socketId);
      return userRoom === roomId;
    });
  }

  getStudents(roomId?: string): Participant[] {
    return this.getParticipants(roomId).filter((p) => p.userType === "student");
  }

  getTeachers(roomId?: string): Participant[] {
    return this.getParticipants(roomId).filter((p) => p.userType === "teacher");
  }

  createPoll(
    pollData: Omit<Poll, "id" | "createdAt" | "isActive" | "results">,
  ): Poll {
    const poll: Poll = {
      ...pollData,
      id: uuidv4(),
      createdAt: new Date(),
      isActive: true,
      results: {},
      roomId: pollData.roomId || 'default-room',
    };

    // Initialize results for each option
    poll.options.forEach((option) => {
      poll.results[option.id] = 0;
    });

    this.polls.set(poll.id, poll);
    this.activePolls.set(poll.roomId, poll);

    // Set end time
    poll.endTime = new Date(Date.now() + poll.duration * 1000);

    // Reset all students' answered status in the room
    this.getParticipants(poll.roomId).forEach((participant) => {
      if (participant.userType === "student") {
        participant.hasAnswered = false;
        participant.answer = undefined;
      }
    });

    // Initialize room history if it doesn't exist
    if (!this.roomHistories.has(poll.roomId)) {
      this.roomHistories.set(poll.roomId, []);
    }

    return poll;
  }

  submitAnswer(participantId: string, optionId: string, roomId: string): boolean {
    const participant = this.participants.get(participantId);
    if (!participant || participant.userType !== "student") {
      return false;
    }

    const activePoll = this.activePolls.get(roomId);
    if (!activePoll) {
      return false;
    }

    if (participant.hasAnswered) {
      return false; // Already answered
    }

    participant.hasAnswered = true;
    participant.answer = optionId;

    // Update results
    if (activePoll.results[optionId] !== undefined) {
      activePoll.results[optionId]++;
    }

    return true;
  }

  getActivePoll(roomId: string): Poll | null {
    return this.activePolls.get(roomId) || null;
  }

  endActivePoll(roomId: string): void {
    const activePoll = this.activePolls.get(roomId);
    if (activePoll) {
      activePoll.isActive = false;
      
      // Add to room's history
      const roomHistory = this.roomHistories.get(roomId) || [];
      roomHistory.push({ ...activePoll });
      this.roomHistories.set(roomId, roomHistory);
      
      // Remove from active polls
      this.activePolls.delete(roomId);
    }
  }

  canCreateNewPoll(roomId: string): boolean {
    const activePoll = this.activePolls.get(roomId);
    if (!activePoll) return true;

    const students = this.getStudents(roomId);
    if (students.length === 0) return true;

    return students.every((student) => student.hasAnswered);
  }

  addChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
    const roomId = message.roomId || 'default-room';
    const chatMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
      roomId,
    };

    // Initialize room chat if it doesn't exist
    if (!this.roomChats.has(roomId)) {
      this.roomChats.set(roomId, []);
    }

    const roomMessages = this.roomChats.get(roomId) || [];
    
    // Keep only the last 100 messages to prevent memory issues
    roomMessages.push(chatMessage);
    if (roomMessages.length > 100) {
      this.roomChats.set(roomId, roomMessages.slice(-100));
    }
    
    return chatMessage;
  }

  getChatMessages(roomId: string): ChatMessage[] {
    return this.roomChats.get(roomId) || [];
  }

  getPollHistory(roomId: string): Poll[] {
    return this.roomHistories.get(roomId) || [];
  }

  getResults(roomId: string): Record<string, number> {
    const activePoll = this.activePolls.get(roomId);
    return activePoll?.results || {};
  }
}

// Track active rooms and their participants
const activeRooms = new Map<string, Set<string>>();
const userToRoom = new Map<string, string>();

export function initializeSocket(io: SocketIOServer) {
  const pollManager = new PollManager();

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User joins the system
    socket.on(
      "joinRoom",
      (userData: { userName: string; userType: "teacher" | "student", roomId: string }) => {
        const roomId = userData.roomId || 'default-room';
        
        // Leave any existing room
        if (userToRoom.has(socket.id)) {
          const oldRoom = userToRoom.get(socket.id);
          if (oldRoom) {
            socket.leave(oldRoom);
            const roomUsers = activeRooms.get(oldRoom);
            if (roomUsers) {
              roomUsers.delete(socket.id);
              if (roomUsers.size === 0) {
                activeRooms.delete(oldRoom);
              }
            }
          }
        }
        
        // Join new room
        socket.join(roomId);
        userToRoom.set(socket.id, roomId);
        
        // Update room users
        if (!activeRooms.has(roomId)) {
          activeRooms.set(roomId, new Set());
        }
        activeRooms.get(roomId)?.add(socket.id);
        const participant: Participant = {
          id: uuidv4(),
          userName: userData.userName,
          userType: userData.userType,
          socketId: socket.id,
          hasAnswered: false,
        };

        // Add participant to the poll manager
        pollManager.addParticipant(participant);
        
        // Get room participants count
        const roomParticipants = Array.from(activeRooms.get(roomId) || []);
        const previousParticipantsCount = roomParticipants.length - 1;
        
        // Send welcome message
        const welcomeMessage = pollManager.addChatMessage({
          senderId: 'system',
          senderName: 'System',
          text: `${userData.userName} has joined the session`,
          isTeacher: false,
          roomId: roomId
        });

        // Send current state to the new user
        socket.emit("userJoined", {
          userId: participant.id,
          participants: pollManager.getParticipants(),
          activePoll: pollManager.getActivePoll(),
          chatMessages: pollManager.getChatMessages().filter(m => m.roomId === roomId),
          isTeacher: userData.userType === "teacher",
          totalParticipants: previousParticipantsCount + 1,
          roomId: roomId
        });

        // Notify others in the same room about the new participant
        socket.to(roomId).emit("participantUpdate", {
          participants: pollManager.getParticipants(),
          activePoll: pollManager.getActivePoll(),
          message: `${userData.userName} has joined`
        });
        
        // Broadcast welcome message to all in the room
        io.to(roomId).emit("chatMessage", {
          ...welcomeMessage,
          timestamp: welcomeMessage.timestamp.toISOString(),
          roomId: roomId
        });
      },
    );

    // Teacher creates a new poll
    socket.on(
      "createPoll",
      (pollData: {
        question: string;
        options: Array<{ id: string; text: string; isCorrect: boolean }>;
        duration: number;
        roomId: string;
      }) => {
        // Get the room ID for this socket
        const roomId = userToRoom.get(socket.id) || pollData.roomId || 'default-room';
        
        // Verify the user is a teacher in this room
        const participant = Array.from(pollManager["participants"].values())
          .find(p => p.socketId === socket.id && p.userType === 'teacher');
          
        if (!participant) {
          socket.emit("error", {
            message: "Only teachers can create polls",
          });
          return;
        }

        if (!pollManager.canCreateNewPoll(roomId)) {
          socket.emit("error", {
            message: "Cannot create poll while students are still answering",
          });
          return;
        }

        const poll = pollManager.createPoll({
          ...pollData,
          roomId: roomId
        });

        // Notify all users in the room about the new poll
        io.to(roomId).emit("newPoll", {
          poll: {
            ...poll,
            createdAt: poll.createdAt.toISOString(),
            endTime: poll.endTime?.toISOString()
          },
          participants: pollManager.getParticipants(roomId),
          roomId: roomId
        });

        // Auto-end poll after duration
        const timeout = setTimeout(() => {
          pollManager.endActivePoll(roomId);
          io.to(roomId).emit("pollEnded", {
            results: pollManager.getResults(roomId),
            participants: pollManager.getParticipants(roomId),
            roomId: roomId
          });
        }, poll.duration * 1000);

        // Store timeout reference to clear if needed
        socket.data.timeout = timeout;
        socket.data.roomId = roomId;

        console.log(`New poll created in room ${roomId}: ${poll.question}`);
      },
    );

    // Student submits answer
    socket.on(
      "submitAnswer",
      (data: { participantId: string; optionId: string; roomId?: string }) => {
        const roomId = userToRoom.get(socket.id) || data.roomId || 'default-room';
        
        const success = pollManager.submitAnswer(
          data.participantId,
          data.optionId,
          roomId
        );

        if (success) {
          // Send updated results to everyone in the room
          io.to(roomId).emit("answerSubmitted", {
            results: pollManager.getResults(roomId),
            participants: pollManager.getParticipants(roomId),
            roomId: roomId
          });

          // Check if all students have answered
          const students = pollManager.getStudents(roomId);
          const allAnswered = students.length > 0 && students.every((s) => s.hasAnswered);

          if (allAnswered) {
            pollManager.endActivePoll(roomId);
            io.to(roomId).emit("pollEnded", {
              results: pollManager.getResults(roomId),
              participants: students,
              roomId: roomId
            });
          }
        } else {
          socket.emit("error", { message: "Failed to submit answer" });
        }
      },
    );

    // Handle chat messages
    socket.on("sendMessage", (message: { 
      text: string; 
      senderId: string; 
      senderName: string; 
      isTeacher: boolean;
      roomId?: string;
    }) => {
      const roomId = userToRoom.get(socket.id) || message.roomId || 'default-room';
      const participant = Array.from(pollManager["participants"].values())
        .find((p) => p.id === message.senderId);

      if (participant) {
        const chatMessage = pollManager.addChatMessage({
          senderId: message.senderId,
          senderName: participant.userName,
          text: message.text,
          isTeacher: participant.userType === "teacher",
          roomId: roomId
        });

        // Broadcast to all participants in the room
        io.to(roomId).emit("chatMessage", {
          ...chatMessage,
          timestamp: chatMessage.timestamp.toISOString(),
          roomId: roomId
        });
      }
    });

    // Teacher kicks student
    socket.on("kickStudent", (data: { studentId: string }) => {
      const participant = pollManager
        .getParticipants()
        .find((p) => p.id === data.studentId);
        
      if (participant && participant.userType === "student") {
        const roomId = userToRoom.get(participant.socketId);
        if (!roomId) return;
        
        pollManager.removeParticipant(data.studentId);

        // Notify the kicked student
        const studentSocket = io.sockets.sockets.get(participant.socketId);
        if (studentSocket) {
          studentSocket.emit("kicked");
          studentSocket.disconnect();
          
          // Clean up room tracking
          const roomUsers = activeRooms.get(roomId);
          if (roomUsers) {
            roomUsers.delete(participant.socketId);
            if (roomUsers.size === 0) {
              activeRooms.delete(roomId);
            }
          }
          userToRoom.delete(participant.socketId);
        }

        // Update participant list for everyone else in the room
        io.to(roomId).emit("participantUpdate", {
          participants: pollManager.getParticipants().filter(p => {
            const userRoom = userToRoom.get(p.socketId);
            return userRoom === roomId;
          }),
          message: `${participant.userName} has been removed`
        });
      }
    });

    // Get poll history for the current room
    socket.on("getPollHistory", (data?: { roomId?: string }) => {
      const roomId = data?.roomId || userToRoom.get(socket.id) || 'default-room';
      const roomHistory = pollManager.getPollHistory(roomId);
      socket.emit("pollHistory", {
        history: roomHistory,
        roomId: roomId
      });
    });

    // Clean up on disconnect
    socket.on("disconnect", () => {
      const participant = Array.from(pollManager["participants"].values())
        .find((p) => p.socketId === socket.id);

      if (participant) {
        const roomId = userToRoom.get(socket.id) || socket.data.roomId;
        
        // Remove from room tracking
        if (roomId) {
          const roomUsers = activeRooms.get(roomId);
          if (roomUsers) {
            roomUsers.delete(socket.id);
            if (roomUsers.size === 0) {
              activeRooms.delete(roomId);
            }
          }
          userToRoom.delete(socket.id);
          
          // Remove from poll manager
          pollManager.removeParticipant(participant.id);
          
          // Notify others in the room
          if (participant.userType === 'teacher') {
            io.to(roomId).emit("teacherLeft", { roomId });
          } else {
            const remainingParticipants = pollManager.getParticipants(roomId).filter(p => 
              p.id !== participant.id
            );
            
            io.to(roomId).emit("participantUpdate", {
              participants: remainingParticipants,
              message: `${participant.userName} has left`,
              roomId: roomId
            });
          }
          
          console.log(`${participant.userType} ${participant.userName} disconnected from room ${roomId}`);
        } else {
          // Fallback if no room ID found
          pollManager.removeParticipant(participant.id);
          console.log(`${participant.userType} ${participant.userName} disconnected (no room)`);
        }
      }
      
      // Clear any pending timeouts
      if (socket.data.timeout) {
        clearTimeout(socket.data.timeout);
      }
    });
  });

  return pollManager;
}
