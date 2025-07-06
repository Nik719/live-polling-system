export interface User {
  id: string;
  userName: string;
  userType: 'teacher' | 'student';
  hasAnswered?: boolean;
  answer?: string;
}

export interface PollOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  duration: number;
  createdAt: string;
  createdBy: string;
  endTime?: string;
  isActive: boolean;
  results: Record<string, number>;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isTeacher: boolean;
}

export interface PollResults {
  pollId: string;
  results: Record<string, number>;
  participants: User[];
  timestamp: string;
}

export interface AnswerSubmittedEvent {
  participantId: string;
  userName: string;
  pollId: string;
  optionId: string;
  timestamp: string;
}

export interface PollCreatedEvent extends Poll {}

export interface PollEndedEvent {
  pollId: string;
  results: Record<string, number>;
  participants: User[];
  timestamp: string;
}

export interface PollResultsUpdatedEvent {
  pollId: string;
  results: Record<string, number>;
  timestamp: string;
}

export interface ErrorEvent {
  message: string;
  code?: string;
}
