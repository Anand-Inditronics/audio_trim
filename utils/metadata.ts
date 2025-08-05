import path from "path";
import fs from "fs";

export type ClipMeta = {
  hour_file: string;
  next_hour_file: string;
  tail_clip: string;
  head_clip: string;
  extra_ms: number;
};

export function getClipMetadata(relativePath: string): ClipMeta[] {
  try {
    const metadataPath = path.join(
      process.cwd(),
      "public",
      "trimmed_files",
      relativePath,
      "clip_metadata.json"
    );

    if (!fs.existsSync(metadataPath)) {
      console.error("clip_metadata.json not found at:", metadataPath);
      return [];
    }

    const data = fs.readFileSync(metadataPath, "utf-8");
    return JSON.parse(data) as ClipMeta[];
  } catch (err) {
    console.error("Failed to read metadata:", err);
    return [];
  }
}

