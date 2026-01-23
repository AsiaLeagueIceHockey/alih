import UserMenu from './auth/UserMenu';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
}

const PageHeader = ({ title, subtitle }: PageHeaderProps) => {
  return (
    <header className="bg-gradient-to-b from-primary/10 to-background pt-[calc(2.5rem+env(safe-area-inset-top))] pb-4">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <UserMenu />
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
