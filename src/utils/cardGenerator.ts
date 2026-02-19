import { toBlob } from "html-to-image";

/**
 * Generates a shareable image from a PlayerCard element.
 *
 * APPROACH:
 * 1. Detect which face (front/back) is currently visible
 * 2. Temporarily flatten 3D transforms so html-to-image can render correctly
 * 3. Capture using html-to-image (SVG foreignObject — much better CSS support)
 * 4. Immediately restore all original styles
 * 5. Compose the final 1080×1620 share image
 */
export const generateShareImage = async (elementId: string): Promise<Blob | null> => {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
        console.error(`Element with id ${elementId} not found`);
        return null;
    }

    // Collect all elements we will temporarily modify
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
        const setOrRemove = (el: HTMLElement | null | undefined, s: string) => {
            if (!el) return;
            if (s) el.setAttribute('style', s); else el.removeAttribute('style');
        };
        setOrRemove(originalElement, savedStyles.outer);
        setOrRemove(innerContainer, savedStyles.inner);
        setOrRemove(frontFace, savedStyles.front);
        setOrRemove(backFace, savedStyles.back);
        if (rotateHint) rotateHint.style.visibility = 'visible';
    };

    try {
        // ── STEP 1: Flatten 3D for capture ──────────────────────────────────────
        // Hide UI-only rotate hint
        if (rotateHint) rotateHint.style.visibility = 'hidden';

        // Remove perspective from outer wrapper
        originalElement.style.perspective = 'none';

        // Flatten the 3D container
        if (innerContainer) {
            innerContainer.style.setProperty('transform', 'none', 'important');
            innerContainer.style.setProperty('transition', 'none', 'important');
            innerContainer.style.setProperty('transform-style', 'flat', 'important');
        }

        if (isFlipped) {
            // Show back, hide front
            if (frontFace) {
                frontFace.style.setProperty('display', 'none', 'important');
            }
            if (backFace) {
                backFace.style.setProperty('transform', 'none', 'important');
                backFace.style.setProperty('backface-visibility', 'visible', 'important');
                (backFace.style as any)['WebkitBackfaceVisibility'] = 'visible';
                backFace.style.setProperty('z-index', '10', 'important');
            }
        } else {
            // Show front, hide back
            if (backFace) {
                backFace.style.setProperty('display', 'none', 'important');
            }
            if (frontFace) {
                frontFace.style.setProperty('backface-visibility', 'visible', 'important');
                (frontFace.style as any)['WebkitBackfaceVisibility'] = 'visible';
                frontFace.style.setProperty('z-index', '10', 'important');
            }
        }

        // Brief pause for browser to reflow
        await new Promise(r => setTimeout(r, 50));

        // ── STEP 2: Capture with html-to-image ──────────────────────────────────
        const rect = originalElement.getBoundingClientRect();
        const captureWidth = Math.round(rect.width);
        const captureHeight = Math.round(rect.height);

        const cardBlob = await toBlob(originalElement, {
            pixelRatio: 3,
            width: captureWidth,
            height: captureHeight,
            style: {
                transform: 'none',
                transition: 'none',
            },
        });

        // ── STEP 3: Immediately restore original styles ──────────────────────────
        restoreStyles();

        if (!cardBlob) throw new Error('html-to-image returned null blob');

        // Convert blob to ImageBitmap for drawing on canvas
        const cardBitmap = await createImageBitmap(cardBlob);

        // ── STEP 4: Compose final 1080×1620 image ───────────────────────────────
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

        // Card placement — 87% width, centered, shifted up for watermark
        const cardAspect = captureWidth / captureHeight;
        const targetCardWidth = FINAL_WIDTH * 0.87;
        const targetCardHeight = targetCardWidth / cardAspect;
        const cardX = (FINAL_WIDTH - targetCardWidth) / 2;
        const cardY = (FINAL_HEIGHT - targetCardHeight) / 2 - 40;

        // Subtle drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 100;
        ctx.shadowOffsetY = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.fillRect(cardX + 20, cardY + 20, targetCardWidth - 40, targetCardHeight - 40);
        ctx.restore();

        // Draw the captured card
        ctx.drawImage(cardBitmap, cardX, cardY, targetCardWidth, targetCardHeight);

        // Watermark pill at bottom
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
        // Always restore original styles even on error
        restoreStyles();
        console.error('Error generating share image:', error);
        return null;
    }
};
