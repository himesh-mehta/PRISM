import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Send } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Contact Us</span>
            <h2 className="font-display text-4xl font-bold text-foreground mt-3 mb-6">
              Let's Start Your <span className="text-gradient-hero">Recovery Journey</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10">
              Have questions about Prism? Want to schedule a demo or discuss how our platform can benefit your clinic? We'd love to hear from you.
            </p>

            <div className="space-y-6">
              {[
                { icon: Mail, label: "Email", value: "hello@prismphysio.com" },
                { icon: Phone, label: "Phone", value: "+1 (800) PRISM-PT" },
                { icon: MapPin, label: "Address", value: "Innovation Hub, Medical District, CA 94102" },
              ].map((c) => (
                <div key={c.label} className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 group hover:bg-blue-600 transition-colors duration-300">
                    <c.icon className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <p className="text-foreground font-medium">{c.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <form className="bg-card rounded-2xl p-8 shadow-elevated border border-border space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">First Name</label>
                  <Input placeholder="John" className="bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Last Name</label>
                  <Input placeholder="Doe" className="bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <Input type="email" placeholder="john@example.com" className="bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Subject</label>
                <Input placeholder="How can we help?" className="bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Message</label>
                <Textarea placeholder="Tell us about your needs..." rows={4} className="bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800" />
              </div>
              <Button className="w-full bg-accent-gradient text-accent-foreground shadow-glow hover:opacity-90">
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
