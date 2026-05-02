import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Building2,
  Send,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

const ICON_MAP: Record<string, any> = { Phone, Mail, MapPin, Clock, Building2, MessageSquare };

interface InfoLine { label: string; value: string; href: string }
interface InfoCard { title: string; icon: string; lines: InfoLine[] }
interface Office {
  title: string; address: string; phones: string[]; email: string;
  mapsEmbed: string; mapsLink: string;
}
interface ContactSectionData {
  eyebrow: string;
  heading: string;
  heading_arabic: string;
  subheading: string;
  form_title: string;
  office_locations_title: string;
  info_cards: InfoCard[];
  offices: Office[];
}

const FALLBACK: ContactSectionData = {
  eyebrow: 'GET IN TOUCH',
  heading: 'Contact Us',
  heading_arabic: 'اتصل بنا',
  subheading: 'Ready to start your sacred journey? Contact us today for personalized assistance with your Hajj or Umrah booking.',
  form_title: 'Send us a Message',
  office_locations_title: 'Our Office Locations',
  info_cards: [],
  offices: [],
};

const ContactSection = () => {
  const { toast } = useToast();

  const { data: cs = FALLBACK } = useQuery({
    queryKey: ['site-settings-contact-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .eq('setting_key', 'contact_section')
        .maybeSingle();
      if (error) throw error;
      const v = (data?.setting_value as unknown as Partial<ContactSectionData>) || {};
      return { ...FALLBACK, ...v } as ContactSectionData;
    },
  });

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    package: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleChange =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        message: form.message.trim(),
      };

      // 1) Save to database (best-effort, don't block email on failure)
      try {
        await supabase.from('contact_messages').insert({
          name: payload.name,
          email: payload.email || 'no-email@provided.local',
          phone: payload.phone,
          message: payload.message || '(no message)',
        });
      } catch (dbErr) {
        console.warn('contact_messages insert failed:', dbErr);
      }

      // 2) Send email to info@smtradeint.com via backend
      const resp = await fetch('/api/send-contact-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(data?.error || 'Email send failed');
      }

      toast({ title: 'Message sent successfully!' });
      setForm({ name: '', phone: '', email: '', package: '', message: '' });
    } catch (err) {
      console.error(err);
      toast({ title: 'Failed to send message', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // SM Trade International brand colors — Deep Navy + Warm Gold
  const GREEN = 'hsl(215, 45%, 18%)';
  const GREEN_SOFT = 'hsl(40, 45%, 94%)';
  const GOLD = 'hsl(38, 55%, 52%)';
  const CREAM = 'hsl(40, 50%, 96%)';

  return (
    <section
      id="contact"
      className="py-20 relative"
      style={{
        backgroundColor: CREAM,
        backgroundImage:
          "radial-gradient(circle at 1px 1px, hsl(38, 55%, 52%, 0.08) 1px, transparent 0)",
        backgroundSize: '24px 24px',
      }}
    >
      <div className="container mx-auto px-4 relative">
        {/* Heading */}
        <div className="text-center mb-14">
          <p
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.25em] uppercase mb-4"
            style={{ color: GOLD }}
          >
            <span className="h-px w-8" style={{ backgroundColor: GOLD }} />
            <MessageSquare className="h-3.5 w-3.5" /> {cs.eyebrow}
            <span className="h-px w-8" style={{ backgroundColor: GOLD }} />
          </p>
          <h2
            className="text-4xl md:text-5xl lg:text-6xl font-semibold mb-4 leading-tight tracking-tight"
            style={{ color: GREEN, fontFamily: 'Cormorant Garamond, serif' }}
          >
            {cs.heading}
          </h2>
          <p className="max-w-2xl mx-auto text-base md:text-lg leading-relaxed text-foreground/60 font-light">
            {cs.subheading}
          </p>
        </div>

        {/* Top: 4 info cards (left) + form (right) */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Info cards 2x2 */}
          <div className="grid sm:grid-cols-2 gap-4 content-start">
            {cs.info_cards.map((card, idx) => {
              const Icon = ICON_MAP[card.icon] || Phone;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-lg p-5 shadow-sm border border-black/5"
                >
                  <div
                    className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
                    style={{ backgroundColor: GREEN }}
                  >
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="font-bold text-lg md:text-xl mb-2 tracking-tight" style={{ color: GOLD }}>
                    {card.title}
                  </h3>
                  <div className="space-y-1 text-sm text-foreground/80">
                    {card.lines.map((l, i) => (
                      <div key={i}>
                        {l.label && (
                          <span className="text-xs text-muted-foreground mr-1">
                            {l.label}
                          </span>
                        )}
                        {l.href ? (
                          <a href={l.href} className="hover:underline">{l.value}</a>
                        ) : (
                          <span>{l.value}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-black/5">
            <h3
              className="text-xl font-semibold mb-5"
              style={{ color: GREEN, fontFamily: 'Cormorant Garamond, serif' }}
            >
              {cs.form_title}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs mb-1.5 block">Full Name *</Label>
                <Input
                  placeholder="Your full name"
                  value={form.name}
                  onChange={handleChange('name')}
                  required
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Phone *</Label>
                  <Input
                    type="tel"
                    placeholder="+880 1XXX-XXXXXX"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs mb-1.5 block">Email</Label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange('email')}
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs mb-1.5 block">Message</Label>
                <Textarea
                  rows={4}
                  placeholder="Tell us about your requirements..."
                  value={form.message}
                  onChange={handleChange('message')}
                />
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full text-white gap-2"
                style={{ backgroundColor: GREEN }}
              >
                <Send className="h-4 w-4" />
                {submitting ? 'Sending...' : 'Send Message'}
              </Button>
            </form>
          </div>
        </div>

        {/* Office locations + maps */}
        {cs.offices.length > 0 && (
          <div className="max-w-6xl mx-auto mt-8">
            <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: GREEN_SOFT }}>
              <h3 className="font-semibold flex items-center gap-2" style={{ color: GREEN }}>
                <MapPin className="h-4 w-4" /> {cs.office_locations_title}
              </h3>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {cs.offices.map((o, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-lg overflow-hidden shadow-sm border border-black/5"
                >
                  <div className="px-4 py-3 flex items-center justify-between border-b border-black/5">
                    <span className="font-medium text-sm" style={{ color: GREEN }}>
                      📍 {o.title}
                    </span>
                    {o.mapsLink && (
                      <a
                        href={o.mapsLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs inline-flex items-center gap-1 hover:underline"
                        style={{ color: GREEN }}
                      >
                        Open in Maps <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  {o.mapsEmbed && (
                    <iframe
                      src={o.mapsEmbed}
                      width="100%"
                      height="260"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={`${o.title} Map`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ContactSection;
