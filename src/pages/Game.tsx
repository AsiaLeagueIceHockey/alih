import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import Schedule from "./Schedule";
import Highlights from "./Highlights";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import SEO from "@/components/SEO";

const Game = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get("tab") || "schedule";
  
  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value }, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <SEO 
        title={currentTab === 'schedule' ? t('page.schedule.title') : t('page.highlights.title')}
        description={t('page.schedule.subtitle')}
        path={`/game?tab=${currentTab}`}
      />
      <PageHeader 
        title={t('nav.game', 'Game')} 
        subtitle={t('page.schedule.subtitle')}
      />

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <div className="container mx-auto px-4 mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">{t('nav.schedule')}</TabsTrigger>
            <TabsTrigger value="highlights">{t('nav.highlights')}</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="schedule" className="mt-0">
          <Schedule hideHeader={true} />
        </TabsContent>
        
        <TabsContent value="highlights" className="mt-0">
          <Highlights hideHeader={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Game;
