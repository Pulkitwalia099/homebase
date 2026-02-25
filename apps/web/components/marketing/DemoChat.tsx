"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DemoScenario } from "../../lib/demo-scenarios";

interface DemoChatProps {
  scenario: DemoScenario;
  onReset: () => void;
}

export default function DemoChat({ scenario, onReset }: DemoChatProps) {
  const [tab, setTab] = useState<"human" | "machine">("human");
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [typedText, setTypedText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [playing, setPlaying] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const clearTimeouts = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  useEffect(() => {
    setVisibleMessages(0);
    setTypedText("");
    setShowResult(false);
    setPlaying(true);

    let step = 0;
    const messages = scenario.messages;

    function next() {
      if (step < messages.length) {
        const msg = messages[step];
        const currentStep = step;
        if (msg.role === "user") {
          setVisibleMessages(currentStep + 1);
          step++;
          timeoutRef.current = setTimeout(next, 800);
        } else {
          setVisibleMessages(currentStep);
          let charIndex = 0;
          setTypedText("");
          const typeChar = () => {
            if (charIndex < msg.content.length) {
              setTypedText(msg.content.slice(0, charIndex + 1));
              charIndex++;
              timeoutRef.current = setTimeout(typeChar, 40);
            } else {
              setVisibleMessages(currentStep + 1);
              setTypedText("");
              step++;
              timeoutRef.current = setTimeout(next, 800);
            }
          };
          timeoutRef.current = setTimeout(typeChar, 800);
        }
      } else {
        timeoutRef.current = setTimeout(() => {
          setShowResult(true);
          setPlaying(false);
        }, 600);
      }
    }

    timeoutRef.current = setTimeout(next, 400);
    return clearTimeouts;
  }, [scenario, clearTimeouts]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleMessages, typedText, showResult]);

  const r = scenario.result;

  return (
    <div className="rounded-xl border border-cool-gray bg-white shadow-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-cool-gray">
        <button
          onClick={() => setTab("human")}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            tab === "human" ? "text-navy border-b-2 border-amber" : "text-navy-light"
          }`}
        >
          ◉ Human
        </button>
        <button
          onClick={() => setTab("machine")}
          className={`flex-1 py-2.5 text-sm font-mono font-medium transition-colors ${
            tab === "machine" ? "text-green border-b-2 border-green" : "text-navy-light"
          }`}
        >
          ○ Machine
        </button>
      </div>

      {tab === "human" ? (
        <div className="p-4 space-y-3 min-h-[350px] max-h-[500px] overflow-y-auto">
          {scenario.messages.slice(0, visibleMessages).map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line ${
                  msg.role === "user"
                    ? "bg-amber text-navy rounded-br-md"
                    : "bg-cool-gray text-navy rounded-bl-md"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {playing && visibleMessages < scenario.messages.length &&
            scenario.messages[visibleMessages]?.role === "assistant" && (
            <div className="flex justify-start">
              <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-md bg-cool-gray text-navy text-sm">
                {typedText ? (
                  <>{typedText}<span className="animate-pulse">|</span></>
                ) : (
                  <span className="flex gap-1">
                    <span className="w-2 h-2 bg-navy-light/40 rounded-full animate-bounce" />
                    <span className="w-2 h-2 bg-navy-light/40 rounded-full animate-bounce [animation-delay:0.1s]" />
                    <span className="w-2 h-2 bg-navy-light/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Result card */}
          {showResult && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-green/10 border border-green/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-green font-medium">{r.job_code}</span>
                  <span className="text-xs bg-green/20 text-green px-2 py-0.5 rounded-full font-medium">
                    {Math.round(r.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="font-bold text-navy">{r.name}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xl font-bold text-navy">${(r.price_cents / 100).toFixed(0)}</span>
                  <span className="text-sm text-navy-light">{r.duration_min} min</span>
                </div>
                <div className="mt-3 pt-3 border-t border-green/20">
                  <p className="text-xs font-medium text-navy-light mb-1">Includes:</p>
                  <ul className="text-xs text-navy-light space-y-0.5">
                    {r.includes.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Available times */}
              <div className="p-4 rounded-xl bg-cool-gray/50 border border-cool-gray">
                <p className="text-sm font-medium text-navy mb-2">Available times:</p>
                <div className="flex flex-wrap gap-2">
                  {r.available_windows.map((w) => (
                    <span key={w} className="text-xs px-3 py-1.5 rounded-full border border-navy/20 text-navy">
                      {w}
                    </span>
                  ))}
                </div>
                <button
                  onClick={onReset}
                  className="mt-4 w-full bg-amber text-navy font-medium py-2.5 rounded-lg hover:bg-amber/90 transition-colors text-sm"
                >
                  Book Now →
                </button>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      ) : (
        /* Machine view */
        <div className="p-4 bg-dark min-h-[350px] max-h-[500px] overflow-y-auto">
          <pre className="text-xs font-mono text-green/90 whitespace-pre-wrap leading-relaxed">
            {`${scenario.api_request.method} ${scenario.api_request.path}
${JSON.stringify(scenario.api_request.body, null, 2)}

→ 200 OK
${JSON.stringify(scenario.api_response, null, 2)}`}
          </pre>
        </div>
      )}
    </div>
  );
}
