import { supabaseAdmin } from '@/lib/supabase/admin';
import { SettingsPage } from '@/components/settings/settings-page';
import type { User } from '@/types/database';

async function getSettingsData() {
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('*')
    .order('full_name');

  return {
    users: (users ?? []) as User[],
  };
}

export default async function Settings() {
  const { users } = await getSettingsData();

  return (
    <div className="page-wrapper space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Parametres</h1>
      </div>
      <SettingsPage users={users} />
    </div>
  );
}
