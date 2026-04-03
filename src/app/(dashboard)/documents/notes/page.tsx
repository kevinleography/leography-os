import { redirect } from 'next/navigation';

export default function DocumentsNotesRedirect() {
  redirect('/documents?tab=notes');
}
