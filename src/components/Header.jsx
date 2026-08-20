import { Wind } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportIssueDialog from './ReportIssueDialog';

const Header = () => {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <Wind className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">AirWatch</h1>
            <p className="text-xs text-muted-foreground">Ward-Wise Pollution Dashboard</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#overview" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
            Overview
          </a>
          <a href="#wards" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Wards
          </a>
          <a href="#sources" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Sources
          </a>
          <a href="#actions" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">
            Actions
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <ReportIssueDialog>
            <Button variant="default">
              Report Issue
            </Button>
          </ReportIssueDialog>
        </div>
      </div>
    </header>
  );
};

export default Header;
