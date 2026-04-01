import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SiteFooter = () => {
  const { i18n } = useTranslation();

  const copy = {
    ko: {
      privacy: "개인정보처리방침",
      terms: "서비스 이용약관",
    },
    ja: {
      privacy: "プライバシーポリシー",
      terms: "利用規約",
    },
    en: {
      privacy: "Privacy Policy",
      terms: "Terms of Service",
    },
  } as const;

  const locale = i18n.language === "ja" ? "ja" : i18n.language === "en" ? "en" : "ko";
  const text = copy[locale];

  return (
    <footer className="border-t border-border/50 bg-background/95">
      <div className="container mx-auto px-4 py-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <Link className="underline underline-offset-4 hover:text-foreground" to="/privacy">
            {text.privacy}
          </Link>
          <Link className="underline underline-offset-4 hover:text-foreground" to="/terms">
            {text.terms}
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
