import React, { useCallback, useEffect, useRef, useState } from "react";

type Props = {
  onFiles: (files: File[]) => void;       // called when user drops/selects files
  accept?: string;                        // default: "image/*"
  multiple?: boolean;                     // default: true
  className?: string;
};

export default function ImageUpload({
  onFiles,
  accept = "image/*",
  multiple = true,
  className = "",
}: Props) {
  const [isOver, setIsOver] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const arr = Array.from(files);
      if (arr.length === 0) return;
      // preview urls
      const urls = arr.map((f) => URL.createObjectURL(f));
      setPreviews((p) => [...urls, ...p].slice(0, 6));
      onFiles(arr);
    },
    [onFiles]
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const onPaste = useCallback(
    (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.files;
      if (items && items.length) {
        e.preventDefault();
        handleFiles(items);
      }
    },
    [handleFiles]
  );

  useEffect(() => {
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [onPaste]);

  useEffect(
    () => () => previews.forEach((u) => URL.revokeObjectURL(u)),
    [previews]
  );

  return (
    <div className={className}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsOver(true);
        }}
        onDragLeave={() => setIsOver(false)}
        onDrop={onDrop}
        className={
          "relative rounded-2xl border-2 border-dashed px-6 py-10 text-center " +
          (isOver
            ? "border-sky-500 bg-sky-50/60 dark:bg-sky-900/20"
            : "border-black/15 dark:border-white/15 bg-white/60 dark:bg-neutral-900/60")
        }
      >
        <input
          ref={fileInput}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="sr-only"
        />

        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-600 dark:bg-sky-900/40">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 5v14m-7-7h14"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <h3 className="text-base font-semibold">Upload image</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
          Drag & drop, <span className="font-medium">paste</span> from clipboard, or
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="ml-1 underline text-sky-600 dark:text-sky-400"
          >
            browse
          </button>
        </p>

        {/* Previews */}
        {previews.length > 0 && (
          <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {previews.map((src, i) => (
              <div key={i} className="aspect-square overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
                <img src={src} alt={`preview-${i}`} className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}

        <p className="mt-4 text-[11px] text-slate-400 dark:text-neutral-500">
          JPEG, PNG, or WEBP. Max ~10MB per file.
        </p>
      </div>
    </div>
  );
}
