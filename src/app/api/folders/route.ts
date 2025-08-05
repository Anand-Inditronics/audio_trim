import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const BASE_DIR = path.join(process.cwd(), "public", "trimmed_files");

function getDirectories(folderPath: string): string[] {
  try {
    return fs
      .readdirSync(folderPath, { withFileTypes: true })
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name);
  } catch {
    return [];
  }
}

export async function GET() {
  const cities = getDirectories(BASE_DIR);
  const result = [];

  for (const city of cities) {
    const cityPath = path.join(BASE_DIR, city);
    const stations = getDirectories(cityPath);

    const stationData = stations.map((station) => {
      const stationPath = path.join(cityPath, station);
      const recordings = getDirectories(stationPath);

      const recordingData = recordings.map((recording) => {
        const recordingPath = path.join(stationPath, recording);
        const dates = getDirectories(recordingPath);

        const dateData = dates.map((date) => ({
          name: date,
          path: `${city}/${station}/${recording}/${date}`,
        }));

        return {
          name: recording,
          dates: dateData,
        };
      });

      return {
        name: station,
        recordings: recordingData,
      };
    });

    result.push({
      name: city,
      stations: stationData,
    });
  }

  return NextResponse.json(result);
}
