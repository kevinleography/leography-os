'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ContactsTable } from '@/components/crm/contacts-table';
import { ContactForm } from '@/components/crm/contact-form';
import { Search, Plus, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Contact, ContactType, PipelineStage } from '@/types/database';

interface ContactsPageProps {
  initialContacts: Contact[];
  totalCount: number;
  stages: PipelineStage[];
}

const filterOptions: { label: string; value: ContactType | 'all' }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Leads', value: 'lead' },
  { label: 'Clients', value: 'client' },
  { label: 'Partenaires', value: 'partenaire' },
];

const sortOptions = [
  { label: 'Score (desc)', value: 'score' },
  { label: 'Nom', value: 'last_name' },
  { label: 'Date', value: 'created_at' },
];

const PAGE_SIZE = 20;

export function ContactsPage({ initialContacts, totalCount, stages }: ContactsPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [count, setCount] = useState(totalCount);
  const [search, setSearch] = useState(searchParams.get('search') ?? '');
  const [filter, setFilter] = useState<ContactType | 'all'>((searchParams.get('type') as ContactType) ?? 'all');
  const [sortField, setSortField] = useState(searchParams.get('sort') ?? 'score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(
    (searchParams.get('dir') as 'asc' | 'desc') ?? 'desc'
  );
  const [page, setPage] = useState(Number(searchParams.get('page') ?? '1'));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const fetchContacts = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filter !== 'all') params.set('type', filter);
      params.set('sort', sortField);
      params.set('dir', sortDirection);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        setContacts(json.data);
        setCount(json.count);
      }
    } finally {
      setIsLoading(false);
    }
  }, [search, filter, sortField, sortDirection, page]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchContacts();
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchContacts]);

  function handleSort(field: string) {
    if (field === sortField) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'last_name' ? 'asc' : 'desc');
    }
    setPage(1);
  }

  function handleFilterChange(value: ContactType | 'all') {
    setFilter(value);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Contacts</h1>
          <p className="text-sm text-text-muted mt-1">
            {count} contact{count > 1 ? 's' : ''} au total
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau contact
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher un contact..."
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          {filterOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={filter === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleFilterChange(opt.value)}
            >
              {opt.label}
            </Button>
          ))}
        </div>

        <select
          value={sortField}
          onChange={(e) => { setSortField(e.target.value); setPage(1); }}
          className="h-8 rounded-lg px-3 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary focus:outline-none focus:border-primary"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className={cn('transition-opacity duration-200', isLoading && 'opacity-60')}>
        <ContactsTable
          contacts={contacts}
          stages={stages}
          sortField={sortField}
          sortDirection={sortDirection}
          onSort={handleSort}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Page {page} sur {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Suivant
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Contact Form Dialog */}
      <ContactForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={fetchContacts}
      />
    </div>
  );
}
