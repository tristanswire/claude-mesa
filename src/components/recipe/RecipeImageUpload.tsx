"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import {
  uploadRecipeImageAction,
  removeRecipeImageAction,
} from "@/lib/actions/recipeImages";
import { Button } from "@/components/ui/Button";

interface RecipeImageUploadProps {
  recipeId: string;
  currentImageUrl?: string;
}

export function RecipeImageUpload({
  recipeId,
  currentImageUrl,
}: RecipeImageUploadProps) {
  const [imageUrl, setImageUrl] = useState<string | undefined>(currentImageUrl);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, startUpload] = useTransition();
  const [isRemoving, startRemove] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    startUpload(async () => {
      const formData = new FormData();
      formData.append("image", file);

      const result = await uploadRecipeImageAction(recipeId, formData);

      if (!result.success) {
        setError(result.error);
      } else {
        setImageUrl(result.imageUrl);
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    });
  };

  const handleRemove = () => {
    setError(null);

    startRemove(async () => {
      const result = await removeRecipeImageAction(recipeId);

      if (!result.success) {
        setError(result.error || "Failed to remove image");
      } else {
        setImageUrl(undefined);
      }
    });
  };

  const isPending = isUploading || isRemoving;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-foreground">
        Recipe Image
      </label>

      {error && (
        <div className="bg-error/10 border border-error/30 text-error text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {imageUrl ? (
        <div className="space-y-3">
          {/* Image preview */}
          <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-border">
            <Image
              src={imageUrl}
              alt="Recipe image"
              fill
              className="object-cover"
              sizes="(max-width: 384px) 100vw, 384px"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending}
            >
              {isUploading ? "Uploading..." : "Replace Image"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemove}
              disabled={isPending}
              className="text-error hover:text-error hover:bg-error/10"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upload area */}
          <div
            onClick={() => !isPending && fileInputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center
              w-full max-w-sm aspect-video
              border-2 border-dashed border-border rounded-xl
              bg-surface-2 hover:bg-surface cursor-pointer
              transition-colors
              ${isPending ? "opacity-50 cursor-not-allowed" : ""}
            `}
          >
            {isUploading ? (
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted">Uploading...</p>
              </div>
            ) : (
              <>
                <svg
                  className="w-10 h-10 text-muted mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
                  />
                </svg>
                <p className="text-sm text-muted">Click to upload an image</p>
                <p className="text-xs text-muted mt-1">JPG, PNG, WebP (max 5MB)</p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isPending}
      />
    </div>
  );
}
