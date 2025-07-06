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
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isTeacher: boolean;
}

class PollManager {
  private participants: Map<string, Participant> = new Map();
  private polls: Map<string, Poll> = new Map();
  private activePoll: Poll | null = null;
  private chatMessages: ChatMessage[] = [];
  private pollHistory: Poll[] = [];

  addParticipant(participant: Participant): void {
    this.participants.set(participant.id, participant);
  }

  removeParticipant(participantId: string): void {
    this.participants.delete(participantId);
  }

  getParticipants(): Participant[] {
    return Array.from(this.participants.values());
  }

  getStudents(): Participant[] {
    return this.getParticipants().filter((p) => p.userType === "student");
  }

  getTeachers(): Participant[] {
    return this.getParticipants().filter((p) => p.userType === "teacher");
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
    };

    // Initialize results for each option
    poll.options.forEach((option) => {
      poll.results[option.id] = 0;
    });

    this.polls.set(poll.id, poll);
    this.activePoll = poll;

    // Set end time
    poll.endTime = new Date(Date.now() + poll.duration * 1000);

    // Reset all students' answered status
    this.participants.forEach((participant) => {
      if (participant.userType === "student") {
        participant.hasAnswered = false;
        participant.answer = undefined;
      }
    });

    return poll;
  }

  submitAnswer(participantId: string, optionId: string): boolean {
    const participant = this.participants.get(participantId);
    if (
      !participant ||
      participant.userType !== "student" ||
      !this.activePoll
    ) {
      return false;
    }

    if (participant.hasAnswered) {
      return false; // Already answered
    }

    participant.hasAnswered = true;
    participant.answer = optionId;

    // Update results
    if (this.activePoll.results[optionId] !== undefined) {
      this.activePoll.results[optionId]++;
    }

    return true;
  }

  getActivePoll(): Poll | null {
    return this.activePoll;
  }

  endActivePoll(): void {
    if (this.activePoll) {
      this.activePoll.isActive = false;
      this.pollHistory.push({ ...this.activePoll });
      this.activePoll = null;
    }
  }

  canCreateNewPoll(): boolean {
    if (!this.activePoll) return true;

    const students = this.getStudents();
    if (students.length === 0) return true;

    return students.every((student) => student.hasAnswered);
  }

  addChatMessage(message: Omit<ChatMessage, "id" | "timestamp">): ChatMessage {
    const chatMessage: ChatMessage = {
      ...message,
      id: uuidv4(),
      timestamp: new Date(),
    };

    this.chatMessages.push(chatMessage);
    return chatMessage;
  }

  getChatMessages(): ChatMessage[] {
    return this.chatMessages;
  }

  getPollHistory(): Poll[] {
    return this.pollHistory;
  }

  getResults(): Record<string, number> {
    return this.activePoll?.results || {};
  }
}

export function initializeSocket(io: SocketIOServer) {
  // Initialize polling system
  const pollManager = new PollManager();

  io.on("connection", (socket) => {
    console.log("New client connected:", socket.id);

    // Log connection details
    console.log('Connection details:', {
      id: socket.id,
      handshake: socket.handshake,
      connected: socket.connected,
      disconnected: socket.disconnected,
    });

    // Handle user joining
    socket.on("joinRoom", (data: { userName: string; userType: "teacher" | "student" }) => {
      try {
        const { userName, userType } = data;
        console.log(`User joining: ${userName} (${userType})`);
        
        const user = { id: socket.id, userName, userType };
        
        // Add user to the room
        socket.join("pollRoom");
        
        // Add user to the participants list
        pollManager.addParticipant(user);
        
        // Send updated participants list to all clients
        io.to("pollRoom").emit("participantUpdate", pollManager.getParticipants());
        
        // Send current poll if any
        const currentPoll = pollManager.getActivePoll();
        if (currentPoll) {
          socket.emit("newPoll", currentPoll);
        }
        
        // Send chat history
        socket.emit("chatHistory", pollManager.getChatMessages());
        
        // Send welcome message
        socket.emit("systemMessage", {
          text: `Welcome to the live polling system, ${userName}!`,
          timestamp: new Date().toISOString(),
        });
        
      } catch (error) {
        console.error('Error in join handler:', error);
        socket.emit('error', { message: 'Failed to join the session' });
      }
    });

    // Handle poll creation
    socket.on("createPoll", (data: {
      question: string;
      options: Array<{ id: string; text: string; isCorrect: boolean }>;
      duration: number;
    }) => {
      try {
        console.log('Creating new poll:', data.question);
        const poll = pollManager.createPoll(data);
        io.to("pollRoom").emit("newPoll", poll);

        // Auto-end poll after duration
        setTimeout(() => {
          pollManager.endActivePoll();
          io.to("pollRoom").emit("pollEnded", {
            results: pollManager.getResults(),
            participants: pollManager.getParticipants(),
          });
        }, poll.duration * 1000);

        console.log(`New poll created: ${poll.question}`);
      },
    );

    // Student submits answer
    socket.on(
      "submitAnswer",
      (data: { participantId: string; optionId: string }) => {
        const success = pollManager.submitAnswer(
          data.participantId,
          data.optionId,
        );

        if (success) {
          // Send updated results to everyone
          io.to("pollRoom").emit("answerSubmitted", {
            results: pollManager.getResults(),
            participants: pollManager.getParticipants(),
          });

          // Check if all students have answered
          const students = pollManager.getStudents();
          const allAnswered =
            students.length > 0 && students.every((s) => s.hasAnswered);

          if (allAnswered) {
            pollManager.endActivePoll();
            io.to("pollRoom").emit("pollEnded", {
              results: pollManager.getResults(),
              participants: pollManager.getParticipants(),
            });
          }
        } else {
          socket.emit("error", { message: "Failed to submit answer" });
        }
      },
    );

    // Chat message
    socket.on(
      "sendMessage",
      (messageData: {
        text: string;
        senderId: string;
        senderName: string;
        isTeacher: boolean;
      }) => {
        const message = pollManager.addChatMessage(messageData);
        io.to("pollRoom").emit("chatMessage", message);
      },
    );

    // Teacher kicks student
    socket.on("kickStudent", (data: { studentId: string }) => {
      const participant = pollManager
        .getParticipants()
        .find((p) => p.id === data.studentId);
      if (participant && participant.userType === "student") {
        pollManager.removeParticipant(data.studentId);

        // Notify the kicked student
        const studentSocket = io.sockets.sockets.get(participant.socketId);
        if (studentSocket) {
          studentSocket.emit("kicked");
          studentSocket.disconnect();
        }

        // Update participant list for everyone else
        io.to("pollRoom").emit("participantUpdate", {
          participants: pollManager.getParticipants(),
        });
      }
    });

    // Get poll history
    socket.on("getPollHistory", () => {
      socket.emit("pollHistory", pollManager.getPollHistory());
    });

    // Disconnect
    socket.on("disconnect", () => {
      const participants = pollManager.getParticipants();
      const participant = participants.find((p) => p.socketId === socket.id);

      if (participant) {
        pollManager.removeParticipant(participant.id);
        socket.to("pollRoom").emit("participantUpdate", {
          participants: pollManager.getParticipants(),
        });
        console.log(
          `${participant.userType} ${participant.userName} disconnected`,
        );
      }
    });
  });

  return pollManager;
}
