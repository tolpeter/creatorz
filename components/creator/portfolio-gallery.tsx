"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { ExternalLink, Film, ImageIcon, Play } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CREATOR_CATEGORIES } from "@/lib/constants";

export type GalleryItem = {
  id: string;
  type: "video" | "photo";
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  description?: string | null;
  categories?: string[];
};

export function PortfolioGallery({ items }: { items: GalleryItem[] }) {
  const photos = items.filter((i) => i.type === "photo");
  const videos = items.filter((i) => i.type === "video");
  const [lightboxIndex, setLightboxIndex] = useState<number>(-1);

  if (items.length === 0) {
    return (
      <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#f0f4e5] text-[#4d7c0f]">
          <Film className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-black">Még nincs publikus portfólió</h3>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          A creator hamarosan feltölthet videókat és fotókat, hogy a márkák gyorsabban
          átlássák a stílusát.
        </p>
      </div>
    );
  }

  return (
    <>
      <Tabs defaultValue={videos.length ? "videos" : "photos"} className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="rounded-full bg-[#eef2e4] p-1">
            <TabsTrigger value="videos" className="rounded-full">
              <Film className="h-4 w-4" /> Videók ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="photos" className="rounded-full">
              <ImageIcon className="h-4 w-4" /> Fotók ({photos.length})
            </TabsTrigger>
          </TabsList>
          <p className="text-sm text-muted-foreground">
            {items.length} válogatott portfólióelem
          </p>
        </div>

        <TabsContent value="videos">
          {videos.length === 0 ? (
            <EmptyTab
              icon={<Film className="h-6 w-6" />}
              title="Még nincs videós referencia"
              text="A videók külön falban jelennek meg, amikor a creator TikTok/YouTube linket vagy saját videót ad hozzá."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {videos.map((video) =>
                isExternalVideo(video.url) ? (
                  <ExternalVideoCard key={video.id} item={video} />
                ) : (
                  <VideoCard key={video.id} item={video} />
                ),
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="photos">
          {photos.length === 0 ? (
            <EmptyTab
              icon={<ImageIcon className="h-6 w-6" />}
              title="Még nincs feltöltött fotó"
              text="A feltöltött fotók itt jelennek meg letisztult, nagyítható galériában."
            />
          ) : (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo, index) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(index)}
                  className="group overflow-hidden rounded-[1.35rem] border border-black/10 bg-white p-1 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.url}
                    alt={photo.title ?? ""}
                    className="aspect-square w-full rounded-[1.05rem] object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {(photo.title || (photo.categories?.length ?? 0) > 0) && (
                    <span className="block p-3">
                      {photo.title && (
                        <span className="block truncate text-sm font-bold">{photo.title}</span>
                      )}
                      <CategoryBadges categories={photo.categories ?? []} />
                    </span>
                  )}
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
        slides={photos.map((photo) => ({
          src: photo.url,
          title: photo.title ?? undefined,
        }))}
      />
    </>
  );
}

function ExternalVideoCard({ item }: { item: GalleryItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative block overflow-hidden rounded-[1.35rem] border border-black/10 bg-black shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
      title={item.title ?? "Videó megtekintése"}
    >
      {item.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt={item.title ?? ""}
          className="aspect-[9/16] w-full object-cover opacity-95 transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="flex aspect-[9/16] w-full items-center justify-center bg-[#151515]">
          <Play className="h-9 w-9 text-white/70" />
        </div>
      )}
      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-black shadow">
        <ExternalLink className="h-3.5 w-3.5" />
        Külső videó
      </span>
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition group-hover:bg-black/25">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-black/50 text-white shadow-lg backdrop-blur transition-transform group-hover:scale-110">
          <Play className="h-6 w-6 translate-x-0.5 fill-white" />
        </span>
      </span>
      {item.title && (
        <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black via-black/70 to-transparent p-3 pt-10 text-sm font-bold text-white">
          {item.title}
        </span>
      )}
    </a>
  );
}

function VideoCard({ item }: { item: GalleryItem }) {
  const ref = useRef<HTMLVideoElement>(null);

  return (
    <figure className="group overflow-hidden rounded-[1.35rem] border border-black/10 bg-black shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        ref={ref}
        controls
        muted
        playsInline
        preload="metadata"
        poster={item.thumbnailUrl ?? undefined}
        onMouseEnter={() => ref.current?.play().catch(() => {})}
        onMouseLeave={() => {
          if (!ref.current) return;
          ref.current.pause();
          ref.current.currentTime = 0;
        }}
        className="aspect-[9/16] w-full bg-black object-cover"
      >
        <source src={item.url} />
      </video>
      {(item.title || (item.categories?.length ?? 0) > 0) && (
        <figcaption className="space-y-2 bg-white p-3">
          {item.title && <p className="line-clamp-2 text-sm font-bold">{item.title}</p>}
          <CategoryBadges categories={item.categories ?? []} />
        </figcaption>
      )}
    </figure>
  );
}

function CategoryBadges({ categories }: { categories: string[] }) {
  if (!categories.length) return null;
  return (
    <span className="mt-2 flex flex-wrap gap-1">
      {categories.slice(0, 3).map((category) => (
        <Badge key={category} variant="secondary" className="rounded-full text-[10px]">
          {CREATOR_CATEGORIES.find((item) => item.value === category)?.label ?? category}
        </Badge>
      ))}
    </span>
  );
}

function EmptyTab({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-black/15 bg-white p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f4e5] text-[#4d7c0f]">
        {icon}
      </div>
      <h3 className="mt-4 text-base font-black">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function isExternalVideo(url: string) {
  return /tiktok\.com|youtube\.com|youtu\.be/i.test(url);
}
