"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { cn, formatFileSize, getFileType } from "@/lib/utils";
import { MAX_UPLOAD_SIZE_BYTES } from "@/lib/constants";
import { UploadedFile } from "@/types";

interface FileUploadProps {
  files: UploadedFile[];
  onFilesAdded: (files: UploadedFile[]) => void;
  onFileRemoved: (id: string) => void;
}

const FILE_ICONS: Record<string, string> = {
  pdf: "📄",
  image: "🖼️",
  docx: "📝",
  text: "📃",
};

export function FileUpload({
  files,
  onFilesAdded,
  onFileRemoved,
}: FileUploadProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: UploadedFile[] = [];
      for (const file of acceptedFiles) {
        const fileType = getFileType(file.name);
        let content = "";
        if (fileType === "text" || fileType === "docx") {
          try {
            content = await file.text();
          } catch {
            content = "";
          }
        } else if (fileType === "pdf") {
          // For PDF, we read as data URL to send to API
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        } else if (fileType === "image") {
          content = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        newFiles.push({
          id: `file_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          name: file.name,
          type: fileType,
          size: file.size,
          content,
        });
      }
      onFilesAdded(newFiles);
    },
    [onFilesAdded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".jpg", ".jpeg", ".png", ".gif", ".webp"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxSize: MAX_UPLOAD_SIZE_BYTES,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200",
          isDragActive
            ? "border-blue-500 bg-blue-50 scale-[1.01]"
            : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50/30"
        )}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📁</div>
        {isDragActive ? (
          <p className="text-blue-600 font-semibold">Drop files here...</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-1">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-gray-400">
              Accepts PDF, Word (DOCX), TXT, JPG, PNG — up to 10 MB each
            </p>
          </>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">
            {files.length} file{files.length !== 1 ? "s" : ""} added
          </p>
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{FILE_ICONS[file.type]}</span>
                <div>
                  <p className="text-sm font-medium text-gray-800 truncate max-w-xs">
                    {file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {file.type.toUpperCase()} · {formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onFileRemoved(file.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded"
                aria-label="Remove file"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
