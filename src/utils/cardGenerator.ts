import { toPng } from 'html-to-image';

/**
 * Helper: Converts all images in a DOM element to Base64 in-place.
 * This bypasses CORS strictness in SVG <foreignObject> rendering.
 */
async function convertImagesToBase64(element: HTMLElement) {
    const images = Array.from(element.querySelectorAll('img'));
    
    // Process all images in parallel
    await Promise.all(images.map(async (img) => {
        const src = img.src || img.getAttribute('src');
        if (!src || src.startsWith('data:')) return; // Already base64 or empty

        try {
            // Fetch blob with CORS
            const response = await fetch(src, { 
                mode: 'cors', 
                credentials: 'omit', // Important for public Supabase buckets often
                cache: 'no-cache'
            });
            
            if (!response.ok) throw new Error(`Failed to fetch ${src}`);

            const blob = await response.blob();
            
            // Convert to Base64
            await new Promise<void>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    if (reader.result) {
                        img.src = reader.result as string;
                        img.srcset = ''; // Clear srcset to prioritize base64 src
                        img.crossOrigin = null; // Remove CORS attribute from data-uri image
                        resolve();
                    } else {
                        reject(new Error('Empty result from FileReader'));
                    }
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.warn('Base64 conversion failed for:', src, err);
            // On failure, keep original src and hope for the best (usually fails silently in canvas)
        }
    }));
}

/**
 * Generates a shareable image from a PlayerCard element.
 * 
 * FINAL FINAL APPROACH:
 * - Use `html-to-image` (SVG foreignObject) for pixel-perfect layout fidelity.
 * - PRE-FETCH all images and convert to Base64 to solve CORS issues.
 * - Capture ONLY the visible face by cloning and stripping 3D transforms.
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

        // 2. Get dimensions
        const rect = originalElement.getBoundingClientRect();
        const captureWidth = Math.round(rect.width);
        const captureHeight = Math.round(rect.height);

        // 3. Deep-clone the visible face
        const faceClone = visibleFace.cloneNode(true) as HTMLElement;

        // 4. Flatten 3D styles and reset positioning
        // We use setProperty with !important to override Tailwind classes reliably
        faceClone.style.setProperty('position', 'relative', 'important');
        faceClone.style.setProperty('transform', 'none', 'important');
        faceClone.style.setProperty('transition', 'none', 'important');
        faceClone.style.setProperty('backface-visibility', 'visible', 'important');
        faceClone.style.setProperty('margin', '0', 'important');
        faceClone.style.setProperty('width', `${captureWidth}px`, 'important');
        faceClone.style.setProperty('height', `${captureHeight}px`, 'important');
        
        // Remove 3D utility classes that interferes with flat rendering
        ['absolute', 'inset-0', 'rotate-y-180', 'backface-hidden'].forEach(cls => {
            faceClone.classList.remove(cls);
        });

        // Hide UI elements not needed for capture (like rotate hint)
        const rotateHint = faceClone.querySelector('.animate-pulse');
        if (rotateHint) (rotateHint as HTMLElement).style.display = 'none';

        // 5. Mount to offscreen container (required for html-to-image to render)
        const wrapper = document.createElement('div');
        wrapper.style.position = 'fixed';
        wrapper.style.top = '-9999px';
        wrapper.style.left = '-9999px';
        wrapper.style.width = `${captureWidth}px`;
        wrapper.style.height = `${captureHeight}px`;
        wrapper.style.overflow = 'hidden'; // Clip slight overflows
        wrapper.appendChild(faceClone);
        document.body.appendChild(wrapper);

        // 6. Convert all images in clone to Base64 (Essential for CORS support in SVG)
        await convertImagesToBase64(faceClone);

        // Wait a tiny bit for DOM update
        await new Promise(r => setTimeout(r, 100));

        // 7. Generate PNG via html-to-image
        // Use a higher pixel ratio for crisp text
        const dataUrl = await toPng(faceClone, {
            quality: 1.0,
            pixelRatio: 3,
            width: captureWidth,
            height: captureHeight,
            skipAutoScale: true,
            filter: (node) => {
                // Exclude any known problem elements if needed
                return true; 
            }
        });

        // 8. Cleanup DOM
        document.body.removeChild(wrapper);

        if (!dataUrl) {
            console.error('Failed to generate PNG data URL');
            return null;
        }

        // 9. Load the captured card image
        const cardImg = new Image();
        cardImg.src = dataUrl;
        await new Promise((resolve) => { cardImg.onload = resolve; });

        // 10. Compose Final Image (1080x1620)
        const FINAL_WIDTH = 1080;
        const FINAL_HEIGHT = 1620;
        const canvas = document.createElement('canvas');
        canvas.width = FINAL_WIDTH;
        canvas.height = FINAL_HEIGHT;
        const ctx = canvas.getContext('2d')!;

        // Background
        const grad = ctx.createRadialGradient(
            FINAL_WIDTH / 2, FINAL_HEIGHT / 2, 0,
            FINAL_WIDTH / 2, FINAL_HEIGHT / 2, FINAL_WIDTH
        );
        grad.addColorStop(0, '#1b1b1f');
        grad.addColorStop(1, '#000000');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, FINAL_WIDTH, FINAL_HEIGHT);

        // Layout calcs
        const targetWidth = FINAL_WIDTH * 0.87;
        const scaleFactor = targetWidth / cardImg.width;
        const targetHeight = cardImg.height * scaleFactor;
        const x = (FINAL_WIDTH - targetWidth) / 2;
        const y = (FINAL_HEIGHT - targetHeight) / 2 - 40;

        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)';
        ctx.shadowBlur = 80;
        ctx.shadowOffsetY = 40;
        ctx.fillRect(x + 30, y + 30, targetWidth - 60, targetHeight - 60);
        ctx.restore();

        // Draw Card
        ctx.drawImage(cardImg, x, y, targetWidth, targetHeight);

        // Watermark
        const wmY = FINAL_HEIGHT - 80;
        const wmCenterX = FINAL_WIDTH / 2;
        const pillWidth = 220;
        const pillHeight = 44;
        const pillRadius = pillHeight / 2;

        ctx.save();
        ctx.fillStyle = 'rgba(20, 20, 20, 0.85)';
        ctx.beginPath();
        ctx.roundRect(wmCenterX - pillWidth / 2, wmY - pillHeight / 2, pillWidth, pillHeight, pillRadius);
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
            canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0);
        });

    } catch (error) {
        console.error('Error generating share image (html-to-image):', error);
        return null;
    }
};
