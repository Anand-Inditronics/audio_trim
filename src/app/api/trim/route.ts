// src/app/api/trim/route.ts
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { getClipMetadata } from "../../../../utils/metadata";

console.log("inside api");

function getDurationInSeconds(filePath: string): number {
  try {
    const output = execSync(
      `ffprobe -i "${filePath}" -show_entries format=duration -v quiet -of csv="p=0"`
    ).toString();
    return parseFloat(output.trim());
  } catch (err) {
    console.error("Failed to get duration:", err);
    return 0;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { hour_file, relative_path } = await req.json();

    if (!hour_file || !relative_path) {
      return NextResponse.json(
        { message: "Missing hour_file or relative_path" },
        { status: 400 }
      );
    }

    const metadata = getClipMetadata(relative_path).find(
      (m) => m.hour_file === hour_file
    );

    if (!metadata) {
      return NextResponse.json(
        { message: "Metadata not found" },
        { status: 404 }
      );
    }

    const inputPath = path.join(
      process.cwd(),
      "public",
      "audio_files",
      relative_path,
      hour_file
    );

    const outputFileName = hour_file.replace(".mp3", "_trimmed.mp3");
    const outputPath = path.join(
      process.cwd(),
      "public",
      "trimmed_files",
      relative_path,
      outputFileName
    );

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    if (!fs.existsSync(inputPath)) {
      return NextResponse.json(
        { message: "Input file not found" },
        { status: 404 }
      );
    }

    // Trim file to 3600 seconds
    execSync(`ffmpeg -y -i "${inputPath}" -t 3600 "${outputPath}"`);

    // Send the trimmed file as a downloadable response
    const fileBuffer = fs.readFileSync(outputPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": `attachment; filename="${outputFileName}"`,
      },
    });
  } catch (err: any) {
    console.error("Trimming failed:", err);
    return NextResponse.json(
      { message: "Trimming failed", error: err.message || String(err) },
      { status: 500 }
    );
  }
}
