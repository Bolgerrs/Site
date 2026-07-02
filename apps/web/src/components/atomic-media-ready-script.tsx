"use client";

import { useEffect } from "react";

const ATOMIC_MEDIA_SELECTOR = "img[data-atomic-media]";

function markReady(image: HTMLImageElement) {
  image.classList.add("is-media-ready");
}

async function decodeImage(image: HTMLImageElement) {
  if (image.classList.contains("is-media-ready")) {
    return;
  }

  if (!image.complete) {
    await new Promise<void>((resolve) => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  }

  if (typeof image.decode === "function") {
    try {
      await image.decode();
    } catch {
      // Broken assets should still reveal their fallback box instead of staying invisible.
    }
  }

  requestAnimationFrame(() => markReady(image));
}

export function AtomicMediaReadyScript() {
  useEffect(() => {
    const images = new Set<HTMLImageElement>();

    const queueImage = (image: HTMLImageElement) => {
      if (images.has(image)) {
        return;
      }

      images.add(image);
      void decodeImage(image);
    };

    document.querySelectorAll<HTMLImageElement>(ATOMIC_MEDIA_SELECTOR).forEach(queueImage);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof HTMLElement)) {
            return;
          }

          if (node.matches(ATOMIC_MEDIA_SELECTOR)) {
            queueImage(node as HTMLImageElement);
          }

          node.querySelectorAll<HTMLImageElement>(ATOMIC_MEDIA_SELECTOR).forEach(queueImage);
        });
      });
    });

    observer.observe(document.documentElement, { childList: true, subtree: true });

    const fallback = window.setTimeout(() => {
      document.querySelectorAll<HTMLImageElement>(ATOMIC_MEDIA_SELECTOR).forEach(markReady);
    }, 7000);

    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
  }, []);

  return null;
}
