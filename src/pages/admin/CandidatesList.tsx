import { useState, useEffect } from 'react';
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
import { Search, UserPlus, Filter, MoreHorizontal, ExternalLink, Download } from 'lucide-react';
import api from '@/src/lib/api';
import AddCandidateModal from './AddCandidateModal';
import CandidateDetailDrawer from './CandidateDetailDrawer';
import { cn } from '@/lib/utils';

export default function CandidatesList() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/candidates');
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'invited': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'in_progress': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'published': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'rejected': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const filteredCandidates = candidates.filter((c: any) => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search) ||
    c.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase())) ||
    c.primarySkill?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    if (candidates.length === 0) return;

    // Build CSV Headers
    const headers = [
      'Name', 
      'Phone', 
      'Email', 
      'Primary System', 
      'Exp (Years)', 
      'Status', 
      'Mock Score (%)', 
      'MCQ Score (%)', 
      'Final Tier',
      'Added By',
      'Min Rate (Fixed)',
      'Variable (Per Minute)',
      'System Share (%)'
    ];

    // Build Rows
    const rows = candidates.map((c: any) => [
      `"${c.name}"`,
      c.phone,
      c.email || 'N/A',
      c.primarySkill || (c.skills?.[0] || 'N/A'),
      c.yearsExperience,
      c.status,
      c.mockScore || 0,
      c.mcqScore || 0,
      c.finalTier || 'Senior',
      c.createdByName || 'Admin',
      c.earningCard?.fixedRate || 0,
      c.earningCard?.variableRate || 0,
      c.earningCard?.systemShare || 0
    ]);

    // Combine
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `astrolive_complete_database_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-astro-gold/20 shadow-sm">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-astro-navy/30" />
            <Input 
              placeholder="Search database..." 
              className="pl-10 h-10 bg-astro-cream/50 border-astro-gold/10 focus:ring-astro-gold/20 focus:border-astro-gold/40 rounded-lg text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            onClick={handleExport}
            className="h-10 gap-2 px-4 border-astro-gold/20 rounded-lg text-xs font-bold uppercase tracking-widest text-astro-navy/60 hover:bg-astro-cream"
          >
            <Download className="w-3.5 h-3.5" /> Export DB
          </Button>
        </div>
        
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-astro-navy text-astro-gold px-6 h-10 rounded-lg font-bold text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 border border-astro-gold/50 hover:bg-astro-navy/90 shadow-lg shadow-astro-navy/20"
        >
          <UserPlus className="w-4 h-4" /> Add New Practitioner
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-astro-gold/20 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-astro-cream/80 border-b border-astro-gold/10">
            <TableRow>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Practitioner</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">System</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Status</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Evaluation</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em]">Added By</TableHead>
              <TableHead className="py-4 px-6 text-astro-gold font-bold uppercase text-[10px] tracking-[0.2em] text-right">Records</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-6 h-6 border-2 border-astro-gold border-t-transparent rounded-full animate-spin" />
                    <p className="text-astro-navy/40 italic font-serif text-lg">Synchronizing records...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredCandidates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="max-w-xs mx-auto space-y-2 opacity-40">
                    <Search className="w-10 h-10 mx-auto text-astro-navy/20" />
                    <p className="italic font-serif text-lg">No matches found for "{search}".</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredCandidates.map((c: any) => (
                <TableRow key={c._id} className="hover:bg-astro-cream/40 transition-colors group">
                  <TableCell className="py-5 px-6">
                    <div className="font-serif text-xl font-medium text-astro-navy">{c.name}</div>
                    <div className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-0.5">{c.phone}</div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="flex flex-wrap gap-1.5">
                      {c.skills && c.skills.length > 0 ? (
                        c.skills.map((s: string) => (
                          <span key={s} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-astro-navy/5 rounded border border-astro-navy/10 text-astro-navy/60">
                            {s}
                          </span>
                        ))
                      ) : (
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-astro-navy/5 rounded border border-astro-navy/10 text-astro-navy/60">
                          {c.primarySkill || 'N/A'}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <Badge className={cn("capitalize px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-[0.15em] border shadow-none", getStatusColor(c.status))}>
                      {c.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="inline-flex items-center px-3 py-1 border border-astro-gold/30 rounded-full bg-astro-cream/50">
                       <span className="font-serif text-xs font-bold italic text-astro-navy">
                         {c.status === 'completed' || c.status === 'published' ? (c.finalTier || 'Senior') : 'PENDING'}
                       </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6">
                    <div className="text-[10px] font-bold text-astro-navy/60 uppercase tracking-widest">
                       {c.createdByName || 'Admin'}
                    </div>
                  </TableCell>
                  <TableCell className="py-5 px-6 text-right">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setSelectedCandidateId(c._id);
                        setIsDrawerOpen(true);
                      }}
                      className="text-[9px] font-black tracking-widest text-astro-navy/60 border-astro-gold/20 hover:bg-astro-navy hover:text-white uppercase px-4 h-8"
                    >
                      View Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddCandidateModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchCandidates}
      />

      <CandidateDetailDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        candidateId={selectedCandidateId}
        onUpdate={fetchCandidates}
      />
    </div>
  );
}
