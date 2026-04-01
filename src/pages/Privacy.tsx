import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

const Privacy = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "ja" ? "ja" : i18n.language === "en" ? "en" : "ko";

  const content = {
    ko: {
      title: "개인정보처리방침",
      subtitle: "alhockey.fans 서비스에서 수집하고 사용하는 정보에 대한 안내",
      seoTitle: "개인정보처리방침",
      seoDescription: "alhockey.fans 개인정보처리방침. Google 로그인, Supabase 인증, 푸시 알림, 서비스 운영 데이터 처리 기준을 안내합니다.",
      updated: "최종 업데이트: 2026-03-17",
      sections: [
        {
          heading: "1. 수집하는 정보",
          body: [
            "Google 또는 이메일 기반 로그인 시 이메일 주소, 이름, 프로필 이미지 등 인증에 필요한 계정 정보를 받을 수 있습니다.",
            "서비스 이용 과정에서 선호 언어, 관심 팀, 발급한 선수 카드, 푸시 알림 토큰, 기본 접속 로그와 같은 운영 정보를 저장할 수 있습니다.",
            "브라우저에는 로그인 상태 유지와 화면 성능 개선을 위해 localStorage 등 클라이언트 저장소가 사용될 수 있습니다.",
          ],
        },
        {
          heading: "2. 정보 사용 목적",
          body: [
            "회원 인증, 로그인 유지, 프로필 생성 및 맞춤형 언어 설정 제공에 사용합니다.",
            "선수 카드 발급, 즐겨찾기 팀 관리, 댓글, 알림, 서비스 운영 및 장애 대응에 사용합니다.",
            "보안 점검, 비정상 접근 방지, 서비스 품질 개선을 위해 최소한의 운영 로그를 확인할 수 있습니다.",
          ],
        },
        {
          heading: "3. 제3자 서비스",
          body: [
            "인증 및 데이터 저장을 위해 Supabase를 사용합니다.",
            "Google 로그인 기능 제공을 위해 Google OAuth를 사용합니다.",
            "배포 및 웹 호스팅 환경은 서비스 운영 상황에 따라 별도 인프라 제공자를 사용할 수 있습니다.",
          ],
        },
        {
          heading: "4. 보관 및 삭제",
          body: [
            "계정 정보와 서비스 데이터는 서비스 제공 기간 동안 보관되며, 운영상 또는 법적 필요가 없는 경우 삭제 또는 비식별화할 수 있습니다.",
            "회원 탈퇴 또는 삭제 요청 시 내부 운영 기록과 법적 보관 대상 정보를 제외한 데이터를 정리할 수 있습니다.",
          ],
        },
        {
          heading: "5. 이용자 권리",
          body: [
            "이용자는 자신의 프로필 정보 열람, 수정, 삭제를 요청할 수 있습니다.",
            "Google 계정 연결 해제는 Google 계정 보안 설정과 서비스 내 재로그인 과정을 통해 처리할 수 있습니다.",
          ],
        },
        {
          heading: "6. 정책 변경",
          body: [
            "본 방침은 서비스 운영 변경, 법령 변경, 인증 정책 변경에 따라 갱신될 수 있습니다.",
            "중요한 변경이 있는 경우 서비스 화면 또는 관련 문서를 통해 고지합니다.",
          ],
        },
      ],
    },
    ja: {
      title: "プライバシーポリシー",
      subtitle: "alhockey.fans が収集・利用する情報に関する案内",
      seoTitle: "プライバシーポリシー",
      seoDescription: "alhockey.fans のプライバシーポリシー。Google ログイン、Supabase 認証、プッシュ通知、運用データの取り扱いを案内します。",
      updated: "最終更新日: 2026-03-17",
      sections: [
        {
          heading: "1. 収集する情報",
          body: [
            "Google またはメールでログインする際、メールアドレス、名前、プロフィール画像など認証に必要な情報を受け取ることがあります。",
            "サービス利用中に、言語設定、お気に入りチーム、発行した選手カード、プッシュ通知トークン、基本的なアクセスログを保存することがあります。",
            "ログイン維持と表示性能向上のため、ブラウザの localStorage などのクライアント保存領域を利用することがあります。",
          ],
        },
        {
          heading: "2. 利用目的",
          body: [
            "会員認証、ログイン維持、プロフィール作成、言語設定の提供に利用します。",
            "選手カード発行、お気に入りチーム管理、コメント、通知、サービス運用と障害対応に利用します。",
            "セキュリティ確認、不正アクセス防止、サービス品質改善のために最小限の運用ログを確認することがあります。",
          ],
        },
        {
          heading: "3. 外部サービス",
          body: [
            "認証とデータ保存のために Supabase を利用します。",
            "Google ログイン機能のために Google OAuth を利用します。",
            "配布およびホスティング環境では、運用状況に応じて別のインフラ提供者を使用する場合があります。",
          ],
        },
        {
          heading: "4. 保管と削除",
          body: [
            "アカウント情報とサービスデータは、サービス提供期間中に保管され、不要になった場合は削除または匿名化されることがあります。",
            "退会または削除の要請がある場合、法令上保管が必要な情報を除き、関連データを整理することがあります。",
          ],
        },
        {
          heading: "5. 利用者の権利",
          body: [
            "利用者は、自身のプロフィール情報の閲覧、修正、削除を要求できます。",
            "Google アカウント連携の解除は、Google アカウントのセキュリティ設定とサービス内の再ログイン手順で処理できます。",
          ],
        },
        {
          heading: "6. ポリシー変更",
          body: [
            "本ポリシーは、サービス運用、法令、認証ポリシーの変更に応じて更新される場合があります。",
            "重要な変更がある場合は、サービス画面または関連文書で案内します。",
          ],
        },
      ],
    },
    en: {
      title: "Privacy Policy",
      subtitle: "How alhockey.fans collects and uses account and service data",
      seoTitle: "Privacy Policy",
      seoDescription: "Privacy Policy for alhockey.fans, including Google sign-in, Supabase authentication, push notifications, and service operations.",
      updated: "Last updated: 2026-03-17",
      sections: [
        {
          heading: "1. Information we collect",
          body: [
            "When you sign in with Google or email, we may receive account information needed for authentication, such as your email address, name, and profile image.",
            "While you use the service, we may store operational data such as language preference, favorite teams, issued player cards, push notification tokens, and basic access logs.",
            "The browser may use localStorage or similar client storage to preserve sign-in state and improve application performance.",
          ],
        },
        {
          heading: "2. How we use information",
          body: [
            "We use data for sign-in, session handling, profile creation, and personalized language settings.",
            "We also use it for player card issuance, favorite team management, comments, notifications, service operations, and incident response.",
            "Minimal operational logs may be reviewed for security checks, abuse prevention, and service quality improvements.",
          ],
        },
        {
          heading: "3. Third-party services",
          body: [
            "We use Supabase for authentication and data storage.",
            "We use Google OAuth for Google sign-in.",
            "Deployment and web hosting may rely on separate infrastructure providers based on the operating environment.",
          ],
        },
        {
          heading: "4. Retention and deletion",
          body: [
            "Account and service data may be retained while the service is active and deleted or anonymized when no longer needed for operations or legal obligations.",
            "When deletion is requested, related data may be removed except where retention is required for security, operations, or legal compliance.",
          ],
        },
        {
          heading: "5. Your choices",
          body: [
            "You may request access to, correction of, or deletion of your profile information.",
            "Google account connection can be revoked through your Google account security settings and a fresh sign-in flow in this service.",
          ],
        },
        {
          heading: "6. Policy updates",
          body: [
            "This policy may be updated when service operations, laws, or authentication requirements change.",
            "Material changes will be reflected in the service or related documentation.",
          ],
        },
      ],
    },
  } as const;

  const text = content[locale];

  return (
    <div className="min-h-screen bg-background pb-10">
      <SEO
        title={text.seoTitle}
        description={text.seoDescription}
        path="/privacy"
      />
      <PageHeader title={text.title} subtitle={text.subtitle} />
      <div className="container mx-auto px-4 py-6">
        <div className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">{text.updated}</p>
          <div className="mt-6 space-y-8">
            {text.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-lg font-semibold text-foreground">{section.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
