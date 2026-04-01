import PageHeader from "@/components/PageHeader";
import SEO from "@/components/SEO";
import { useTranslation } from "react-i18next";

const Terms = () => {
  const { i18n } = useTranslation();
  const locale = i18n.language === "ja" ? "ja" : i18n.language === "en" ? "en" : "ko";

  const content = {
    ko: {
      title: "서비스 이용약관",
      subtitle: "alhockey.fans 서비스 이용에 적용되는 기본 조건",
      seoTitle: "서비스 이용약관",
      seoDescription: "alhockey.fans 서비스 이용약관. 계정 사용, 콘텐츠 이용, 서비스 변경, 책임 제한에 대한 기본 조건을 안내합니다.",
      updated: "최종 업데이트: 2026-03-17",
      sections: [
        {
          heading: "1. 서비스 개요",
          body: [
            "alhockey.fans는 아시아리그 아이스하키 관련 일정, 뉴스, 팀 정보, 선수 카드, 사용자 계정 기능을 제공하는 웹 서비스입니다.",
            "일부 기능은 로그인, 브라우저 지원, 외부 인증 제공자 상태에 따라 제한될 수 있습니다.",
          ],
        },
        {
          heading: "2. 계정 및 로그인",
          body: [
            "이용자는 Google, Kakao 또는 서비스에서 제공하는 인증 수단으로 로그인할 수 있습니다.",
            "이용자는 자신의 계정 접근 정보와 연결된 외부 계정 보안을 스스로 관리해야 합니다.",
          ],
        },
        {
          heading: "3. 허용되는 사용",
          body: [
            "이용자는 정상적인 서비스 이용 목적 범위에서 본 서비스를 사용할 수 있습니다.",
            "자동화된 남용, 과도한 요청, 비정상 접근, 타인 계정 도용, 서비스 운영 방해 행위는 금지됩니다.",
          ],
        },
        {
          heading: "4. 콘텐츠와 데이터",
          body: [
            "서비스 내 팀, 경기, 선수, 뉴스, 카드 관련 정보는 운영 데이터 또는 제3자 출처를 기반으로 제공될 수 있습니다.",
            "운영자는 데이터 정확성과 실시간성을 개선하기 위해 노력하지만, 모든 정보의 완전성이나 무오류를 보장하지는 않습니다.",
          ],
        },
        {
          heading: "5. 서비스 변경 및 중단",
          body: [
            "운영자는 기능 추가, 수정, 점검, 보안 대응을 위해 서비스 일부를 변경하거나 중단할 수 있습니다.",
            "중요한 운영 변경이 필요한 경우 가능한 범위에서 사전 또는 사후 안내를 제공합니다.",
          ],
        },
        {
          heading: "6. 책임 제한",
          body: [
            "서비스는 제공 가능한 범위에서 운영되며, 외부 인증 제공자 장애, 네트워크 문제, 제3자 데이터 지연으로 인한 영향이 발생할 수 있습니다.",
            "법령상 허용되는 범위에서 운영자는 간접적 손해 또는 예측 불가능한 손해에 대해 책임을 제한할 수 있습니다.",
          ],
        },
      ],
    },
    ja: {
      title: "利用規約",
      subtitle: "alhockey.fans の利用に適用される基本条件",
      seoTitle: "利用規約",
      seoDescription: "alhockey.fans の利用規約。アカウント利用、コンテンツ利用、サービス変更、責任制限の基本条件を案内します。",
      updated: "最終更新日: 2026-03-17",
      sections: [
        {
          heading: "1. サービス概要",
          body: [
            "alhockey.fans は、アジアリーグアイスホッケーの日程、ニュース、チーム情報、選手カード、アカウント機能を提供するウェブサービスです。",
            "一部の機能はログイン状態、ブラウザ対応、外部認証提供者の状態により制限される場合があります。",
          ],
        },
        {
          heading: "2. アカウントとログイン",
          body: [
            "利用者は Google、Kakao、またはサービスが提供する認証手段でログインできます。",
            "利用者は自身のアカウント情報および連携した外部アカウントの安全を管理する責任があります。",
          ],
        },
        {
          heading: "3. 許可される利用",
          body: [
            "利用者は通常のサービス利用目的の範囲で本サービスを利用できます。",
            "自動化された濫用、過剰なリクエスト、不正アクセス、他人のアカウント使用、運用妨害は禁止されます。",
          ],
        },
        {
          heading: "4. コンテンツとデータ",
          body: [
            "チーム、試合、選手、ニュース、カードに関する情報は、運用データまたは第三者ソースに基づいて提供される場合があります。",
            "運営者は正確性と即時性の改善に努めますが、すべての情報の完全性や無誤りを保証するものではありません。",
          ],
        },
        {
          heading: "5. サービス変更と停止",
          body: [
            "運営者は機能追加、修正、保守、セキュリティ対応のためにサービスの一部を変更または停止することがあります。",
            "重要な変更が必要な場合は、可能な範囲で事前または事後に案内します。",
          ],
        },
        {
          heading: "6. 責任制限",
          body: [
            "サービスは利用可能な範囲で提供され、外部認証提供者の障害、ネットワーク問題、第三者データ遅延の影響を受ける場合があります。",
            "法令で認められる範囲で、運営者は間接損害または予見不能な損害に対する責任を制限することがあります。",
          ],
        },
      ],
    },
    en: {
      title: "Terms of Service",
      subtitle: "Core conditions for using alhockey.fans",
      seoTitle: "Terms of Service",
      seoDescription: "Terms of Service for alhockey.fans, including account use, content use, service changes, and limitation of liability.",
      updated: "Last updated: 2026-03-17",
      sections: [
        {
          heading: "1. Service overview",
          body: [
            "alhockey.fans is a web service for Asia League Ice Hockey schedules, news, team information, player cards, and account features.",
            "Some features may depend on sign-in status, browser support, and the availability of external identity providers.",
          ],
        },
        {
          heading: "2. Accounts and sign-in",
          body: [
            "Users may sign in with Google, Kakao, or other authentication methods made available by the service.",
            "Users are responsible for maintaining the security of their account access and any linked external identity account.",
          ],
        },
        {
          heading: "3. Acceptable use",
          body: [
            "You may use the service only for legitimate access to the features it provides.",
            "Automated abuse, excessive requests, unauthorized access, account impersonation, and interference with service operations are prohibited.",
          ],
        },
        {
          heading: "4. Content and data",
          body: [
            "Team, game, player, news, and card information may be provided from internal operations data or third-party sources.",
            "We aim to improve accuracy and freshness, but we do not guarantee that all content will always be complete, current, or error-free.",
          ],
        },
        {
          heading: "5. Service changes and availability",
          body: [
            "We may update, suspend, or modify parts of the service for maintenance, security response, or feature changes.",
            "Where practical, major operational changes will be reflected in the service or related documentation.",
          ],
        },
        {
          heading: "6. Limitation of liability",
          body: [
            "The service is provided on an operational basis and may be affected by outages involving external identity providers, networks, or third-party data sources.",
            "To the extent permitted by law, liability may be limited for indirect or unforeseeable damages.",
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
        path="/terms"
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

export default Terms;
