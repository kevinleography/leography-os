'use client';

import { useState } from 'react';
import {
  Upload,
  FileText,
  FileSignature,
  FileCode,
  FileImage,
  FileBarChart,
  Download,
  Filter,
  Search,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import type { Document, DocumentType } from '@/types/database';

interface DocumentWithRelations extends Document {
  contacts: { first_name: string; last_name: string; company: string | null } | null;
  projects: { name: string } | null;
}

interface DocumentsPageClientProps {
  documents: DocumentWithRelations[];
  totalCount: number;
}

const typeConfig: Record<DocumentType, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'destructive'; icon: React.ReactNode }> = {
  contract: { label: 'Contrat', variant: 'default', icon: <FileText className="w-4 h-4" /> },
  brief: { label: 'Brief', variant: 'warning', icon: <FileCode className="w-4 h-4" /> },
  sop: { label: 'SOP', variant: 'secondary', icon: <FileBarChart className="w-4 h-4" /> },
  asset: { label: 'Asset', variant: 'success', icon: <FileImage className="w-4 h-4" /> },
  report: { label: 'Rapport', variant: 'default', icon: <FileBarChart className="w-4 h-4" /> },
  signature: { label: 'Signature', variant: 'destructive', icon: <FileSignature className="w-4 h-4" /> },
};

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentsPageClient({
  documents: initialDocuments,
  totalCount,
}: DocumentsPageClientProps) {
  const [documents] = useState(initialDocuments);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | ''>('');

  const filtered = documents.filter((doc) => {
    const matchesSearch = !search || doc.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = !typeFilter || doc.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const documentTypes: DocumentType[] = ['contract', 'brief', 'sop', 'asset', 'report', 'signature'];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <Input
            placeholder="Rechercher un document..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as DocumentType | '')}
            className="h-10 rounded-[10px] px-3 py-2 text-sm bg-[rgba(255,255,255,0.05)] backdrop-blur-xl border border-glass-border text-text-primary transition-all duration-200 focus:outline-none focus:border-primary"
          >
            <option value="">Tous les types</option>
            {documentTypes.map((type) => (
              <option key={type} value={type}>
                {typeConfig[type].label}
              </option>
            ))}
          </select>
        </div>

        <Button className="ml-auto">
          <Upload className="w-4 h-4 mr-1.5" />
          Importer
        </Button>
      </div>

      {/* Stats */}
      <p className="text-sm text-text-muted">
        {filtered.length} document(s) sur {totalCount}
      </p>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Projet</TableHead>
            <TableHead>Taille</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-text-muted py-12">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                Aucun document trouve
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((doc) => {
              const typeCfg = typeConfig[doc.type];
              return (
                <TableRow key={doc.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-text-muted">{typeCfg.icon}</span>
                      <span className="font-medium">{doc.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={typeCfg.variant}>{typeCfg.label}</Badge>
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {doc.projects?.name ?? '-'}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatFileSize(doc.file_size)}
                  </TableCell>
                  <TableCell className="text-text-secondary">
                    {formatDate(doc.created_at)}
                  </TableCell>
                  <TableCell>
                    {doc.storage_path && (
                      <Button variant="ghost" size="icon" title="Telecharger">
                        <Download className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
