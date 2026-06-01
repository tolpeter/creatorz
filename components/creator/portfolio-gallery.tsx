"use client";

import { useState } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type GalleryItem = {
  id: string;
  type: "video" | "photo";
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
};

export function PortfolioGallery({ items }: { items: GalleryItem[] }) {
  const photos = items.filter((i) => i.type === "photo");
  const videos = items.filter((i) => i.type === "video");
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Ez a creator még nem töltött fel portfólió elemet.
      </p>
    );
  }

  return (
    <>
      <Tabs defaultValue={videos.length ? "videos" : "photos"}>
        <TabsList>
          <TabsTrigger value="videos">Videók ({videos.length})</TabsTrigger>
          <TabsTrigger value="photos">Fotók ({photos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          {videos.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Nincs videó.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {videos.map((v) => (
                <figure key={v.id} className="overflow-hidden rounded-lg border">
                  <video
                    controls
                    preload="metadata"
                    poster={v.thumbnailUrl ?? undefined}
                    className="aspect-video w-full bg-black object-cover"
                  >
                    <source src={v.url} />
                  </video>
                  {v.title && (
                    <figcaption className="p-2 text-sm">{v.title}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos">
          {photos.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">Nincs fotó.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setLightboxIndex(i)}
                  className="overflow-hidden rounded-lg border"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.url}
                    alt={p.title ?? ""}
                    className="aspect-square w-full object-cover transition-transform hover:scale-105"
                  />
                </button>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Lightbox
        open={lightboxIndex >= 0}
        index={Math.max(0, lightboxIndex)}
        close={() => setLightboxIndex(-1)}
        slides={photos.map((p) => ({ src: p.url, title: p.title ?? undefined }))}
      />
    </>
  );
}
