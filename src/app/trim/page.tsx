"use client";

import { useEffect, useState } from "react";
import { ClipMeta } from "../../../utils/metadata";
import {
  Loader2,
  CheckCircle,
  XCircle,
  Download,
  SkipBack,
  SkipForward,
  Music,
  Volume2,
  Play,
  Pause,
  Settings,
  FileAudio,
  Clock,
  MapPin,
  Radio,
  Calendar,
  BarChart3,
  Headphones,
} from "lucide-react";
import { CSVLink } from "react-csv";

interface MissingData {
  status_per_hour: {
    [key: string]: "ok" | "missing";
  };
}

interface FolderStructure {
  name: string;
  stations: {
    name: string;
    recordings: {
      name: string;
      dates: {
        name: string;
        path: string;
      }[];
    }[];
  }[];
}

export default function AudioTrimmer() {
  const [structure, setStructure] = useState<FolderStructure[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedStation, setSelectedStation] = useState("");
  const [selectedRecording, setSelectedRecording] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const [clips, setClips] = useState<ClipMeta[]>([]);
  const [missingData, setMissingData] = useState<MissingData | null>(null);
  const [durationMap, setDurationMap] = useState<{
    [filename: string]: { duration: number | null; trimmed: boolean };
  }>({});


  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"success" | "error" | null>(null);

  const [trimmedFiles, setTrimmedFiles] = useState<string[]>([]);
  const [trimmingFile, setTrimmingFile] = useState<string | null>(null); // New state for file being trimmed

  const selectedPath = structure
    .find((c) => c.name === selectedCity)
    ?.stations.find((s) => s.name === selectedStation)
    ?.recordings.find((r) => r.name === selectedRecording)
    ?.dates.find((d) => d.name === selectedDate)?.path;

  useEffect(() => {
    fetch("/api/folders")
      .then((res) => res.json())
      .then(setStructure);
  }, []);

  useEffect(() => {
    if (!selectedPath) return;

    const loadAll = async () => {
      setCurrentIndex(0);
      setStatus(null);

      const clipsRes = await fetch(
        `/trimmed_files/${selectedPath}/clip_metadata.json`
      );
      const missingRes = await fetch(
        `/trimmed_files/${selectedPath}/missing_data.json`
      );

      const clipsData = await clipsRes.json();
      const missingData = await missingRes.json();

      setClips(clipsData);
      setMissingData(missingData);

      // Duration map loader
      const entries = Object.entries(missingData.status_per_hour);

      const result: {
        [filename: string]: { duration: number | null; trimmed: boolean };
      } = {};

      await Promise.all(
        entries.map(async ([filename, info]: any) => {
          if (info !== "ok") {
            result[filename] = { duration: null, trimmed: false };
            return;
          }

          const url = `/audio_files/${selectedPath}/${filename}`;
          const audio = new Audio();
          audio.src = url;

          const duration = await new Promise<number | null>((resolve) => {
            audio.addEventListener("loadedmetadata", () =>
              resolve(audio.duration)
            );
            audio.addEventListener("error", () => resolve(null));
          });

          const isTrimmed = clipsData.some(
            (c: any) => c.hour_file === filename
          );

          result[filename] = {
            duration,
            trimmed: isTrimmed,
          };
        })
      );

      setDurationMap(result);
    };

    loadAll();
  }, [selectedPath]);


  

  const handleTrim = async () => {
    const current = clips[currentIndex];
    if (!current) return;
    setLoading(true);
    setStatus(null);
    setTrimmingFile(current.hour_file); // Set the file being trimmed

    try {
      const response = await fetch("/api/trim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hour_file: current.hour_file,
          relative_path: `${selectedCity}/${selectedStation}/${selectedRecording}/${selectedDate}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Trim request failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = current.hour_file.replace(".mp3", "_trimmed.mp3");
      a.click();

      window.URL.revokeObjectURL(url);
      setTrimmedFiles((prev) => [...prev, current.hour_file]);

      setStatus("success");
    } catch (err) {
      console.error("Trimming failed:", err);
      setStatus("error");
    } finally {
      setLoading(false);
      setTrimmingFile(null); // Clear the trimming file state
    }
  };

  const handleNext = () => {
    setCurrentIndex((i) => Math.min(i + 1, clips.length - 1));
    setStatus(null);
  };

  const handlePrevious = () => {
    setCurrentIndex((i) => Math.max(i - 1, 0));
    setStatus(null);
  };

  const getStationOptions = () =>
    structure.find((c) => c.name === selectedCity)?.stations || [];

  const getRecordingOptions = () =>
    getStationOptions().find((s) => s.name === selectedStation)?.recordings ||
    [];

  const getDateOptions = () =>
    getRecordingOptions().find((r) => r.name === selectedRecording)?.dates ||
    [];

  const current = clips[currentIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-100 dark:from-slate-900 dark:to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-10">
        {/* Enhanced Header */}
        <div className="text-center space-y-6 py-8">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl blur opacity-30"></div>
              <div className="relative p-4 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-xl">
                <Headphones className="h-10 w-10 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h1 className="text-5xl font-extrabold bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Audio Trimmer Studio
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-violet-500 to-purple-600 rounded-full mt-2"></div>
            </div>
          </div>
          <p className="text-slate-600 dark:text-slate-300 text-xl max-w-3xl mx-auto leading-relaxed">
            Professional audio trimming and review tool for managing recordings
            across multiple stations and dates with precision and ease.
          </p>
        </div>

        {/* Enhanced Selection Controls */}
        <div className="relative">
          <div className="bg-white/90 dark:bg-slate-800/90 rounded-3xl p-8 shadow-2xl border border-white/20 dark:border-slate-700/20">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                  Audio Source Selection
                </h2>
                <p className="text-slate-600 dark:text-slate-300">
                  Choose your audio configuration
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  City
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => {
                    setSelectedCity(e.target.value);
                    setSelectedStation("");
                    setSelectedRecording("");
                    setSelectedDate("");
                  }}
                  className="w-full bg-white/70 dark:bg-slate-700/70 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">Select City</option>
                  {structure.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <Radio className="h-4 w-4 text-green-500" />
                  Station
                </label>
                <select
                  value={selectedStation}
                  onChange={(e) => {
                    setSelectedStation(e.target.value);
                    setSelectedRecording("");
                    setSelectedDate("");
                  }}
                  disabled={!selectedCity}
                  className="w-full bg-white/70 dark:bg-slate-700/70 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">Select Station</option>
                  {getStationOptions().map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <FileAudio className="h-4 w-4 text-purple-500" />
                  Recording
                </label>
                <select
                  value={selectedRecording}
                  onChange={(e) => {
                    setSelectedRecording(e.target.value);
                    setSelectedDate("");
                  }}
                  disabled={!selectedStation}
                  className="w-full bg-white/70 dark:bg-slate-700/70 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">Select Recording</option>
                  {getRecordingOptions().map((r) => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="group">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  Date
                </label>
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={!selectedRecording}
                  className="w-full bg-white/70 dark:bg-slate-700/70 border-2 border-slate-200 dark:border-slate-600 rounded-xl px-4 py-4 text-slate-800 dark:text-white focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:border-slate-300 dark:hover:border-slate-500"
                >
                  <option value="">Select Date</option>
                  {getDateOptions().map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Audio Player Section */}
        {current && (
          <div className="space-y-8">
            {/* Progress Info */}
            <div className="text-center">
              <div className="inline-flex items-center gap-4 bg-white/90 dark:bg-slate-800/90 px-8 py-4 rounded-2xl border border-white/20 dark:border-slate-700/20 shadow-xl">
                <div className="relative">
                  <div className="w-4 h-4 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full animate-pulse"></div>
                </div>
                <span className="text-xl font-bold text-slate-800 dark:text-white">
                  Reviewing {currentIndex + 1} of {clips.length} clips
                </span>
                <div className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-500 text-white text-sm font-medium rounded-full">
                  Active
                </div>
              </div>
            </div>

            {/* Enhanced Audio Players */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="group relative">
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-3xl p-8 shadow-xl border border-white/20 dark:border-slate-700/20 hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Volume2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                        Tail Segment
                      </h3>
                      <p className="text-sm font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1 rounded-lg">
                        {current.hour_file}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6">
                    <audio
                      controls
                      src={`/trimmed_files/${selectedCity}/${selectedStation}/${selectedRecording}/${selectedDate}/${current.tail_clip}`}
                      className="w-full h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="bg-white/90 dark:bg-slate-800/90 rounded-3xl p-8 shadow-xl border border-white/20 dark:border-slate-700/20 hover:shadow-2xl transition-all duration-500">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                      <Volume2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-1">
                        Head Segment
                      </h3>
                      <p className="text-sm font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-lg">
                        {current.next_hour_file}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-600 rounded-2xl p-6">
                    <audio
                      controls
                      src={`/trimmed_files/${selectedCity}/${selectedStation}/${selectedRecording}/${selectedDate}/${current.head_clip}`}
                      className="w-full h-12"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Controls */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="group flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 dark:border-slate-700/20 shadow-lg hover:shadow-xl hover:scale-105"
              >
                <SkipBack className="h-5 w-5 group-hover:scale-110 transition-transform" />
                Previous
              </button>

              <div className="relative">
                <button
                  onClick={handleTrim}
                  disabled={loading}
                  className="relative flex items-center gap-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl hover:scale-105 transform"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin h-6 w-6" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Download className="h-5 w-5" />
                      Trim & Download
                    </>
                  )}
                </button>
              </div>

              {trimmingFile && (
                <div className="absolute top-full mt-2 w-full f-[75%]  text-center text-xl font-medium text-slate-800 dark:text-slate-200 bg-white/90 dark:bg-slate-800/90 px-4 py-2 rounded-xl border border-white/20 dark:border-slate-700/20 shadow-lg">
                  Trimming:{" "}
                  <span className="font-mono text-violet-600">
                    {trimmingFile}
                  </span>
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={currentIndex === clips.length - 1}
                className="group flex items-center gap-3 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-2xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/20 dark:border-slate-700/20 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Next
                <SkipForward className="h-5 w-5 group-hover:scale-110 transition-transform" />
              </button>

              {status === "success" && (
                <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-900/30 px-6 py-3 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-semibold">Trim successful!</span>
                </div>
              )}

              {status === "error" && (
                <div className="flex items-center gap-3 text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/30 px-6 py-3 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg">
                  <XCircle className="h-5 w-5" />
                  <span className="font-semibold">Trim failed</span>
                </div>
              )}
            </div>

            {/* Enhanced Progress Bar */}
            <div className="max-w-3xl mx-auto space-y-4">
              <div className="relative w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-inner">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500 rounded-full transition-all duration-700 ease-out shadow-lg"
                  style={{
                    width: `${((currentIndex + 1) / clips.length) * 100}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">
                  Start
                </span>
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-800/80 px-4 py-2 rounded-full border border-white/20 dark:border-slate-700/20">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  <span className="text-slate-800 dark:text-white font-bold">
                    {Math.round(((currentIndex + 1) / clips.length) * 100)}%
                    Complete
                  </span>
                </div>
                <span className="text-slate-600 dark:text-slate-400">End</span>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Missing Data Section */}
        {missingData && (
          <div className="relative">
            <div className="bg-white/90 dark:bg-slate-800/90 rounded-3xl p-8 shadow-xl border border-white/20 dark:border-slate-700/20">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-slate-600 to-gray-600 rounded-xl shadow-lg">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                      Hourly File Status
                    </h2>
                    <p className="text-slate-600 dark:text-slate-300">
                      Monitor file availability across hours
                    </p>
                  </div>
                </div>
                <CSVLink
                  data={Object.entries(missingData.status_per_hour).map(
                    ([hour, info]: any) => {
                      const fileMeta = durationMap[hour] || {};
                      return {
                        hour,
                        duration: fileMeta.duration
                          ? `${(fileMeta.duration / 60).toFixed(2)} min`
                          : "N/A",
                        trimmed_duration: fileMeta.trimmed
                          ? "60.00 min"
                          : "N/A",
                        trimmed: fileMeta.trimmed ? "Yes" : "No",
                        status: info?.status || "missing",
                      };
                    }
                  )}
                  headers={[
                    { label: "Hour", key: "hour" },
                    { label: "Original Duration", key: "duration" },
                    { label: "Trimmed Duration", key: "trimmed_duration" },
                    { label: "Trimmed", key: "trimmed" },
                    { label: "Status", key: "status" },
                  ]}
                  filename="missing_data_report.csv"
                  className="group flex items-center gap-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Download className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  Export CSV
                </CSVLink>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                {Object.entries(missingData.status_per_hour).map(
                  ([file, status]) => (
                    <div
                      key={file}
                      className={`group relative rounded-2xl p-5 border-2 text-center font-mono transition-all duration-300 hover:scale-105 cursor-pointer ${
                        status === "missing"
                          ? "bg-red-50/80 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/30"
                          : "bg-emerald-50/80 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/30"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full mx-auto mb-3 shadow-lg group-hover:scale-125 transition-transform ${
                          status === "missing"
                            ? "bg-gradient-to-r from-red-500 to-pink-500"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        }`}
                      ></div>
                      <p className="text-xs font-bold truncate mb-1">{file}</p>
                      <p className="text-xs opacity-80 capitalize font-semibold">
                        {status}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
