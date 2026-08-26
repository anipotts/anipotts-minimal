export type SourceSurface = "projects" | "writing";

export type SourceContentField = {
  path: string;
  value: string;
  kind: string;
};

export type SourceContentRecord = {
  id: string;
  surface: SourceSurface;
  slug: string;
  title: string;
  route: string;
  status: string;
  source_ref: string;
  summary: string;
  body_words: number;
  body_state: string;
  body_section_count: number;
  body_preview: string;
  fields: SourceContentField[];
  next_safe_action: string;
};

export type SourceContentSummary = {
  projects: number;
  writing: number;
  published_writing: number;
  visible_projects: number;
};

export function sourceContentRecordsFromProjection(
  value: unknown,
): SourceContentRecord[] {
  if (!Array.isArray(value)) {
    throw new Error("canonical Admin source records must be an array");
  }

  return value.map((record, index) => sourceContentRecord(record, index));
}

export function summarizeSourceContentRecords(
  records: SourceContentRecord[],
): SourceContentSummary {
  return {
    projects: records.filter((record) => record.surface === "projects").length,
    writing: records.filter((record) => record.surface === "writing").length,
    published_writing: records.filter(
      (record) => record.surface === "writing" && record.status === "published",
    ).length,
    visible_projects: records.filter(
      (record) => record.surface === "projects" && record.status !== "hidden",
    ).length,
  };
}

function sourceContentRecord(
  value: unknown,
  index: number,
): SourceContentRecord {
  const record = object(value, `source_records[${index}]`);
  const surface = sourceSurface(record.surface, index);
  return {
    id: string(record.id, index, "id"),
    surface,
    slug: string(record.slug, index, "slug"),
    title: string(record.title, index, "title"),
    route: string(record.route, index, "route"),
    status: string(record.status, index, "status"),
    source_ref: string(record.source_ref, index, "source_ref"),
    summary: string(record.summary, index, "summary"),
    body_words: number(record.body_words, index, "body_words"),
    body_state: string(record.body_state, index, "body_state"),
    body_section_count: number(
      record.body_section_count,
      index,
      "body_section_count",
    ),
    body_preview: string(record.body_preview, index, "body_preview"),
    fields: fields(record.fields, index),
    next_safe_action: string(
      record.next_safe_action,
      index,
      "next_safe_action",
    ),
  };
}

function sourceSurface(value: unknown, index: number): SourceSurface {
  if (value !== "projects" && value !== "writing") {
    throw new Error(`source_records[${index}].surface is invalid`);
  }
  return value;
}

function fields(value: unknown, index: number): SourceContentField[] {
  if (!Array.isArray(value)) {
    throw new Error(`source_records[${index}].fields must be an array`);
  }
  return value.map((field, fieldIndex) => {
    const item = object(
      field,
      `source_records[${index}].fields[${fieldIndex}]`,
    );
    return {
      path: string(item.path, index, `fields[${fieldIndex}].path`),
      value: string(item.value, index, `fields[${fieldIndex}].value`),
      kind: string(item.kind, index, `fields[${fieldIndex}].kind`),
    };
  });
}

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function string(value: unknown, index: number, field: string): string {
  if (typeof value !== "string") {
    throw new Error(`source_records[${index}].${field} must be a string`);
  }
  return value;
}

function number(value: unknown, index: number, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`source_records[${index}].${field} must be a number`);
  }
  return value;
}
