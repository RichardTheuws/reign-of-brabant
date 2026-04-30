// Character whitelist — must match RoB faction voices
export const CHARACTERS = [
  "brabant",
  "limburg-male",
  "limburg-female",
  "randstad-male",
  "randstad-female",
  "belgen-male",
  "belgen-female",
] as const;

export type Character = (typeof CHARACTERS)[number];

export const ALLOWED_EXTENSIONS = ["m4a", "mp3", "wav", "ogg"] as const;
export type AudioExtension = (typeof ALLOWED_EXTENSIONS)[number];

export const MIME_BY_EXT: Record<AudioExtension, string> = {
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
};

export const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
export const RATE_LIMIT_PER_HOUR = 5;
export const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1h

export interface Submission {
  id: string;
  character: Character;
  submitterName: string;
  email?: string;
  filename: string;
  size: number;
  uploadedAt: string;
}

// Public-safe (no email)
export interface PublicSubmission {
  id: string;
  character: Character;
  submitterName: string;
  filename: string;
  size: number;
  uploadedAt: string;
}
