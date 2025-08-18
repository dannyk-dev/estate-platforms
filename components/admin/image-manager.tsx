// components/admin/image-manager.tsx  (client)
"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, Star, Pin, ArrowUp, ArrowDown, Check } from "lucide-react";
// import { FileUpload } from '@/components/file-upload'
// FileUpload
import { uploadImagesAction } from "@/app/actions/images";
import {
  deleteImageAction,
  setPrimaryAction,
  setPinnedRankAction,
  addTagsAction,
  removeTagAction,
  reorderImagesAction,
  type SimpleState,
} from "@/app/actions/images";
import { FileUpload } from "@/components/ui/file-upload";

type Img = {
  id: string;
  url: string;
  alt: string | null;
  caption: string | null;
  position: number;
  is_primary: boolean;
  pinned_rank: number | null;
  created_at: string;
  tags: string[];
};

export function ImageManager({
  projectId,
  images,
}: {
  projectId: string;
  images: Img[];
}) {
  const [local, setLocal] = useState(images);
  const [msg, setMsg] = useState<string | undefined>();

  // Upload
  // Upload
  const [_uState, upload, uploading] = useActionState<SimpleState, FormData>(
    (_state, form) => uploadImagesAction(projectId, form),
    {}
  );

  // Helpers
  const idxById = useMemo(
    () => new Map(local.map((v, i) => [v.id, i])),
    [local]
  );

  const move = (id: string, dir: -1 | 1) => {
    const i = idxById.get(id);
    if (i == null) return;
    const j = i + dir;
    if (j < 0 || j >= local.length) return;
    const next = local.slice();
    const [a, b] = [next[i], next[j]];
    next[i] = b;
    next[j] = a;
    next.forEach((v, k) => (v.position = k));
    setLocal(next);
  };

  const [reState, reorder, reordering] = useActionState<SimpleState, FormData>(
    reorderImagesAction.bind(null, projectId),
    {}
  );
  const commitOrder = () => {
    const fd = new FormData();
    fd.set(
      "ordered",
      JSON.stringify(local.map((v, i) => ({ id: v.id, position: i })))
    );
    reorder(fd).then((s) => setMsg(s?.success || s?.error));
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 space-y-2">
        <FileUpload action={upload} name="images" accept="image/*" multiple />
        {uploading ? (
          <p className="text-sm text-muted-foreground">Uploading…</p>
        ) : null}
      </Card>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={commitOrder}
          disabled={reordering}
        >
          Save order
        </Button>
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
      </div>

      {local.length === 0 ? (
        <Card className="p-6 text-sm text-muted-foreground">
          No images yet.
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {local.map((img, i) => (
            <ImageCard
              key={img.id}
              projectId={projectId}
              img={img}
              onMove={move}
              index={i}
              total={local.length}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ImageCard({
  projectId,
  img,
  onMove,
  index,
  total,
}: {
  projectId: string;
  img: Img;
  onMove: (id: string, dir: -1 | 1) => void;
  index: number;
  total: number;
}) {
  const [pin, setPin] = useState<number | "">(img.pinned_rank ?? "");
  const [tagsText, setTagsText] = useState("");

  const [delState, doDelete, deleting] = useActionState<SimpleState, FormData>(
    deleteImageAction,
    {}
  );
  const [priState, setPrimary, priming] = useActionState<SimpleState, FormData>(
    setPrimaryAction,
    {}
  );
  const [pinState, setPinned, pinning] = useActionState<SimpleState, FormData>(
    setPinnedRankAction,
    {}
  );
  const [addState, addTags, adding] = useActionState<SimpleState, FormData>(
    addTagsAction,
    {}
  );
  const [remState, removeTag, removing] = useActionState<SimpleState, FormData>(
    removeTagAction,
    {}
  );

  return (
    <Card className="overflow-hidden">
      <div className="relative w-full aspect-[4/3] bg-gray-100">
        <Image
          src={img.url}
          alt={img.alt || ""}
          fill
          className="object-cover"
          sizes="(max-width:768px) 100vw, 33vw"
        />
        {img.is_primary && (
          <div className="absolute left-2 top-2 inline-flex items-center gap-1 rounded bg-yellow-400/90 px-2 py-0.5 text-xs font-medium text-gray-900">
            <Star className="h-3 w-3" /> Primary
          </div>
        )}
      </div>

      <div className="p-3 space-y-3">
        {/* Reorder */}
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMove(img.id, -1)}
            disabled={index === 0}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onMove(img.id, +1)}
            disabled={index === total - 1}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <span className="ml-2 text-xs text-muted-foreground">
            Pos {index}
          </span>
        </div>

        {/* Primary */}
        <form action={setPrimary} className="flex items-center gap-2">
          <input type="hidden" name="imageId" value={img.id} />
          <Button type="submit" size="sm" disabled={priming}>
            <Star className="h-4 w-4 mr-1" /> Set primary
          </Button>
          {priState?.error && (
            <span className="text-xs text-red-600">{priState.error}</span>
          )}
        </form>

        {/* Pin rank */}
        <form
          action={setPinned}
          onSubmit={(e) => {
            if (pin === "")
              (
                e.currentTarget.elements.namedItem("rank") as HTMLInputElement
              ).value = "";
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="imageId" value={img.id} />
          <Label htmlFor={`pin-${img.id}`} className="text-xs">
            Pin
          </Label>
          <Input
            id={`pin-${img.id}`}
            name="rank"
            type="number"
            min={0}
            step={1}
            className="h-8 w-20"
            value={pin}
            onChange={(e) =>
              setPin(
                e.target.value === ""
                  ? ""
                  : Math.max(0, Math.floor(Number(e.target.value)))
              )
            }
            placeholder="—"
          />
          <Button type="submit" variant="outline" size="sm" disabled={pinning}>
            <Pin className="h-4 w-4 mr-1" /> Save
          </Button>
          {pinState?.error && (
            <span className="text-xs text-red-600">{pinState.error}</span>
          )}
        </form>

        {/* Tags */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {img.tags.map((t) => (
              <form key={t} action={removeTag}>
                <input type="hidden" name="imageId" value={img.id} />
                <input type="hidden" name="tag" value={t} />
                <button
                  type="submit"
                  className="text-xs rounded-full border px-2 py-0.5 hover:bg-gray-50"
                  disabled={removing}
                  title="Remove tag"
                >
                  {t} ×
                </button>
              </form>
            ))}
            {img.tags.length === 0 && (
              <span className="text-xs text-muted-foreground">No tags</span>
            )}
          </div>
          <form action={addTags} className="flex items-center gap-2">
            <input type="hidden" name="imageId" value={img.id} />
            <Input
              name="tags"
              placeholder="Add tags, comma-separated"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              className="h-8"
            />
            <Button type="submit" variant="outline" size="sm" disabled={adding}>
              <Check className="h-4 w-4 mr-1" /> Add
            </Button>
            {addState?.error && (
              <span className="text-xs text-red-600">{addState.error}</span>
            )}
          </form>
        </div>

        {/* Delete */}
        <form action={deleteImageAction}>
          <input type="hidden" name="imageId" value={img.id} />
          <Button
            type="submit"
            variant="destructive"
            size="sm"
            onClick={(e) => {
              if (!confirm("Delete this image?")) e.preventDefault();
            }}
            disabled={deleting}
          >
            <Trash2 className="h-4 w-4 mr-1" /> Delete
          </Button>
          {delState?.error && (
            <span className="ml-2 text-xs text-red-600">{delState.error}</span>
          )}
        </form>
      </div>
    </Card>
  );
}
