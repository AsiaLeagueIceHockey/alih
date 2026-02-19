import h2c from "html2canvas";

/**
 * Generates a shareable image from a PlayerCard element.
 *
 * FINAL APPROACH:
 * - html2canvas (Canvas drawImage) correctly handles cross-origin images with useCORS:true
 * - html-to-image (SVG foreignObject) CANNOT render cross-origin images - abandoned
 *
 * 3D CSS issue workaround:
 * - Clone ONLY the visible face element (front or back Card)
 * - Strip all 3D / absolute-positioning CSS from the clone
 * - Place it in an off-screen container matching the card's rendered size
 * - Capture it with html2canvas — never touch the original element
 */
export const generateShareImage = async (elementId: string): Promise<Blob | null> => {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
        console.error(`Element with id ${elementId} not found`);
        return null;
    }

    try {
        // 1. Detect which face is visible
        const innerContainer = originalElement.querySelector('.preserve-3d');
        const isFlipped = innerContainer?.classList.contains('rotate-y-180') ?? false;
        const faces = innerContainer ? Array.from(innerContainer.children) as HTMLElement[] : [];
        const visibleFace = isFlipped ? faces[1] : faces[0];

        if (!visibleFace) {
            console.error('Could not find visible card face');
            return null;
        }

        // 2. Get the actual rendered card dimensions
        const rect = originalElement.getBoundingClientRect();
        const captureWidth = Math.round(rect.width);
        const captureHeight = Math.round(rect.height);

        // 3. Deep-clone the visible face only
        const faceClone = visibleFace.cloneNode(true) as HTMLElement;

        // 4. Set crossOrigin=anonymous on all img tags in the clone
        //    so html2canvas can draw them via Canvas without tainting it
        Array.from(faceClone.querySelectorAll('img')).forEach((img) => {
            img.crossOrigin = 'anonymous';
        });

        // 5. Flatten all 3D / absolute positioning from the clone
        
        //    IMPORTANT: Do NOT use cssText, it wipes out inline styles like backgroundColor!
        //    We use setProperty to override layout-affecting properties only.
        faceClone.style.setProperty('position', 'relative', 'important');
        faceClone.style.setProperty('transform', 'none', 'important');
        faceClone.style.setProperty('transition', 'none', 'important');
        faceClone.style.setProperty('backface-visibility', 'visible', 'important');
        (faceClone.style as any)['WebkitBackfaceVisibility'] = 'visible';
        
        // Force dimensions to match rendered size
        faceClone.style.setProperty('width', `${captureWidth}px`, 'important');
        faceClone.style.setProperty('height', `${captureHeight}px`, 'important');
        
        // Reset positioning that might interfere
        faceClone.style.setProperty('top', 'auto', 'important');
        faceClone.style.setProperty('left', 'auto', 'important');
        faceClone.style.setProperty('right', 'auto', 'important');
        faceClone.style.setProperty('bottom', 'auto', 'important');
        faceClone.style.setProperty('inset', 'auto', 'important');
        faceClone.style.setProperty('z-index', 'auto', 'important');
        faceClone.style.setProperty('margin', '0', 'important');

        // Strip Tailwind classes that fight our inline styles
        ['absolute', 'inset-0', 'rotate-y-180', 'backface-hidden'].forEach(cls => {
            faceClone.classList.remove(cls);
        });

        // Hide the rotate hint icon inside the clone
        const rotateHintInClone = faceClone.querySelector('.animate-pulse') as HTMLElement | null;
        if (rotateHintInClone) rotateHintInClone.style.display = 'none';

        // FIX 1: Geometry Freezing - Force images to match exact rendered dimensions
        // This prevents the "stretched image" issue by bypassing CSS aspect ratio calculations
        const originalImages = visibleFace.querySelectorAll('img');
        const clonedImages = faceClone.querySelectorAll('img');
        originalImages.forEach((img, index) => {
             const rect = img.getBoundingClientRect();
             const clone = clonedImages[index];
             if (clone) {
                 clone.style.width = `${rect.width}px`;
                 clone.style.height = `${rect.height}px`;
                 clone.style.objectFit = 'cover'; // Mostly cover, logo might need contain but geometry freeze handles the box size
                 if (img.classList.contains('object-contain')) {
                     clone.style.objectFit = 'contain';
                 }
                 clone.style.maxWidth = 'none'; // reset
                 clone.style.maxHeight = 'none'; // reset
             }
        });

        // FIX 2: Prevent vertical stretching on Back Face (disable flex-grow)
        const flexGrowers = faceClone.querySelectorAll('.flex-1');
        flexGrowers.forEach((el) => {
            (el as HTMLElement).style.flex = '0 0 auto';
            (el as HTMLElement).style.height = 'auto';
            // Also force gap for inner elements if it's the number container
            if (el.textContent?.includes('#')) { 
                 (el as HTMLElement).style.gap = '0px'; 
                 // Fix potentially huge line-height on the number
                 const bigText = el.querySelector('.text-8xl');
                 if (bigText) (bigText as HTMLElement).style.lineHeight = '1';
                 const nameText = el.querySelector('.text-xl');
                 if (nameText) (nameText as HTMLElement).style.marginBottom = '20px';
            }
        });

        // FIX 3: Front Face Layout (Badge overlap)
        // Find the container that holds Badge and Number
        const badge = faceClone.querySelector('.rounded-full.border') as HTMLElement;
        if (badge) {
            // Fix Badge Alignment
            badge.style.display = 'inline-flex';
            badge.style.alignItems = 'center';
            badge.style.justifyContent = 'center';
            badge.style.lineHeight = '0';
            
            // Fix Badge Container Structure
            const badgeContainer = badge.parentElement;
            if (badgeContainer) {
                badgeContainer.style.display = 'flex';
                badgeContainer.style.alignItems = 'center';
                badgeContainer.style.gap = '12px'; // Force gap between Badge and Number
                badgeContainer.style.marginBottom = '8px'; // Force space below Badge row
            }

            // Fix Name overlap (find the name element, usually next sibling or close)
            // It's the big text container below the badge row
            // We can try to find it by class text-5xl
            const nameEl = faceClone.querySelector('.text-5xl') as HTMLElement;
            if (nameEl) {
                nameEl.style.display = 'block';
                nameEl.style.marginTop = '10px';
                nameEl.style.position = 'relative'; // Ensure z-index works if needed
            }
        }

        // 6. Mount clone in an off-screen container
        const offscreen = document.createElement('div');
        offscreen.style.cssText = `
            position: fixed;
            top: -99999px;
            left: -99999px;
            width: ${captureWidth}px;
            height: ${captureHeight}px;
            overflow: hidden;
        `;
        offscreen.appendChild(faceClone);
        document.body.appendChild(offscreen);

        // Wait for fonts & images to settle
        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 1000));

        // 7. Capture with html2canvas (handles cross-origin images correctly)
        const cardCanvas = await h2c(offscreen, {
            backgroundColor: null,
            scale: 3,
            useCORS: true,
            allowTaint: false,
            logging: false,
            width: captureWidth,
            height: captureHeight,
        });

        // 8. Remove off-screen element
        document.body.removeChild(offscreen);

        // 9. Compose final 1080×1620 share image
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

        // Drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.65)';
        ctx.shadowBlur = 100;
        ctx.shadowOffsetY = 50;
        ctx.fillStyle = 'rgba(0,0,0,0.01)';
        ctx.fillRect(cardX + 20, cardY + 20, targetCardWidth - 40, targetCardHeight - 40);
        ctx.restore();

        ctx.drawImage(cardCanvas, cardX, cardY, targetCardWidth, targetCardHeight);

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
        console.error('Error generating share image:', error);
        return null;
    }
};
