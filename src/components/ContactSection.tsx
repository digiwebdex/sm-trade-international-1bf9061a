import { useState } from 'react';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

/**
 * ContactSection — replica of smelitehajj.com Contact Us layout.
 * 4 small info cards (Call us / Email Us / Visit Us / Office Hours)
 * + right-side message form, plus two office cards with embedded Google Maps.
 *
 * NOTE: All copy here intentionally mirrors the reference site verbatim per
 * the user's request ("সবকিছু হুবুহু"). Do not run translate-everything on
 * this file's strings — they should remain in English / Arabic as shown.
 */
const ContactSection = () => {
  const { toast } = useToast();

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
      const composedMessage = [
        form.package ? `Package Interest: ${form.package}` : null,
        form.message.trim() || '(no message)',
      ]
        .filter(Boolean)
        .join('\n\n');

      const { error } = await supabase.from('contact_messages').insert({
        name: form.name.trim(),
        email: form.email.trim() || 'no-email@provided.local',
        phone: form.phone.trim(),
        message: composedMessage,
      });
      if (error) throw error;
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
  const GREEN = 'hsl(215, 45%, 18%)'; // Deep Navy (primary)
  const GREEN_SOFT = 'hsl(40, 45%, 94%)'; // Warm cream tint
  const GOLD = 'hsl(38, 55%, 52%)'; // Warm Gold accent

  const infoCards = [
    {
      icon: Phone,
      title: 'Call us',
      lines: [
        { label: 'Hotline:', value: '+8801867666888', href: 'tel:+8801867666888' },
        { label: 'Telephone:', value: '+8802224446664', href: 'tel:+8802224446664' },
      ],
    },
    {
      icon: Mail,
      title: 'Email Us',
      lines: [
        { label: '', value: 'info@smelitehajj.com', href: 'mailto:info@smelitehajj.com' },
        { label: '', value: 'support@smelitehajj.com', href: 'mailto:support@smelitehajj.com' },
      ],
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      lines: [
        {
          label: '',
          value: 'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340',
          href: '',
        },
      ],
    },
    {
      icon: Clock,
      title: 'Office Hours',
      lines: [
        { label: '', value: 'Saturday to Thursday 7:00 AM to 5:00 PM', href: '' },
        { label: '', value: 'Friday: Holiday', href: '' },
      ],
    },
  ];

  const offices = [
    {
      title: 'Banani Office',
      address: 'House # 37, Block # C, Road # 6, Banani, Dhaka-1213.',
      phones: ['+88 01867666888', '+88 01619959625'],
      email: 'info@smelitehajj.com',
      mapsEmbed:
        'https://www.google.com/maps?q=House+37+Block+C+Road+6+Banani+Dhaka&output=embed',
      mapsLink: 'https://maps.google.com/?q=House+37+Block+C+Road+6+Banani+Dhaka-1213',
    },
    {
      title: 'Savar Office',
      address:
        'B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340.',
      phones: ['+88 02224446664', '+88 01619959626'],
      email: 'support@smelitehajj.com',
      mapsEmbed:
        'https://www.google.com/maps?q=Al-Baraka+Super+Market+Savar+Bazar+Bus+Stand+Dhaka&output=embed',
      mapsLink:
        'https://maps.google.com/?q=Al-Baraka+Super+Market+Savar+Bazar+Bus+Stand+Dhaka-1340',
    },
  ];

  return (
    <section
      id="contact"
      className="py-20 bg-background"
    >
      <div className="container mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12">
          <p
            className="inline-flex items-center gap-2 text-sm font-medium tracking-wide uppercase mb-3"
            style={{ color: GOLD }}
          >
            <MessageSquare className="h-4 w-4" /> GET IN TOUCH
          </p>
          <h2
            className="text-4xl md:text-5xl font-semibold mb-2"
            style={{ color: GREEN, fontFamily: 'Cormorant Garamond, serif' }}
          >
            Contact Us
          </h2>
          <p className="text-2xl mb-3" style={{ color: GOLD }} dir="rtl">
            اتصل بنا
          </p>
          <p className="max-w-2xl mx-auto text-muted-foreground text-sm md:text-base">
            Ready to start your sacred journey? Contact us today for personalized
            assistance with your Hajj or Umrah booking.
          </p>
        </div>

        {/* Top: 4 info cards (left) + form (right) */}
        <div className="grid lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {/* Info cards 2x2 */}
          <div className="grid sm:grid-cols-2 gap-4 content-start">
            {infoCards.map(({ icon: Icon, title, lines }) => (
              <div
                key={title}
                className="bg-white rounded-lg p-5 shadow-sm border border-black/5"
              >
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center mb-3"
                  style={{ backgroundColor: GREEN }}
                >
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold text-sm mb-2" style={{ color: '#c9a14a' }}>
                  {title}
                </h3>
                <div className="space-y-1 text-sm text-foreground/80">
                  {lines.map((l, i) => (
                    <div key={i}>
                      {l.label && (
                        <span className="text-xs text-muted-foreground mr-1">
                          {l.label}
                        </span>
                      )}
                      {l.href ? (
                        <a href={l.href} className="hover:underline">
                          {l.value}
                        </a>
                      ) : (
                        <span>{l.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-white rounded-lg p-6 md:p-8 shadow-sm border border-black/5">
            <h3
              className="text-xl font-semibold mb-5"
              style={{ color: GREEN, fontFamily: 'Cormorant Garamond, serif' }}
            >
              Send us a Message
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs mb-1.5 block">Full Name *</Label>
                  <Input
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange('name')}
                    required
                  />
                </div>
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
              <div>
                <Label className="text-xs mb-1.5 block">Package Interest</Label>
                <Select
                  value={form.package}
                  onValueChange={(v) => setForm((f) => ({ ...f, package: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Visa Processing">Visa Processing</SelectItem>
                    <SelectItem value="Air Ticket">Air Ticket</SelectItem>
                    <SelectItem value="Hotel Booking">Hotel Booking</SelectItem>
                  </SelectContent>
                </Select>
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

        {/* Office cards: address + phone + email */}
        <div className="grid md:grid-cols-2 gap-4 max-w-6xl mx-auto mt-6">
          {offices.map((o) => (
            <div
              key={o.title}
              className="bg-white rounded-lg p-5 shadow-sm border border-black/5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-9 h-9 rounded-md flex items-center justify-center"
                  style={{ backgroundColor: GREEN }}
                >
                  <Building2 className="h-4 w-4 text-white" />
                </div>
                <h3 className="font-semibold" style={{ color: '#c9a14a' }}>
                  {o.title}
                </h3>
              </div>
              <div className="space-y-1.5 text-sm text-foreground/80">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GREEN }} />
                  <span>{o.address}</span>
                </div>
                {o.phones.map((p) => (
                  <div key={p} className="flex items-start gap-2">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GREEN }} />
                    <a href={`tel:${p.replace(/\s/g, '')}`} className="hover:underline">
                      {p}
                    </a>
                  </div>
                ))}
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: GREEN }} />
                  <a href={`mailto:${o.email}`} className="hover:underline">
                    {o.email}
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Office locations + maps */}
        <div className="max-w-6xl mx-auto mt-8">
          <div
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: GREEN_SOFT }}
          >
            <h3 className="font-semibold flex items-center gap-2" style={{ color: GREEN }}>
              <MapPin className="h-4 w-4" /> Our Office Locations
            </h3>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {offices.map((o) => (
              <div
                key={o.title}
                className="bg-white rounded-lg overflow-hidden shadow-sm border border-black/5"
              >
                <div className="px-4 py-3 flex items-center justify-between border-b border-black/5">
                  <span className="font-medium text-sm" style={{ color: GREEN }}>
                    📍 {o.title}
                  </span>
                  <a
                    href={o.mapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs inline-flex items-center gap-1 hover:underline"
                    style={{ color: GREEN }}
                  >
                    Open in Maps <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
