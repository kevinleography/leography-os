'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScoreBadge } from '@/components/crm/score-badge';
import { formatDate } from '@/lib/utils';
import { ArrowUpDown } from 'lucide-react';
import type { Contact, PipelineStage } from '@/types/database';

interface ContactsTableProps {
  contacts: Contact[];
  stages?: PipelineStage[];
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const typeLabels: Record<string, string> = {
  lead: 'Lead',
  client: 'Client',
  partenaire: 'Partenaire',
};

const typeVariants: Record<string, 'default' | 'success' | 'warning'> = {
  lead: 'default',
  client: 'success',
  partenaire: 'warning',
};

export function ContactsTable({ contacts, sortField, sortDirection, onSort }: ContactsTableProps) {
  const router = useRouter();

  function SortHeader({ field, children }: { field: string; children: React.ReactNode }) {
    const isActive = sortField === field;
    return (
      <button
        className="flex items-center gap-1 hover:text-text-primary transition-colors"
        onClick={() => onSort(field)}
      >
        {children}
        <ArrowUpDown className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
      </button>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>
            <SortHeader field="last_name">Nom</SortHeader>
          </TableHead>
          <TableHead>Entreprise</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>
            <SortHeader field="score">Score</SortHeader>
          </TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>
            <SortHeader field="created_at">Date</SortHeader>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {contacts.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-text-muted py-12">
              Aucun contact trouvé
            </TableCell>
          </TableRow>
        )}
        {contacts.map((contact) => {
          const initials = `${contact.first_name?.[0] ?? ''}${contact.last_name?.[0] ?? ''}`.toUpperCase();
          return (
            <TableRow
              key={contact.id}
              className="cursor-pointer"
              onClick={() => router.push(`/crm/${contact.id}`)}
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{contact.first_name} {contact.last_name}</p>
                    {contact.profession && (
                      <p className="text-xs text-text-muted">{contact.profession}</p>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-text-secondary">
                {contact.company ?? '—'}
              </TableCell>
              <TableCell>
                <Badge variant={typeVariants[contact.type] ?? 'default'}>
                  {typeLabels[contact.type] ?? contact.type}
                </Badge>
              </TableCell>
              <TableCell>
                <ScoreBadge score={contact.score} />
              </TableCell>
              <TableCell className="text-text-secondary">
                {contact.source ?? '—'}
              </TableCell>
              <TableCell className="text-text-secondary text-sm">
                {contact.email ?? '—'}
              </TableCell>
              <TableCell className="text-text-muted text-sm">
                {formatDate(contact.created_at)}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
