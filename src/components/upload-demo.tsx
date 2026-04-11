"use client";

import { useMemo, useState } from "react";

export function UploadDemo() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [dragActive, setDragActive] = useState(false);

  const helperText = useMemo(() => {
    if (fileName) return `Ready to analyze: ${fileName}`;
    return "Upload a food photo or drag one here. The first production version should immediately show a local preview before analysis.";
  }, [fileName]);

  function applyFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;

    const nextUrl = URL.createObjectURL(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return nextUrl;
    });
    setFileName(file.name);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
      <label
        className={`block rounded-2xl border-2 border-dashed p-4 transition ${
          dragActive
            ? "border-emerald-400 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragActive(false);
          applyFile(event.dataTransfer.files?.[0] ?? null);
        }}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(event) => applyFile(event.target.files?.[0] ?? null)}
        />

        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#dbeafe,#dcfce7)] text-center">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Food preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="px-6">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                Upload or camera capture
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">Drop a meal photo here</p>
              <p className="mt-2 text-sm text-slate-600">
                JPG, PNG, HEIC support can be normalized client-side before upload.
              </p>
            </div>
          )}
        </div>
      </label>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm leading-6 text-slate-600">{helperText}</p>
        <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Preview first
        </div>
      </div>
    </div>
  );
}
