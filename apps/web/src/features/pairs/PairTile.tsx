import React, { useRef, useState, useEffect } from "react";

type Props = {
  index: number;
  front?: File;
  back?: File;
  onSelect: (side: "front" | "back", file: File) => void;
  onRemove: (side: "front" | "back") => void;
};

export default function PairTile({ index, front, back, onSelect, onRemove }: Props) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 text-sm font-medium text-ink">Pair #{index + 1}</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <DropBox
          side="front"
          file={front}
          onSelect={onSelect}
          onRemove={onRemove}
          label="Front image"
        />
        <DropBox
          side="back"
          file={back}
          onSelect={onSelect}
          onRemove={onRemove}
          label="Back image"
        />
      </div>
    </div>
  );
}

function DropBox({
  side, file, onSelect, onRemove, label,
}: {
  side: "front" | "back";
  file?: File;
  onSelect: (side: "front" | "back", file: File) => void;
  onRemove: (side: "front" | "back") => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isOver, setIsOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create preview URL when file changes
  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const onFile = (f?: File) => {
    if (f) onSelect(side, f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsOver(false);
    const f = e.dataTransfer.files?.[0];
    onFile(f);
  };

  return (
    <div
      className={`relative flex min-h-44 cursor-pointer items-center justify-center rounded-xl border border-border bg-white p-3 transition
      ${isOver ? "ring-2 ring-brand" : "hover:bg-surface"}`}
      role="button"
      tabIndex={0}
      aria-label={`${label} drop area`}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setIsOver(true); }}
      onDragLeave={() => setIsOver(false)}
      onDrop={handleDrop}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        aria-label={label}
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {!file ? (
        <div className="text-center text-sm text-muted">
          <div className="font-medium text-ink">{label}</div>
          <div>Drag & drop or click to select</div>
          <div className="mt-1 text-xs">PNG, JPG</div>
        </div>
      ) : (
        <div className="w-full">
          {/* Image preview */}
          {previewUrl && (
            <div className="mb-3 flex justify-center">
              <img
                src={previewUrl}
                alt={`${label} preview`}
                className="h-24 w-auto rounded-lg object-cover shadow-sm hover:scale-110 transition-transform duration-200"
              />
            </div>
          )}
          
          {/* File info */}
          <div className="flex items-center justify-between">
            <div className="truncate text-sm text-ink" title={file.name}>
              {file.name}
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(side); }}
              className="rounded-md border border-border px-2 py-1 text-xs text-ink hover:bg-surface"
              aria-label={`Remove ${label}`}
            >
              Remove
            </button>
          </div>
          <div className="mt-2 text-xs text-muted">
            {(file.size / 1024).toFixed(0)} KB
          </div>
        </div>
      )}
    </div>
  );
}