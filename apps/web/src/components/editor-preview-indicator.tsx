"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type EditorPreviewIndicatorProps = {
  locale: string;
};

export function EditorPreviewIndicator({ locale }: EditorPreviewIndicatorProps) {
  const pathname = usePathname() || `/${locale}`;
  const exitHref = `/api/preview/exit?path=${encodeURIComponent(pathname)}&locale=${encodeURIComponent(locale)}`;

  return (
    <div className="editor-preview-indicator" role="status" aria-live="polite">
      <div className="editor-preview-copy">
        <span className="editor-preview-kicker">Editor preview</span>
        <p>Draft and review content are visible only inside this authenticated preview session.</p>
      </div>
      <Link className="editor-preview-link" href={exitHref}>
        Exit preview
      </Link>
    </div>
  );
}
