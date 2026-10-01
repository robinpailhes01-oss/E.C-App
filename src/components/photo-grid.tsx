"use client";

import * as React from "react";
import { Camera, ImagePlus, Trash2 } from "lucide-react";
import { getStore } from "@/lib/data";
import type { StoredFile } from "@/lib/types";
import { Button, Modal } from "./ui";

function Thumb({ file, onOpen, onRemove, readOnly }: { file: StoredFile; onOpen: (url: string) => void; onRemove?: () => void; readOnly?: boolean }) {
  const [url, setUrl] = React.useState<string>("");
  React.useEffect(() => {
    let alive = true;
    getStore()
      .getFileUrl(file)
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(""));
    return () => {
      alive = false;
    };
  }, [file]);
  return (
    <div className="relative size-20 shrink-0 rounded-[12px] overflow-hidden border border-line bg-surface group">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={file.name} className="size-full object-cover cursor-zoom-in" onClick={() => onOpen(url)} />
      ) : (
        <div className="size-full grid place-items-center text-[10px] text-muted">…</div>
      )}
      {!readOnly && onRemove && (
        <button type="button" onClick={onRemove} aria-label="Supprimer la photo" className="absolute top-1 right-1 size-6 grid place-items-center rounded-full bg-night/75 text-white opacity-90 hover:bg-red-600 transition">
          <Trash2 className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Photos d'un document ou d'un SAV : prise de vue depuis la tablette ou choix d'un fichier. */
export function PhotoGrid({
  files,
  scope,
  readOnly,
  onChange,
  compact,
}: {
  files: StoredFile[];
  scope: string;
  readOnly?: boolean;
  onChange: (files: StoredFile[]) => void;
  compact?: boolean;
}) {
  const camRef = React.useRef<HTMLInputElement>(null);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [view, setView] = React.useState<string | null>(null);

  const add = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const added: StoredFile[] = [];
      for (const f of Array.from(list)) added.push(await getStore().uploadFile(scope, f));
      onChange([...files, ...added]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ajout impossible");
    } finally {
      setBusy(false);
      if (camRef.current) camRef.current.value = "";
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (f: StoredFile) => {
    try {
      await getStore().deleteFile(f);
    } catch {
      /* le fichier reste référencé uniquement s'il n'a pas pu être supprimé : on le retire quand même de la liste */
    }
    onChange(files.filter((x) => x.id !== f.id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {files.map((f) => (
          <Thumb key={f.id} file={f} readOnly={readOnly} onOpen={setView} onRemove={() => remove(f)} />
        ))}
        {!readOnly && (
          <>
            <input ref={camRef} type="file" accept="image/*" capture="environment" multiple hidden onChange={(e) => add(e.target.files)} data-testid="photo-camera" />
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => add(e.target.files)} data-testid="photo-file" />
            <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => camRef.current?.click()}>
              <Camera className="size-4" /> {compact ? "Photo" : "Prendre une photo"}
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={() => fileRef.current?.click()}>
              <ImagePlus className="size-4" /> {compact ? "" : "Importer"}
            </Button>
          </>
        )}
        {readOnly && files.length === 0 && <span className="text-xs text-muted">Aucune photo</span>}
      </div>
      {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
      <Modal open={view !== null} onClose={() => setView(null)} title="Photo" wide>
        {view && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={view} alt="Photo du dossier" className="w-full max-h-[70dvh] object-contain rounded-[12px] bg-surface" />
        )}
      </Modal>
    </div>
  );
}
