"use client";

import { useRef } from "react";
import { saveProgress } from "@/app/courses/[courseId]/lessons/[lessonId]/actions";

export function VideoPlayer({
  lessonId,
  src,
  startAt,
}: {
  lessonId: string;
  src: string;
  startAt: number;
}) {
  const lastSaved = useRef(0);

  return (
    // eslint-disable-next-line jsx-a11y/media-has-caption
    <video
      className="w-full rounded-xl bg-black"
      controls
      controlsList="nodownload"
      src={src}
      onLoadedMetadata={(e) => {
        if (startAt > 0) e.currentTarget.currentTime = startAt;
      }}
      onTimeUpdate={(e) => {
        const t = e.currentTarget.currentTime;
        if (t - lastSaved.current > 10) {
          lastSaved.current = t;
          void saveProgress(lessonId, t, false);
        }
      }}
      onEnded={(e) => {
        void saveProgress(lessonId, e.currentTarget.duration || 0, true);
      }}
      onPause={(e) => {
        void saveProgress(lessonId, e.currentTarget.currentTime, false);
      }}
    />
  );
}
