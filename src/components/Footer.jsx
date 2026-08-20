import { Wind } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="container">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Wind className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AirWatch</h3>
                <p className="text-xs text-muted-foreground">Ward-Wise Pollution Dashboard</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Live AQI for Delhi wards
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#overview" className="text-muted-foreground hover:text-primary transition-colors">Overview</a></li>
              <li><a href="#wards" className="text-muted-foreground hover:text-primary transition-colors">Ward Status</a></li>
              <li><a href="#sources" className="text-muted-foreground hover:text-primary transition-colors">Pollution Sources</a></li>
              <li><a href="#actions" className="text-muted-foreground hover:text-primary transition-colors">Recommendations</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-sm text-muted-foreground">
          <p>© 2026 AirWatch</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
