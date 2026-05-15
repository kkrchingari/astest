import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  UserPlus, 
  Trash2, 
  Shield, 
  Phone, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  MoreVertical,
  X,
  Check
} from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const PERMISSIONS_LIST = [
  { id: 'candidates', label: 'Candidates & Auditions' },
  { id: 'create_test', label: 'Create Tests' },
  { id: 'analytics', label: 'Analytics & AI' },
  { id: 'mcq', label: 'MCQ Bank' },
  { id: 'personas', label: 'Persona Management' },
  { id: 'settings', label: 'System Settings' },
];

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    permissions: [] as string[]
  });

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/super/admins');
      setAdmins(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleOpenAdd = () => {
    setEditingAdmin(null);
    setFormData({
      name: '',
      phone: '',
      password: '',
      permissions: ['candidates']
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (admin: any) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      phone: admin.phone,
      password: '', // Keep empty if not changing
      permissions: admin.permissions || []
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAdmin) {
        await api.put(`/super/admins/${editingAdmin._id}`, {
          ...formData,
          active: editingAdmin.active
        });
      } else {
        await api.post('/super/admins', formData);
      }
      setIsModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save admin');
    }
  };

  const toggleStatus = async (admin: any) => {
    try {
      await api.put(`/super/admins/${admin._id}`, {
        active: !admin.active
      });
      fetchAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin? This action cannot be undone.')) return;
    try {
      await api.delete(`/super/admins/${id}`);
      fetchAdmins();
    } catch (err) {
      console.error(err);
    }
  };

  const togglePermission = (permId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter(p => p !== permId)
        : [...prev.permissions, permId]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif font-black text-astro-navy tracking-tight">Access Management</h2>
          <p className="text-astro-navy/40 text-xs font-bold uppercase tracking-widest mt-1">Control portal access and permissions</p>
        </div>
        <Button 
          onClick={handleOpenAdd}
          className="bg-astro-navy text-astro-gold h-10 px-6 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] border border-astro-gold/50"
        >
          <UserPlus className="w-4 h-4 mr-2" /> Add Sub-Admin
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-astro-gold/20 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-astro-cream/80 border-b border-astro-gold/10">
            <TableRow>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Name & ID</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Access Level</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Status</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-astro-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-astro-navy/40 italic font-serif text-lg">Authenticating records...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : admins.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-64 text-center">
                  <div className="max-w-xs mx-auto space-y-4">
                    <Shield className="w-12 h-12 mx-auto text-astro-gold/20" />
                    <p className="italic font-serif text-xl text-astro-navy/40">No sub-admins found.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              admins.map((admin: any) => (
                <TableRow key={admin._id} className="hover:bg-astro-cream/40 transition-colors group">
                  <TableCell className="py-5 px-6">
                    <div className="font-serif text-xl font-medium text-astro-navy">{admin.name}</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">{admin.phone}</div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex flex-wrap gap-1">
                      {admin.permissions && admin.permissions.length > 0 ? (
                        admin.permissions.map((p: string) => (
                          <span key={p} className="text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 bg-astro-navy/5 text-astro-navy/60 rounded">
                            {p.replace('_', ' ')}
                          </span>
                        ))
                      ) : (
                        <span className="text-[8px] font-black uppercase tracking-tighter text-rose-400">No Access</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <Badge className={cn(
                      "text-[9px] font-black tracking-widest px-2 py-0.5 rounded-full border shadow-none",
                      admin.active ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"
                    )}>
                      {admin.active ? 'ACTIVE' : 'DISABLED'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => toggleStatus(admin)}
                        className={cn(
                          "h-8 px-3 text-[10px] font-bold uppercase tracking-widest border transition-all",
                          admin.active 
                            ? "border-rose-200 text-rose-500 hover:bg-rose-50" 
                            : "border-emerald-200 text-emerald-500 hover:bg-emerald-50"
                        )}
                      >
                        {admin.active ? 'Disable' : 'Enable'}
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleOpenEdit(admin)}
                        className="h-8 px-3 bg-astro-navy/5 text-astro-navy text-[10px] font-bold uppercase tracking-widest border border-astro-navy/10 hover:bg-astro-navy/10"
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDelete(admin._id)}
                        className="h-8 w-8 text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md bg-white border-astro-gold/20 p-0 overflow-hidden rounded-2xl">
          <form onSubmit={handleSubmit}>
            <div className="p-8 space-y-6">
              <DialogHeader>
                <DialogTitle className="text-3xl font-serif font-black text-astro-navy tracking-tight leading-none">
                  {editingAdmin ? 'Update Credentials' : 'New Administrator'}
                </DialogTitle>
                <p className="text-astro-navy/40 text-[10px] font-bold uppercase tracking-widest mt-2">
                  Configure access rights and security
                </p>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-astro-gold/70 px-1">Full Name</label>
                    <div className="relative">
                      <Input 
                        placeholder="Name" 
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="h-11 bg-astro-cream/50 border-astro-gold/20 focus:ring-astro-gold/20 text-astro-navy font-serif"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-astro-gold/70 px-1">Mobile Access</label>
                    <div className="relative">
                      <Input 
                        placeholder="Phone Number" 
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        className="h-11 bg-astro-cream/50 border-astro-gold/20 focus:ring-astro-gold/20 text-astro-navy"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-astro-gold/70 px-1">
                    {editingAdmin ? 'Change Password (Leave empty for no change)' : 'Secret Password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-astro-navy/20" />
                    <Input 
                      placeholder="Password" 
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 pl-10 bg-astro-cream/50 border-astro-gold/20 focus:ring-astro-gold/20 text-astro-navy"
                      required={!editingAdmin}
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-astro-gold/70 px-1">Module Permissions</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PERMISSIONS_LIST.map(perm => (
                      <div 
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group",
                          formData.permissions.includes(perm.id)
                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                            : "bg-astro-cream/30 border-astro-gold/10 text-astro-navy/40 hover:border-astro-gold/30 hover:bg-astro-cream/50"
                        )}
                      >
                        <span className="text-[9px] font-black uppercase tracking-widest">{perm.label}</span>
                        {formData.permissions.includes(perm.id) ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-white stroke-[4]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-astro-gold/20 group-hover:border-astro-gold/40" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 flex-col sm:flex-row gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsModalOpen(false)}
                  className="w-full text-[10px] font-bold uppercase tracking-widest text-astro-navy/40"
                >
                  Discard
                </Button>
                <Button 
                  type="submit" 
                  className="w-full bg-astro-navy text-astro-gold font-black text-[10px] uppercase tracking-[0.2em] h-12 shadow-lg shadow-astro-navy/20 border border-astro-gold/30"
                >
                   {editingAdmin ? 'Update Admin' : 'Authorize Admin'}
                </Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
