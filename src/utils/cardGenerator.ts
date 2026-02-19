import { toBlob } from "html-to-image";

/**
 * Pre-fetches an image URL and returns a data URL (base64).
 * Required for html-to-image which cannot load cross-origin images via SVG foreignObject.
 */
const fetchImageAsDataUrl = async (url: string): Promise<string | null> => {
    try {
        const res = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(blob);
        });
    } catch {
        return null;
    }
};

/**
 * Replaces all <img> src attributes in the element with data URLs.
 * This is necessary because html-to-image (SVG foreignObject) cannot load
 * cross-origin images — they just render as black/empty.
 */
const inlineImages = async (el: HTMLElement) => {
    const imgs = Array.from(el.querySelectorAll('img')) as HTMLImageElement[];
    await Promise.all(
        imgs.map(async (img) => {
            const src = img.getAttribute('src');
            if (!src || src.startsWith('data:')) return;
            const dataUrl = await fetchImageAsDataUrl(src);
            if (dataUrl) img.setAttribute('src', dataUrl);
        })
    );
};

/**
 * Generates a shareable image from a PlayerCard element.
 *
 * APPROACH:
 * 1. Detect which face (front/back) is currently visible
 * 2. Pre-inline all cross-origin images as data URLs (fixes blank photo issue)
 * 3. Temporarily flatten 3D transforms for html-to-image
 * 4. Capture, then restore — with transition:none to prevent flip animation on restore
 */
export const generateShareImage = async (elementId: string): Promise<Blob | null> => {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
        console.error(`Element with id ${elementId} not found`);
        return null;
    }

    const innerContainer = originalElement.querySelector('.preserve-3d') as HTMLElement | null;
    const isFlipped = innerContainer?.classList.contains('rotate-y-180') ?? false;
    const faces = innerContainer ? Array.from(innerContainer.children) as HTMLElement[] : [];
    const frontFace = faces[0] as HTMLElement | undefined;
    const backFace = faces[1] as HTMLElement | undefined;
    const rotateHint = originalElement.querySelector('.animate-pulse') as HTMLElement | null;

    // Save original inline style strings for perfect restoration
    const savedStyles = {
        outer: originalElement.getAttribute('style') ?? '',
        inner: innerContainer?.getAttribute('style') ?? '',
        front: frontFace?.getAttribute('style') ?? '',
        back: backFace?.getAttribute('style') ?? '',
    };

    const restoreStyles = () => {
        // Apply transition:none FIRST to prevent the flip animation from playing during restore
        if (innerContainer) {
            innerContainer.style.setProperty('transition', 'none', 'important');
        }
        const setOrRemove = (el: HTMLElement | null | undefined, s: string) => {
            if (!el) return;
            if (s) el.setAttribute('style', s); else el.removeAttribute('style');
        };
        setOrRemove(originalElement, savedStyles.outer);
        setOrRemove(innerContainer, savedStyles.inner);
        setOrRemove(frontFace, savedStyles.front);
        setOrRemove(backFace, savedStyles.back);
        if (rotateHint) rotateHint.style.visibility = 'visible';
        // Re-apply transition:none after style restore so the flip doesn't animate
        if (innerContainer) {
            innerContainer.style.setProperty('transition', 'none', 'important');
            // Re-enable transition after one frame
            requestAnimationFrame(() => {
                if (innerContainer) innerContainer.style.removeProperty('transition');
            });
        }
    };

    try {
        // ── STEP 1: Flatten 3D ──────────────────────────────────────────────────
        if (rotateHint) rotateHint.style.visibility = 'hidden';
        originalElement.style.perspective = 'none';

        if (innerContainer) {
            innerContainer.style.setProperty('transform', 'none', 'important');
            innerContainer.style.setProperty('transition', 'none', 'important');
            innerContainer.style.setProperty('transform-style', 'flat', 'important');
        }

        if (isFlipped) {
            if (frontFace) frontFace.style.setProperty('display', 'none', 'important');
            if (backFace) {
                backFace.style.setProperty('transform', 'none', 'important');
                backFace.style.setProperty('backface-visibility', 'visible', 'important');
                (backFace.style as any).WebkitBackfaceVisibility = 'visible';
                backFace.style.setProperty('z-index', '10', 'important');
            }
        } else {
            if (backFace) backFace.style.setProperty('display', 'none', 'important');
            if (frontFace) {
                frontFace.style.setProperty('backface-visibility', 'visible', 'important');
                (frontFace.style as any).WebkitBackfaceVisibility = 'visible';
                frontFace.style.setProperty('z-index', '10', 'important');
            }
        }

        // ── STEP 2: Pre-inline cross-origin images (prevents blank photos) ──────
        await inlineImages(originalElement);

        await new Promise(r => setTimeout(r, 50));

        // ── STEP 3: Capture ─────────────────────────────────────────────────────
        const rect = originalElement.getBoundingClientRect();
        const captureWidth = Math.round(rect.width);
        const captureHeight = Math.round(rect.height);

        const cardBlob = await toBlob(originalElement, {
            pixelRatio: 3,
            width: captureWidth,
            height: captureHeight,
            style: { transform: 'none', transition: 'none' },
            // CORS-fetched images already inlined as data URLs above
        });

        // ── STEP 4: Restore styles (no flip animation) ──────────────────────────
        restoreStyles();

        if (!cardBlob) throw new Error('html-to-image returned null blob');
        const cardBitmap = await createImageBitmap(cardBlob);

        // ── STEP 5: Compose final 1080×1620 share image ─────────────────────────
        const FINAL_WIDTH = 1080;
        const FINAL_HEIGHT = 1620;
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = FINAL_WIDTH;
        finalCanvas.height = FINAL_HEIGHT;
        const ctx = finalCanvas.getContext('2d')!;

        // Dark radial gradient background
        const gradient = ctx.createRadialGradient(
            FINAL_WIDTH / 2, FINAL_HEIGHT / 2, 0,
            FINAL_WIDTH / 2, FINAL_HEIGHT / 2, FINAL_WIDTH
        );
        gradient.addColorStop(0, '#1b1b1f');
        gradient.addColorStop(1, '#000000');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, FINAL_WIDTH, FINAL_HEIGHT);

        // Card placement
        const cardAspect = captureWidth / captureHeight;
        const targetCardWidth = FINAL_WIDTH * 0.87;
        const targetCardHeight = targetCardWidth / cardAspect;
        const cardX = (FINAL_WIDTH - targetCardWidth) / 2;
        const cardY = (FINAL_HEIGHT - targetCardHeight) / 2 - 40;

        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 100;
        ctx.shadowOffsetY = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.fillRect(cardX + 20, cardY + 20, targetCardWidth - 40, targetCardHeight - 40);
        ctx.restore();

        ctx.drawImage(cardBitmap, cardX, cardY, targetCardWidth, targetCardHeight);

        // Watermark pill
        const wmY = FINAL_HEIGHT - 80;
        const wmCenterX = FINAL_WIDTH / 2;
        const pillWidth = 220;
        const pillHeight = 44;
        const pillRadius = pillHeight / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.beginPath();
        ctx.moveTo(wmCenterX - pillWidth / 2 + pillRadius, wmY - pillHeight / 2);
        ctx.lineTo(wmCenterX + pillWidth / 2 - pillRadius, wmY - pillHeight / 2);
        ctx.arc(wmCenterX + pillWidth / 2 - pillRadius, wmY, pillRadius, -Math.PI / 2, Math.PI / 2);
        ctx.lineTo(wmCenterX - pillWidth / 2 + pillRadius, wmY + pillHeight / 2);
        ctx.arc(wmCenterX - pillWidth / 2 + pillRadius, wmY, pillRadius, Math.PI / 2, -Math.PI / 2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#0095f6';
        ctx.beginPath();
        ctx.arc(wmCenterX - 80, wmY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = '600 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('@alhockey_fans', wmCenterX - 64, wmY);
        ctx.restore();

        return new Promise((resolve) => {
            finalCanvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
        });

    } catch (error) {
        restoreStyles();
        console.error('Error generating share image:', error);
        return null;
    }
};
