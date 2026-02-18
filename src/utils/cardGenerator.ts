import h2c from "html2canvas";
import { Player, Team, PlayerCard } from "@/types/team";

interface GenerateShareImageOptions {
  cardElementId: string; // We still need the element to clone styles/images from? 
                         // Actually, capturing the *existing* DOM is easier than re-rendering from scratch
                         // BUT, we want a specific 9:16 layout.
                         // So we should probably mount a temporary invisible component? 
                         // Or, we can just "fake" it by capturing the card twice (front/back) 
                         // and composing them on a canvas.
  
  // New approach: Pass the data needed to render (or just use the existing card element to capture images)
  // Let's try capturing the existing card element (Front) and then forcing it to flip (Back) and capturing again?
  // That might be jarring for the user.
  
  // Better: Create a hidden container off-screen with the desired layout, populated with the card data.
  // However, reusing the complex PlayerCard component inside a hidden div is tricky with React.
  
  // Alternative: Take the existing card element, clone it deeply.
  // Mount the clone in a hidden container 1080x1920.
  // duplicate the clone for the back.
}

export const generateShareImage = async (elementId: string): Promise<Blob | null> => {
    const originalElement = document.getElementById(elementId);
    if (!originalElement) {
        console.error(`Element with id ${elementId} not found`);
        return null;
    }

    try {
        // 1. Determine which side is visible
        // In PlayerCard.tsx, the inner container has 'rotate-y-180' when flipped.
        // Structure: div#id > div.preserve-3d.rotate-y-180 (if flipped)
        const innerContainer = originalElement.querySelector('.preserve-3d');
        const isFlipped = innerContainer?.classList.contains('rotate-y-180');

        // 2. Clone the card for manipulation
        const clone = originalElement.cloneNode(true) as HTMLElement;
        clone.style.transform = 'none';
        clone.style.transition = 'none';
        
        // Internal Capture Size: High resolution to prevent layout shifts/blur
        // 2:3 Ratio -> 800w x 1200h
        const CAPTURE_WIDTH = 800;
        const CAPTURE_HEIGHT = 1200;
        
        clone.style.width = `${CAPTURE_WIDTH}px`; 
        clone.style.height = `${CAPTURE_HEIGHT}px`; 
        
        const cloneInner = clone.querySelector('.preserve-3d') as HTMLElement;
        if (cloneInner) {
            cloneInner.style.transition = 'none';
            cloneInner.style.transform = 'none';
            cloneInner.classList.remove('rotate-y-180'); // Reset container flip
        }

        // 3. Isolate the target face
        const faces = cloneInner ? Array.from(cloneInner.children) as HTMLElement[] : [];

        if (isFlipped) {
            // Find the back face
            const backFace = faces.find(el => el.classList.contains('rotate-y-180')) || faces[1];
            if (backFace) {
                backFace.style.transform = 'none'; // Un-rotate the back face
                backFace.classList.remove('rotate-y-180');
                backFace.style.zIndex = '100'; // Ensure it's on top
                
                // Hide others
                faces.forEach(f => {
                    if (f !== backFace) f.style.opacity = '0';
                });
            }
        } else {
            // Front face logic
             const backFace = faces.find(el => el.classList.contains('rotate-y-180')) || faces[1];
             if (backFace) {
                 backFace.style.display = 'none'; // Just hide the back entirely
             }
        }
        
        // Mount clone to stage
        const stage = document.createElement('div');
        stage.style.position = 'fixed';
        stage.style.top = '-9999px';
        stage.style.left = '-9999px';
        // Stage with some buffer
        stage.style.width = `${CAPTURE_WIDTH + 100}px`; 
        stage.style.height = `${CAPTURE_HEIGHT + 100}px`;
        stage.appendChild(clone);
        document.body.appendChild(stage);
        
        // Wait for styles/fonts to settle
        await document.fonts.ready;
        await new Promise(r => setTimeout(r, 300));

        // Capture the Card (Clean Source)
        const cardCanvas = await h2c(clone, {
            backgroundColor: null,
            scale: 2, 
            useCORS: true,
            logging: false,
        });
        
        document.body.removeChild(stage);


        // --- 4. Compose Final Share Image (2:3 Ratio) ---
        // Target: 1080 x 1620 (Standard Poster/Card Ratio)
        const FINAL_WIDTH = 1080;
        const FINAL_HEIGHT = 1620; // 2:3 Aspect Ratio
        
        const container = document.createElement('div');
        container.style.position = 'fixed';
        container.style.top = '-9999px';
        container.style.left = '-9999px';
        container.style.width = `${FINAL_WIDTH}px`;
        container.style.height = `${FINAL_HEIGHT}px`;
        container.style.background = '#09090b'; 
        container.style.background = 'radial-gradient(circle at center, #1b1b1f 0%, #000000 100%)';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        container.style.justifyContent = 'center';
        // Prevent any flex shrinking
        container.style.flexShrink = '0';
        
        document.body.appendChild(container);

        // Add Card Image
        // We want the card to fill most of the image, leaving just enough room for the watermark.
        // Card is 2:3. Container is 2:3.
        // Scale card down slightly (e.g. 90%) to have a nice border
        const cardImg = new Image();
        cardImg.src = cardCanvas.toDataURL('image/png');
        cardImg.style.width = '940px'; // Approx 87% of width
        cardImg.style.height = 'auto'; // Maintain aspect ratio
        cardImg.style.borderRadius = '36px';
        cardImg.style.boxShadow = '0 60px 120px rgba(0,0,0,0.7)';
        // Shift card up slightly to make room for watermark bottom
        cardImg.style.marginBottom = '60px'; 
        container.appendChild(cardImg);

        // Instagram Style Watermark
        const watermark = document.createElement('div');
        watermark.style.position = 'absolute';
        watermark.style.bottom = '50px'; // Closer to bottom edge
        watermark.style.left = '50%';
        watermark.style.transform = 'translateX(-50%)'; // Perfect centering
        
        watermark.style.display = 'flex';
        watermark.style.alignItems = 'center';
        watermark.style.padding = '12px 24px';
        watermark.style.background = 'rgba(20, 20, 20, 0.85)'; // Slightly more transparent/darker
        watermark.style.backdropFilter = 'blur(10px)';
        watermark.style.borderRadius = '30px';
        watermark.style.gap = '12px';
        watermark.style.boxShadow = '0 10px 30px rgba(0,0,0,0.5)';
        // watermark.style.border = '1px solid rgba(255,255,255,0.1)';
        
        const blueDot = document.createElement('div');
        blueDot.style.width = '12px';
        blueDot.style.height = '12px';
        blueDot.style.borderRadius = '50%';
        blueDot.style.background = '#0095f6';
        watermark.appendChild(blueDot);

        const text = document.createElement('span');
        text.innerText = '@alhockey_fans';
        text.style.color = '#ffffff';
        text.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
        text.style.fontSize = '20px';
        text.style.fontWeight = '600';
        text.style.letterSpacing = '0.5px';
        watermark.appendChild(text);

        container.appendChild(watermark);

        // Final Capture
        const finalCanvas = await h2c(container, {
            scale: 1,
            width: FINAL_WIDTH,
            height: FINAL_HEIGHT,
            useCORS: true,
            logging: false,
        });

        document.body.removeChild(container);

        return new Promise((resolve) => {
            finalCanvas.toBlob((blob) => {
                resolve(blob);
            }, 'image/png', 1.0);
        });

    } catch (error) {
        console.error("Error generating share image:", error);
        return null;
    }
};

