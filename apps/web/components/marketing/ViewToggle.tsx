"use client";

interface ViewToggleProps {
  mode: "human" | "machine";
  onToggle: (mode: "human" | "machine") => void;
}

export default function ViewToggle({ mode, onToggle }: ViewToggleProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center bg-[#111318]/90 backdrop-blur-md rounded-full p-1 shadow-lg">
        <button
          onClick={() => onToggle("human")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            mode === "human"
              ? "bg-warm-white text-navy shadow-sm"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          ◉ HUMAN
        </button>
        <button
          onClick={() => onToggle("machine")}
          className={`px-4 py-2 rounded-full text-sm font-mono font-medium transition-all duration-200 ${
            mode === "machine"
              ? "bg-green text-dark shadow-sm"
              : "text-gray-400 hover:text-gray-300"
          }`}
        >
          ○ MACHINE
        </button>
      </div>
    </div>
  );
}
