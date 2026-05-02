import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Save, Loader2, Phone, Mail, MapPin, MessageCircle, Facebook, Linkedin, Instagram,
  Plus, Trash2, Building2,
} from 'lucide-react';

type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

interface ContactData {
  phone: string;
  email: string;
  address: string;
  address_bn: string;
  whatsapp_number: string;
  facebook: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  youtube: string;
}

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

const defaultContact: ContactData = {
  phone: '', email: '', address: '', address_bn: '',
  whatsapp_number: '', facebook: '', linkedin: '', instagram: '',
  twitter: '', youtube: '',
};

const defaultSection: ContactSectionData = {
  eyebrow: 'GET IN TOUCH',
  heading: 'Contact Us',
  heading_arabic: 'اتصل بنا',
  subheading: '',
  form_title: 'Send us a Message',
  office_locations_title: 'Our Office Locations',
  info_cards: [],
  offices: [],
};

const ICON_OPTIONS = ['Phone', 'Mail', 'MapPin', 'Clock', 'Building2', 'MessageSquare'];

const AdminContactInfo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ContactData>(defaultContact);
  const [section, setSection] = useState<ContactSectionData>(defaultSection);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['site-settings-contact'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings').select('*').eq('setting_key', 'contact').maybeSingle();
      if (error) throw error;
      return data?.setting_value as unknown as Record<string, any> | null;
    },
  });

  const { data: sectionData, isLoading: sectionLoading } = useQuery({
    queryKey: ['site-settings-contact-section-admin'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('site_settings').select('*').eq('setting_key', 'contact_section').maybeSingle();
      if (error) throw error;
      return data?.setting_value as unknown as Partial<ContactSectionData> | null;
    },
  });

  useEffect(() => {
    if (settings) {
      // Helper: pick string from trilingual object {en,bn,zh} or plain string
      const pick = (v: any): string => {
        if (v == null) return '';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') return v.en || v.bn || v.zh || '';
        return String(v);
      };
      setForm({
        phone: pick(settings.phone),
        email: pick(settings.email),
        address: pick(settings.address),
        address_bn:
          (settings.address && typeof settings.address === 'object' && (settings.address as any).bn) ||
          pick(settings.address_bn),
        whatsapp_number: pick(settings.whatsapp_number),
        facebook: pick(settings.facebook),
        linkedin: pick(settings.linkedin),
        instagram: pick(settings.instagram),
        twitter: pick(settings.twitter),
        youtube: pick(settings.youtube),
      });
    }
  }, [settings]);

  useEffect(() => {
    if (sectionData) {
      setSection({ ...defaultSection, ...sectionData } as ContactSectionData);
    }
  }, [sectionData]);

  const upsertSetting = async (key: string, payload: any) => {
    const { error } = await supabase
      .from('site_settings')
      .upsert({
        setting_key: key,
        setting_value: payload as Json,
      });

    if (error) throw error;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {};
      for (const [key, val] of Object.entries(form)) {
        if (key === 'address_bn') continue;
        payload[key] = { en: val, bn: val };
      }
      payload.address = { en: form.address, bn: form.address_bn || form.address };
      await upsertSetting('contact', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-contact'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-public'] });
      toast({ title: 'Contact info saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const saveSectionMutation = useMutation({
    mutationFn: async () => {
      await upsertSetting('contact_section', section);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-settings-contact-section'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings-contact-section-admin'] });
      toast({ title: 'Contact section saved ✅' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  // Info card helpers
  const updateCard = (idx: number, patch: Partial<InfoCard>) =>
    setSection(s => ({ ...s, info_cards: s.info_cards.map((c, i) => i === idx ? { ...c, ...patch } : c) }));
  const addCard = () =>
    setSection(s => ({ ...s, info_cards: [...s.info_cards, { title: 'New Card', icon: 'Phone', lines: [{ label: '', value: '', href: '' }] }] }));
  const removeCard = (idx: number) =>
    setSection(s => ({ ...s, info_cards: s.info_cards.filter((_, i) => i !== idx) }));
  const updateLine = (cIdx: number, lIdx: number, patch: Partial<InfoLine>) =>
    updateCard(cIdx, { lines: section.info_cards[cIdx].lines.map((l, i) => i === lIdx ? { ...l, ...patch } : l) });
  const addLine = (cIdx: number) =>
    updateCard(cIdx, { lines: [...section.info_cards[cIdx].lines, { label: '', value: '', href: '' }] });
  const removeLine = (cIdx: number, lIdx: number) =>
    updateCard(cIdx, { lines: section.info_cards[cIdx].lines.filter((_, i) => i !== lIdx) });

  // Office helpers
  const updateOffice = (idx: number, patch: Partial<Office>) =>
    setSection(s => ({ ...s, offices: s.offices.map((o, i) => i === idx ? { ...o, ...patch } : o) }));
  const addOffice = () =>
    setSection(s => ({ ...s, offices: [...s.offices, { title: 'New Office', address: '', phones: [''], email: '', mapsEmbed: '', mapsLink: '' }] }));
  const removeOffice = (idx: number) =>
    setSection(s => ({ ...s, offices: s.offices.filter((_, i) => i !== idx) }));

  if (isLoading || sectionLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contact Information</h1>
          <p className="text-muted-foreground text-sm">Manage everything shown in the Contact Us section</p>
        </div>
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Primary
        </Button>
      </div>

      {/* Primary Contact */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Primary Contact</CardTitle>
          <CardDescription>Phone, email, and WhatsApp used across the website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm"><Phone className="h-3.5 w-3.5" /> Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+880 1867-666888" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-sm"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp Number</Label>
              <Input value={form.whatsapp_number} onChange={e => setForm(p => ({ ...p, whatsapp_number: e.target.value }))} placeholder="8801867666888" />
              <p className="text-xs text-muted-foreground">Numbers only, with country code (no + or spaces)</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Mail className="h-3.5 w-3.5" /> Email Address</Label>
            <Input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="info@smtradeint.com" />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Address</CardTitle>
          <CardDescription>Physical address shown in footer and contact section</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><MapPin className="h-3.5 w-3.5" /> Address (English)</Label>
            <Input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="123 Main Street, Dhaka" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><MapPin className="h-3.5 w-3.5" /> ঠিকানা (বাংলা)</Label>
            <Input value={form.address_bn} onChange={e => setForm(p => ({ ...p, address_bn: e.target.value }))} placeholder="১২৩ মেইন স্ট্রিট, ঢাকা" />
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Social Media Links</CardTitle>
          <CardDescription>Social media profile URLs shown in footer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Facebook className="h-3.5 w-3.5" /> Facebook</Label>
            <Input value={form.facebook} onChange={e => setForm(p => ({ ...p, facebook: e.target.value }))} placeholder="https://facebook.com/..." />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Linkedin className="h-3.5 w-3.5" /> LinkedIn</Label>
            <Input value={form.linkedin} onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))} placeholder="https://linkedin.com/company/..." />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-sm"><Instagram className="h-3.5 w-3.5" /> Instagram</Label>
            <Input value={form.instagram} onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))} placeholder="https://instagram.com/..." />
          </div>
        </CardContent>
      </Card>

      {/* ============ Contact Section editor ============ */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          <h2 className="text-xl font-bold">Contact Us Section Content</h2>
          <p className="text-muted-foreground text-sm">Headings, info cards, offices, and maps shown on the homepage</p>
        </div>
        <Button onClick={() => saveSectionMutation.mutate()} disabled={saveSectionMutation.isPending}>
          {saveSectionMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Section
        </Button>
      </div>

      {/* Headings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Headings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Eyebrow / Tagline</Label>
              <Input value={section.eyebrow} onChange={e => setSection(s => ({ ...s, eyebrow: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Main Heading</Label>
              <Input value={section.heading} onChange={e => setSection(s => ({ ...s, heading: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Arabic Heading (optional)</Label>
              <Input value={section.heading_arabic} onChange={e => setSection(s => ({ ...s, heading_arabic: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Form Title</Label>
              <Input value={section.form_title} onChange={e => setSection(s => ({ ...s, form_title: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Subheading</Label>
            <Textarea rows={2} value={section.subheading} onChange={e => setSection(s => ({ ...s, subheading: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label className="text-sm">Office Locations Title</Label>
            <Input value={section.office_locations_title} onChange={e => setSection(s => ({ ...s, office_locations_title: e.target.value }))} />
          </div>
        </CardContent>
      </Card>

      {/* Info Cards */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Info Cards</CardTitle>
            <CardDescription>The 4 small cards (Call us, Email, Visit, Hours)</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addCard}><Plus className="h-4 w-4 mr-1" />Add Card</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.info_cards.map((card, cIdx) => (
            <div key={cIdx} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Input
                  className="flex-1"
                  placeholder="Card title"
                  value={card.title}
                  onChange={e => updateCard(cIdx, { title: e.target.value })}
                />
                <select
                  className="border rounded-md px-3 py-2 text-sm bg-background"
                  value={card.icon}
                  onChange={e => updateCard(cIdx, { icon: e.target.value })}
                >
                  {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <Button size="icon" variant="ghost" onClick={() => removeCard(cIdx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                {card.lines.map((line, lIdx) => (
                  <div key={lIdx} className="grid grid-cols-12 gap-2 items-center">
                    <Input className="col-span-3" placeholder="Label (optional)" value={line.label} onChange={e => updateLine(cIdx, lIdx, { label: e.target.value })} />
                    <Input className="col-span-4" placeholder="Value" value={line.value} onChange={e => updateLine(cIdx, lIdx, { value: e.target.value })} />
                    <Input className="col-span-4" placeholder="Link (tel:/mailto:/https:)" value={line.href} onChange={e => updateLine(cIdx, lIdx, { href: e.target.value })} />
                    <Button size="icon" variant="ghost" className="col-span-1" onClick={() => removeLine(cIdx, lIdx)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Button size="sm" variant="ghost" onClick={() => addLine(cIdx)}>
                  <Plus className="h-3.5 w-3.5 mr-1" />Add line
                </Button>
              </div>
            </div>
          ))}
          {section.info_cards.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No info cards. Click "Add Card".</p>
          )}
        </CardContent>
      </Card>

      {/* Offices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-4 w-4" />Offices & Maps</CardTitle>
            <CardDescription>Office cards with addresses, phones, email, and Google Maps embeds</CardDescription>
          </div>
          <Button size="sm" variant="outline" onClick={addOffice}><Plus className="h-4 w-4 mr-1" />Add Office</Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {section.offices.map((o, idx) => (
            <div key={idx} className="border rounded-lg p-4 space-y-3 bg-muted/30">
              <div className="flex items-center gap-2">
                <Input className="flex-1" placeholder="Office title (e.g. Banani Office)" value={o.title} onChange={e => updateOffice(idx, { title: e.target.value })} />
                <Button size="icon" variant="ghost" onClick={() => removeOffice(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Address</Label>
                <Textarea rows={2} value={o.address} onChange={e => updateOffice(idx, { address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Phones (one per line)</Label>
                <Textarea
                  rows={2}
                  value={o.phones.join('\n')}
                  onChange={e => updateOffice(idx, { phones: e.target.value.split('\n').map(p => p.trim()).filter(Boolean) })}
                  placeholder="+88 01867666888&#10;+88 01619959625"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Email</Label>
                <Input value={o.email} onChange={e => updateOffice(idx, { email: e.target.value })} placeholder="office@example.com" />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-xs">Google Maps Embed URL</Label>
                  <Input value={o.mapsEmbed} onChange={e => updateOffice(idx, { mapsEmbed: e.target.value })} placeholder="https://www.google.com/maps?q=...&output=embed" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Google Maps Link (Open in Maps)</Label>
                  <Input value={o.mapsLink} onChange={e => updateOffice(idx, { mapsLink: e.target.value })} placeholder="https://maps.google.com/?q=..." />
                </div>
              </div>
            </div>
          ))}
          {section.offices.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No offices. Click "Add Office".</p>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end pb-8">
        <Button onClick={() => saveSectionMutation.mutate()} disabled={saveSectionMutation.isPending} size="lg">
          {saveSectionMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save Contact Section
        </Button>
      </div>
    </div>
  );
};

export default AdminContactInfo;
