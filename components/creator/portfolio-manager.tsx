"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Trash2, Video, ImageIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChipMultiSelect } from "@/components/shared/chip-multi-select";
import { CREATOR_CATEGORIES, MAX_PORTFOLIO_ITEMS } from "@/lib/constants";
import { uploadFile } from "@/lib/supabase/upload";
import {
  addPortfolioItem,
  addVideoLink,
  deletePortfolioItem,
  reorderPortfolio,
} from "@/app/actions/portfolio";

export type PortfolioItemView = {
  id: string;
  type: "video" | "photo";
  url: string;
  thumbnailUrl: string | null;
  title: string | null;
  categories: string[];
};

export function PortfolioManager({ initial }: { initial: PortfolioItemView[] }) {
  const router = useRouter();
  const [items, setItems] = useState<PortfolioItemView[]>(initial);
  const [open, setOpen] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  async function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    const res = await reorderPortfolio(next.map((i) => i.id));
    if (res.error) {
      toast.error(res.error);
      setItems(items); // visszaállítás
    } else {
      toast.success("Sorrend mentve");
    }
  }

  async function handleDelete(id: string) {
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    const res = await deletePortfolioItem(id);
    if (res.error) {
      toast.error(res.error);
      setItems(prev);
    } else {
      toast.success("Elem törölve");
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {items.length}/{MAX_PORTFOLIO_ITEMS} elem · húzd át a sorrendezéshez
        </p>
        <Button
          onClick={() => setOpen(true)}
          disabled={items.length >= MAX_PORTFOLIO_ITEMS}
        >
          <Plus className="h-4 w-4" /> Új elem
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
          Még nincs portfolio elem. Tölts fel videót vagy fotót!
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map((i) => i.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <SortableCard key={item.id} item={item} onDelete={handleDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddDialog
        open={open}
        onOpenChange={setOpen}
        onAdded={() => {
          setOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}

function SortableCard({
  item,
  onDelete,
}: {
  item: PortfolioItemView;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const preview = item.type === "video" ? item.thumbnailUrl : item.url;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="overflow-hidden rounded-lg border bg-card"
    >
      <div className="relative aspect-video bg-muted">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={item.title ?? ""} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            {item.type === "video" ? (
              <Video className="h-8 w-8" />
            ) : (
              <ImageIcon className="h-8 w-8" />
            )}
          </div>
        )}
        <button
          type="button"
          className="absolute left-2 top-2 cursor-grab rounded bg-background/80 p-1 active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Áthelyezés"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <Badge className="absolute right-2 top-2" variant="secondary">
          {item.type === "video" ? "Videó" : "Fotó"}
        </Badge>
      </div>
      <div className="space-y-2 p-3">
        {item.title && <p className="truncate text-sm font-medium">{item.title}</p>}
        {item.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.categories.map((c) => (
              <Badge key={c} variant="outline" className="text-xs">
                {CREATOR_CATEGORIES.find((x) => x.value === c)?.label ?? c}
              </Badge>
            ))}
          </div>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => onDelete(item.id)}
        >
          <Trash2 className="h-4 w-4" /> Törlés
        </Button>
      </div>
    </div>
  );
}

function AddDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdded: () => void;
}) {
  const [mode, setMode] = useState<"videolink" | "photo">("videolink");
  const [videoUrl, setVideoUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function reset() {
    setMode("videolink");
    setVideoUrl("");
    setFile(null);
    setTitle("");
    setDescription("");
    setCategories([]);
  }

  async function submit() {
    setLoading(true);
    try {
      if (mode === "videolink") {
        if (!videoUrl.trim()) {
          toast.error("Illeszd be a videó linkjét");
          return;
        }
        const res = await addVideoLink({ url: videoUrl.trim() });
        if (res.error) {
          toast.error(res.error);
          return;
        }
        toast.success("Videó hozzáadva a profilodhoz");
        reset();
        onAdded();
        return;
      }

      // Fotó feltöltés
      if (!file) {
        toast.error("Válassz ki egy képfájlt");
        return;
      }
      const up = await uploadFile("portfolio", file);
      if (up.error || !up.url) {
        toast.error(`Feltöltés sikertelen: ${up.error ?? "ismeretlen hiba"}`);
        return;
      }
      const res = await addPortfolioItem({
        type: "photo",
        url: up.url,
        thumbnailUrl: null,
        title,
        description,
        categories,
      });
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Fotó hozzáadva");
      reset();
      onAdded();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Új portfólió elem</DialogTitle>
          <DialogDescription>
            Linkeld be a TikTok/YouTube videódat (előképet behúzzuk), vagy tölts
            fel egy fotót.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Mód-választó */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode("videolink")}
              className={
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium " +
                (mode === "videolink"
                  ? "border-accent bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              <Video className="h-4 w-4" /> Videó linkelése
            </button>
            <button
              type="button"
              onClick={() => setMode("photo")}
              className={
                "flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium " +
                (mode === "photo"
                  ? "border-accent bg-accent/10 text-foreground"
                  : "text-muted-foreground hover:bg-muted")
              }
            >
              <ImageIcon className="h-4 w-4" /> Fotó feltöltése
            </button>
          </div>

          {mode === "videolink" ? (
            <div className="space-y-1.5">
              <Label>TikTok vagy YouTube videó linkje</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@felhasznalo/video/..."
              />
              <p className="text-xs text-muted-foreground">
                A videó a TikTokon/YouTube-on marad — mi csak az előképét húzzuk
                be a profilodra.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label>Képfájl</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Cím (opcionális)</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Leírás (opcionális)</Label>
                <Textarea
                  value={description}
                  rows={2}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Kategóriák (max 3)</Label>
                <ChipMultiSelect
                  options={CREATOR_CATEGORIES}
                  value={categories}
                  onChange={setCategories}
                  max={3}
                />
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "videolink" ? "Videó hozzáadása" : "Fotó feltöltése"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
