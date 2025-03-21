"use client";

import { useState, useEffect, useRef } from "react";
import { VideoType } from "@prisma/client";

interface VideoPlayerProps {
  videoUrl: string;
  videoType: VideoType;
  title?: string;
}

export function VideoPlayer({ videoUrl, videoType, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [volumeLevel, setVolumeLevel] = useState(1); // Default volume (1 = 100%)

  useEffect(() => {
    setIsLoading(true);
    // Reset loading state when URL changes
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [videoUrl]);

  // Extract YouTube video ID from URL
  const getYoutubeVideoId = (url: string) => {
    const regExp =
      /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Handle volume change from custom volume controls
  const handleVolumeChange = (value: number) => {
    setVolumeLevel(value);
  };

  if (videoType === "YOUTUBE") {
    const videoId = getYoutubeVideoId(videoUrl);
    if (!videoId)
      return <div className="text-red-500">Invalid YouTube URL</div>;

    return (
      <div className="w-full aspect-video relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/5">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${videoId}`}
          title={title || "How to use tutorial"}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsLoading(false)}
        ></iframe>
      </div>
    );
  }

  // MP4 Video
  return (
    <div className="w-full aspect-video relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/5">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <video
        ref={videoRef}
        className="w-full h-full"
        controls
        poster="/video-thumbnail.jpg"
        onLoadedData={() => setIsLoading(false)}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
