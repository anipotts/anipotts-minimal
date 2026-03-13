import { describe, expect, it } from "vitest";
import {
  contactSchema,
  adminLoginSchema,
  formatZodError,
  parseContactPayload,
} from "./index";
import { z } from "zod";

describe("contactSchema", () => {
  it("accepts valid contact input", () => {
    const result = contactSchema.safeParse({
      name: "Ani",
      email: "ani@example.com",
      message: "Hello there",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with optional captchaToken", () => {
    const result = contactSchema.safeParse({
      name: "Ani",
      email: "ani@example.com",
      message: "Hello",
      captchaToken: "tok_abc123",
    });
    expect(result.success).toBe(true);
  });

  it("trims name and message whitespace", () => {
    const result = contactSchema.parse({
      name: "  Ani  ",
      email: "ani@example.com",
      message: "  Hello  ",
    });
    expect(result.name).toBe("Ani");
    expect(result.message).toBe("Hello");
  });

  it("rejects empty name", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "ani@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects whitespace-only name (trimmed to empty)", () => {
    const result = contactSchema.safeParse({
      name: "   ",
      email: "ani@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects name over 100 characters", () => {
    const result = contactSchema.safeParse({
      name: "A".repeat(101),
      email: "ani@example.com",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email", () => {
    const result = contactSchema.safeParse({
      name: "Ani",
      email: "not-an-email",
      message: "Hello",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty message", () => {
    const result = contactSchema.safeParse({
      name: "Ani",
      email: "ani@example.com",
      message: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects message over 1000 characters", () => {
    const result = contactSchema.safeParse({
      name: "Ani",
      email: "ani@example.com",
      message: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing fields", () => {
    const result = contactSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("adminLoginSchema", () => {
  it("accepts valid password with 6-digit TOTP", () => {
    const result = adminLoginSchema.safeParse({
      password: "secret123",
      totp: "123456",
    });
    expect(result.success).toBe(true);
  });

  it("accepts valid password with empty TOTP", () => {
    const result = adminLoginSchema.safeParse({
      password: "secret123",
      totp: "",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty password", () => {
    const result = adminLoginSchema.safeParse({
      password: "",
      totp: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password over 200 characters", () => {
    const result = adminLoginSchema.safeParse({
      password: "x".repeat(201),
      totp: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects TOTP with letters", () => {
    const result = adminLoginSchema.safeParse({
      password: "secret",
      totp: "abc123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects TOTP with wrong digit count", () => {
    const result = adminLoginSchema.safeParse({
      password: "secret",
      totp: "12345",
    });
    expect(result.success).toBe(false);

    const result2 = adminLoginSchema.safeParse({
      password: "secret",
      totp: "1234567",
    });
    expect(result2.success).toBe(false);
  });
});

describe("parseContactPayload", () => {
  it("returns success with valid data", () => {
    const result = parseContactPayload({
      name: "Ani",
      email: "ani@example.com",
      message: "Hello there",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ani");
      expect(result.data.email).toBe("ani@example.com");
      expect(result.data.message).toBe("Hello there");
    }
  });

  it("returns success with captchaToken", () => {
    const result = parseContactPayload({
      name: "Ani",
      email: "ani@example.com",
      message: "Hello",
      captchaToken: "tok_abc",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.captchaToken).toBe("tok_abc");
    }
  });

  it("trims whitespace from name and message", () => {
    const result = parseContactPayload({
      name: "  Ani  ",
      email: "ani@example.com",
      message: "  Hello  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ani");
      expect(result.data.message).toBe("Hello");
    }
  });

  it("returns failure with field errors for invalid data", () => {
    const result = parseContactPayload({
      name: "",
      email: "bad",
      message: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.error).toBe("Invalid input");
      expect(result.error.fields).toBeDefined();
      expect(Object.keys(result.error.fields).length).toBeGreaterThan(0);
    }
  });

  it("returns failure for non-object input", () => {
    const result = parseContactPayload("not an object");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.error).toBe("Invalid input");
    }
  });

  it("returns failure for null input", () => {
    const result = parseContactPayload(null);
    expect(result.success).toBe(false);
  });
});

describe("formatZodError", () => {
  it("formats single field error", () => {
    const result = contactSchema.safeParse({
      name: "",
      email: "bad",
      message: "",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.error).toBe("Invalid input");
      expect(formatted.fields).toBeDefined();
      expect(typeof formatted.fields).toBe("object");
    }
  });

  it("uses first error per field when multiple issues exist", () => {
    // Force multiple issues on the same path by combining validators
    const schema = z.object({ val: z.string().email().min(10) });
    const result = schema.safeParse({ val: "x" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      // Only one error message stored per field key
      expect(typeof formatted.fields["val"]).toBe("string");
    }
  });

  it("uses 'root' key for path-less errors", () => {
    const schema = z.string();
    const result = schema.safeParse(123);
    expect(result.success).toBe(false);
    if (!result.success) {
      const formatted = formatZodError(result.error);
      expect(formatted.fields["root"]).toBeDefined();
    }
  });
});
