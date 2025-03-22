import { prisma } from "@/lib/prisma";
import { VideoPlayer } from "./video-player";

export async function GuideVideoSection() {
  // Fetch the active video guide (using the first active one by position)
  const videoGuide = await prisma.videoGuide.findFirst({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });

  if (!videoGuide) {
    return null; // No video available
  }

  return (
    <div className="w-full mb-8">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">{videoGuide.title}</h2>

        {videoGuide.description && (
          <p className="mb-4 text-muted-foreground">{videoGuide.description}</p>
        )}

        <div className="rounded-lg overflow-hidden border">
          <VideoPlayer
            videoUrl={videoGuide.videoUrl}
            videoType={videoGuide.videoType}
            title={videoGuide.title}
          />
        </div>
      </div>
    </div>
  );
}
