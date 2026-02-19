import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Instagram, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { generateShareImage } from "@/utils/cardGenerator";
import { toast } from "sonner";

interface InstagramShareButtonProps {
  cardElementId: string;
  className?: string;
}

const InstagramShareButton = ({ cardElementId, className }: InstagramShareButtonProps) => {
  const { t } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleShare = async () => {
    setIsGenerating(true);

    try {
      const blob = await generateShareImage(cardElementId);

      if (!blob) {
        throw new Error("Failed to generate Image");
      }

      const file = new File([blob], "alih-player-card.png", { type: "image/png" });
      
      // Native Share (Mobile)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Asia League Player Card",
        });
      } else {
        // Fallback Download (Desktop)
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "alih-player-card.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success(t('share.downloaded', 'Image downloaded! Share it on your Story!'));
      }
    } catch (error: any) {
      // AbortError = user cancelled the share sheet — not a failure
      if (error?.name === 'AbortError') return;
      console.error("Share failed:", error);
      toast.error(t('share.failed', 'Failed to generate image'));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
       onClick={handleShare}
       disabled={isGenerating}
       className={`bg-gradient-to-r from-[#833ab4] via-[#fd1d1d] to-[#fcb045] hover:opacity-90 text-white border-0 ${className}`}
    >
        {isGenerating ? (
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.saving', '저장 중...')}
            </>
        ) : (
            <>
                <Instagram className="w-4 h-4 mr-2" />
                {t('share.instagram', 'Share on Profile')}
            </>
        )}
    </Button>
  );
};

export default InstagramShareButton;
