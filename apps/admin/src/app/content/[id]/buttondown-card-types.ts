export interface ButtondownState {
  emailId?: string;
  status?: string;
  subject?: string;
  body?: string;
}

export type ButtondownFeedback = {
  type: "success" | "error";
  message: string;
} | null;
