import { Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-prism-navy py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-gradient flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold">P</span>
              </div>
              <span className="font-display font-bold text-lg text-primary-foreground">Prism</span>
            </div>
            <p className="text-primary-foreground/50 text-sm leading-relaxed">
              AI-powered physiotherapy platform transforming how patients recover and therapists deliver care.
            </p>
          </div>

          {[
            {
              title: "Platform",
              links: ["Features", "Pricing", "Security", "Integrations"],
            },
            {
              title: "Company",
              links: ["About", "Careers", "Blog", "Press"],
            },
            {
              title: "Support",
              links: ["Help Center", "Documentation", "Contact", "Privacy Policy"],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-display font-semibold text-primary-foreground mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-primary-foreground/50 text-sm hover:text-prism-sky transition-colors">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/40 text-sm">
            © 2026 Prism Physiotherapy. All rights reserved.
          </p>
          <p className="text-primary-foreground/40 text-sm flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-destructive" /> by Analytics Private Limited
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
