"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Field, FileInput } from "@/components/admin/admin-ui";

const IMAGE_ACCEPT = "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp";

type MediaAssetImageFieldsProps = {
  mediaTypeFieldId: string;
  initialMediaType: string;
  filePath?: string | null;
};

export function MediaAssetImageFields({
  mediaTypeFieldId,
  initialMediaType,
  filePath,
}: MediaAssetImageFieldsProps) {
  const [mediaType, setMediaType] = useState(initialMediaType);

  useEffect(() => {
    const select = document.getElementById(mediaTypeFieldId);

    if (!(select instanceof HTMLSelectElement)) {
      return;
    }

    const sync = () => {
      setMediaType(select.value);
    };

    sync();
    select.addEventListener("change", sync);

    return () => {
      select.removeEventListener("change", sync);
    };
  }, [mediaTypeFieldId]);

  if (mediaType !== "IMAGE") {
    return null;
  }

  return (
    <>
      {filePath ? (
        <Field label="Bild" htmlFor={`media-image-preview-${mediaTypeFieldId}`}>
          <div
            id={`media-image-preview-${mediaTypeFieldId}`}
            className="relative h-24 w-24 overflow-hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.03]"
          >
            <Image
              src={filePath}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        </Field>
      ) : null}
      <Field label="Välj bild" htmlFor={`media-image-upload-${mediaTypeFieldId}`} hint="JPG, PNG eller WebP. Max 5 MB.">
        <FileInput
          id={`media-image-upload-${mediaTypeFieldId}`}
          type="file"
          name="image"
          accept={IMAGE_ACCEPT}
        />
      </Field>
    </>
  );
}

type MediaAssetImagePreviewProps = {
  filePath: string;
  altText?: string | null;
};

export function MediaAssetImagePreview({ filePath, altText }: MediaAssetImagePreviewProps) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-[0.04em] text-print-muted">Bild</p>
      <div className="relative h-28 w-28 overflow-hidden rounded-sm border border-print-ink/10 bg-print-ink/[0.03]">
        <Image
          src={filePath}
          alt={altText?.trim() || "Uppladdad bild"}
          fill
          className="object-cover"
          sizes="112px"
        />
      </div>
    </div>
  );
}
