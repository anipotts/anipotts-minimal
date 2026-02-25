export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  captchaToken?: string;
}

interface ValidationFailure {
  error: "Invalid input";
  fields: Record<string, string>;
}

type ValidationResult =
  | { success: true; data: ContactPayload }
  | { success: false; error: ValidationFailure };

function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function parseContactPayload(input: unknown): ValidationResult {
  if (!input || typeof input !== "object") {
    return {
      success: false,
      error: {
        error: "Invalid input",
        fields: { root: "Expected a JSON object body." },
      },
    };
  }

  const payload = input as Record<string, unknown>;
  const fields: Record<string, string> = {};

  const name = getOptionalString(payload.name);
  const email = getOptionalString(payload.email);
  const message = getOptionalString(payload.message);
  const captchaToken = getOptionalString(payload.captchaToken);

  if (!name) {
    fields.name = "Name is required.";
  } else if (name.length > 100) {
    fields.name = "Name must be 100 characters or less.";
  }

  if (!email) {
    fields.email = "Email is required.";
  } else if (email.length > 320 || !isValidEmail(email)) {
    fields.email = "Enter a valid email address.";
  }

  if (!message) {
    fields.message = "Message is required.";
  } else if (message.length > 1000) {
    fields.message = "Message must be 1000 characters or less.";
  }

  if (Object.keys(fields).length > 0) {
    return {
      success: false,
      error: {
        error: "Invalid input",
        fields,
      },
    };
  }

  if (!name || !email || !message) {
    return {
      success: false,
      error: {
        error: "Invalid input",
        fields: { root: "Invalid payload shape." },
      },
    };
  }

  return {
    success: true,
    data: {
      name,
      email,
      message,
      captchaToken,
    },
  };
}
