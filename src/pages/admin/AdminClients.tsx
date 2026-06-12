import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Upload, Building2, GripVertical, Save, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface ClientForm {
  name: string;
  logo_url: string;
  website_url: string;
  is_active: boolean;
}

interface ClientRecord {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  is_active: boolean;
  sort_order: number;
}

const emptyForm: ClientForm = { name: '', logo_url: '', website_url: '', is_active: true };

const AdminClients = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [orderedClients, setOrderedClients] = useState<ClientRecord[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['admin-clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('client_logos').select('*').order('sort_order');
      if (error) throw error;
      return data as ClientRecord[];
    },
  });

  useEffect(() => {
    setOrderedClients(clients);
    setOrderDirty(false);
  }, [clients]);

  const moveClient = (from: number, to: number) => {
    setOrderedClients(prev => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
    setOrderDirty(true);
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx !== null && dragIdx !== idx) {
      moveClient(dragIdx, idx);
      setDragIdx(idx);
    }
  };
  const handleDragEnd = () => setDragIdx(null);

  const saveOrderMutation = useMutation({
    mutationFn: async () => {
      const updates = orderedClients.map((client, idx) =>
        supabase.from('client_logos').update({ sort_order: idx + 1 }).eq('id', client.id)
      );
      const results = await Promise.all(updates);
      const failed = results.find(r => r.error);
      if (failed?.error) throw failed.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['public-client-logos'] });
      setOrderDirty(false);
      toast({ title: 'Client order saved' });
    },
    onError: (err: Error) => toast({ title: 'Error saving order', description: err.message, variant: 'destructive' }),
  });

  const handleImageUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `clients/${Date.now()}.${ext}`;
    const { data: uploadData, error } = await supabase.storage.from('cms-images').upload(path, file);
    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }
    const publicUrl = uploadData?.publicUrl || supabase.storage.from('cms-images').getPublicUrl(path).data.publicUrl;
    setForm(f => ({ ...f, logo_url: publicUrl }));
    setUploading(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name) throw new Error('Name is required');
      const payload = { ...form };
      if (editId) {
        const { error } = await supabase.from('client_logos').update(payload).eq('id', editId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('client_logos').insert({ ...payload, sort_order: clients.length + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['public-client-logos'] });
      toast({ title: editId ? 'Client updated' : 'Client added' });
      closeDialog();
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('client_logos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-clients'] });
      queryClient.invalidateQueries({ queryKey: ['public-client-logos'] });
      toast({ title: 'Client deleted' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const openEdit = (client: ClientRecord) => {
    setEditId(client.id);
    setForm({
      name: client.name,
      logo_url: client.logo_url ?? '',
      website_url: client.website_url ?? '',
      is_active: client.is_active,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditId(null); setForm(emptyForm); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-sm">{orderedClients.length} clients</p>
          <p className="text-xs text-muted-foreground mt-0.5">Drag cards to reorder — changes appear on the homepage</p>
        </div>
        <div className="flex items-center gap-2">
          {orderDirty && (
            <Button
              variant="outline"
              onClick={() => saveOrderMutation.mutate()}
              disabled={saveOrderMutation.isPending}
              className="gap-2"
            >
              {saveOrderMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Order
            </Button>
          )}
          <Dialog open={dialogOpen} onOpenChange={v => { if (!v) closeDialog(); else setDialogOpen(true); }}>
            <DialogTrigger asChild>
              <Button className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white">
                <Plus className="h-4 w-4 mr-2" /> Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editId ? 'Edit Client' : 'Add Client'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Client Name</label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-sm font-medium">Website URL</label>
                  <Input value={form.website_url} onChange={e => setForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://" />
                </div>

                <div>
                  <label className="text-sm font-medium">Logo</label>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { if (e.target.files?.[0]) handleImageUpload(e.target.files[0]); }} />
                  {form.logo_url ? (
                    <div className="relative mt-2 bg-muted rounded-lg p-4 flex items-center justify-center">
                      <img src={form.logo_url} alt="Logo" className="max-h-24 object-contain" />
                      <Button type="button" size="sm" variant="secondary" className="absolute bottom-2 right-2"
                        onClick={() => fileRef.current?.click()}>Change</Button>
                    </div>
                  ) : (
                    <Button type="button" variant="outline" className="w-full mt-2 h-24 flex-col gap-2"
                      onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <span className="text-sm">Uploading...</span> : (
                        <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Upload logo</span></>
                      )}
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                  <label className="text-sm">Active</label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                  <Button type="submit" className="bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Card key={i} className="animate-pulse"><CardContent className="h-32" /></Card>)}
        </div>
      ) : orderedClients.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No clients yet.</CardContent></Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {orderedClients.map((client, idx) => (
            <Card
              key={client.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
              className={cn(
                'overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing',
                dragIdx === idx ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : 'hover:shadow-md',
                !client.is_active && 'opacity-60',
              )}
            >
              <div className="relative aspect-[3/2] bg-muted flex items-center justify-center p-4">
                <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                  <span className="inline-flex items-center justify-center h-6 w-6 rounded-md bg-background/90 border border-border/60 shadow-sm">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </span>
                  <span className="text-[10px] font-mono font-semibold bg-background/90 border border-border/60 rounded px-1.5 py-0.5 shadow-sm text-muted-foreground">
                    #{idx + 1}
                  </span>
                </div>
                {client.logo_url ? (
                  <img src={client.logo_url} alt={client.name} className="max-h-full max-w-full object-contain pointer-events-none" draggable={false} />
                ) : (
                  <Building2 className="h-10 w-10 text-muted-foreground/30 pointer-events-none" />
                )}
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate">{client.name}</p>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEdit(client)}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Pencil className="h-3 w-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(client.id); }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminClients;
