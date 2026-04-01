import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share, Plus, Check } from "lucide-react";

interface InstallGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const InstallGuideModal = ({ open, onOpenChange }: InstallGuideModalProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center">
            {t("installPrompt.modalTitle")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-center">
            {t("installPrompt.modalDescription")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Step 1 - 공유 버튼 */}
          <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/30">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Share className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Step 1</p>
              <p className="text-sm text-muted-foreground">
                {t("installPrompt.step1")}
              </p>
            </div>
          </div>

          {/* Step 2 - 홈 화면에 추가 */}
          <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/30">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Plus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Step 2</p>
              <p className="text-sm text-muted-foreground">
                {t("installPrompt.step2")}
              </p>
            </div>
          </div>

          {/* Step 3 - 추가 완료 */}
          <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/30">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">Step 3</p>
              <p className="text-sm text-muted-foreground">
                {t("installPrompt.step3")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            variant="default"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {t("installPrompt.confirm")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InstallGuideModal;
