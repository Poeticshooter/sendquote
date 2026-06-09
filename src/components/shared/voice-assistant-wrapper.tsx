"use client";

import dynamic from "next/dynamic";

const VoiceAssistant = dynamic(
  () => import("@/components/shared/voice-assistant").then((mod) => mod.VoiceAssistant),
  { ssr: false }
);

export function VoiceAssistantWrapper() {
  return <VoiceAssistant />;
}
