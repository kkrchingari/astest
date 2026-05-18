import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stars } from 'lucide-react';
import api from '@/src/lib/api';
import { cn } from '@/lib/utils';

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddCandidateModal({ isOpen, onClose, onSuccess }: AddCandidateModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    skills: [] as string[],
    primarySkill: 'vedic',
    yearsExperience: '',
    languages: [] as string[],
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const SKILL_OPTIONS = [
    { value: 'vedic', label: 'Vedic Astrology' },
    { value: 'tarot', label: 'Tarot Reading' },
    { value: 'numerology', label: 'Numerology' },
    { value: 'kp', label: 'KP Astrology' },
    { value: 'lal_kitab', label: 'Lal Kitab' },
  ];

  const handleSkillToggle = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) 
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.skills.length === 0) {
      setError('Please select at least one skill system');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post('/candidates', formData);
      onSuccess();
      onClose();
      setFormData({
        name: '',
        email: '',
        phone: '',
        skills: [],
        primarySkill: 'vedic',
        yearsExperience: '',
        languages: [],
        password: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create candidate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl bg-white rounded-3xl border border-astro-gold/20 shadow-2xl overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
        <div className="h-2 bg-astro-navy w-full sticky top-0 z-10" />
        <div className="p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-astro-navy rounded-2xl shadow-lg border border-astro-gold/20">
                <Stars className="w-6 h-6 text-astro-gold" />
              </div>
              <div className="space-y-1">
                <DialogTitle className="font-serif text-3xl text-astro-navy italic font-bold">Invite New Practitioner</DialogTitle>
                <DialogDescription className="text-astro-gold font-serif italic text-base">
                  Cast the credentials for a new seeker across multiple systems.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            {error && <p className="text-rose-600 text-[10px] font-bold uppercase tracking-widest bg-rose-50 p-4 rounded-xl border border-rose-100 text-center">{error}</p>}
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Candidate Name</Label>
                <Input 
                  id="name" 
                  required 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Aarav Sharma"
                  className="bg-astro-cream/30 border-astro-gold/20 rounded-xl h-12 px-4 focus:ring-astro-gold text-astro-navy"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Phone (Primary ID)</Label>
                <Input 
                  id="phone" 
                  required 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="9999999999"
                  className="bg-astro-cream/30 border-astro-gold/20 rounded-xl h-12 px-4 focus:ring-astro-gold text-astro-navy"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Mastery Systems (Multiple permitted)</Label>
              <div className="grid grid-cols-2 gap-3">
                {SKILL_OPTIONS.map((skill) => (
                  <button
                    key={skill.value}
                    type="button"
                    onClick={() => handleSkillToggle(skill.value)}
                    className={cn(
                      "flex items-center gap-3 p-4 rounded-xl border transition-all text-left group",
                      formData.skills.includes(skill.value)
                        ? "border-astro-gold bg-astro-navy text-astro-gold"
                        : "border-astro-gold/10 bg-astro-cream/10 text-astro-navy/60 hover:border-astro-gold/30"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      formData.skills.includes(skill.value) ? "bg-astro-gold border-astro-gold" : "bg-white border-astro-navy/10"
                    )}>
                      {formData.skills.includes(skill.value) && <Stars className="w-2 h-2 text-astro-navy" />}
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">{skill.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Universal Primary System</Label>
                <Select value={formData.primarySkill} onValueChange={(val) => setFormData({...formData, primarySkill: val})}>
                  <SelectTrigger className="bg-astro-cream/30 border-astro-gold/20 rounded-xl h-12 focus:ring-astro-gold">
                    <SelectValue placeholder="System" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-astro-gold/10">
                    {SKILL_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-xs font-bold uppercase tracking-widest">{opt.label}</SelectItem>
                    ))}
                    <SelectItem value="astrology" className="text-xs font-bold uppercase tracking-widest">Generic Astrology</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp" className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Solar Cycles (Exp)</Label>
                <Input 
                  id="exp" 
                  type="number"
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                  placeholder="5"
                  className="bg-astro-cream/30 border-astro-gold/20 rounded-xl h-12 px-4 focus:ring-astro-gold text-astro-navy"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Digital Correspondence (Email)</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="aarav@example.com"
                  className="bg-astro-cream/30 border-astro-gold/20 rounded-xl h-12 px-4 focus:ring-astro-gold text-astro-navy"
                />
              </div>
              <div className="space-y-2 text-left">
                <Label htmlFor="password" className="text-[10px] uppercase tracking-widest font-bold text-astro-navy/40 ml-1">Access Password</Label>
                <Input 
                  id="password" 
                  type="text"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Default: Phone No."
                  className="bg-astro-cream/30 border-astro-gold/20 rounded-xl h-12 px-4 focus:ring-astro-gold text-astro-navy"
                />
                <p className="text-[8px] text-astro-navy/40 italic ml-1">Leave blank to use phone number as password.</p>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-3">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={onClose}
                className="rounded-xl border border-astro-gold/10 text-astro-navy/40 hover:bg-astro-cream uppercase text-[10px] font-bold tracking-widest"
              >
                Retract
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="bg-astro-navy hover:bg-astro-navy/90 text-astro-gold px-10 rounded-xl h-12 font-bold uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-astro-navy/10"
              >
                {loading ? 'OPENING CHANNELS...' : 'INVITE TO PLATFORM'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
