import { randomBytes } from "node:crypto";

let counter = 0;

/** Collision-resistant, cuid-shaped ids so rows can be linked before a bulk insert. */
export function newId(): string {
  counter = (counter + 1) % 1_679_616;
  return `c${Date.now().toString(36)}${counter.toString(36).padStart(4, "0")}${randomBytes(8).toString("hex").slice(0, 12)}`;
}
