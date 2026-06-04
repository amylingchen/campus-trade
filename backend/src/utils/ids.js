import { randomUUID } from "crypto";

export function newId(prefix) {
  return `${prefix}_${randomUUID()}`;
}
