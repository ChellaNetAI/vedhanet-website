"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { createUploadTarget } from "@/app/admin/actions";

export function FileUploadField({
  bucket,
  label,
  accept,
  hiddenFieldName,
}: {
  bucket: "videos" | "shorts" | "documents";
  label: string;
  accept: string;
  hiddenFieldName: string;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [path, setPath] = useState("");
  const [fileName, setFileName] = useState("");

  async function handleFile(file: File) {
    setStatus("uploading");
    setFileName(file.name);
    try {
      const { path: targetPath, token } = await createUploadTarget(bucket, file.name);
      const supabase = createClient();
      const { error } = await supabase.storage
        .from(bucket)
        .uploadToSignedUrl(targetPath, token, file);

      if (error) throw error;

      setPath(targetPath);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="file"
        accept={accept}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
        }}
        className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-dark"
      />
      {status === "uploading" && (
        <p className="mt-1 text-xs text-gray-500">Uploading {fileName}…</p>
      )}
      {status === "done" && (
        <p className="mt-1 text-xs text-emerald-600">Uploaded {fileName} ✓</p>
      )}
      {status === "error" && (
        <p className="mt-1 text-xs text-red-600">Upload failed — try again.</p>
      )}
      <input type="hidden" name={hiddenFieldName} value={path} />
    </div>
  );
}
