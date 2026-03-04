import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Settings, UserPlus, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { internalApi } from '@/lib/internalApi';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { queryClient } from '@/lib/queryClient';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  VIEWER: 'Visualizador',
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'destructive',
  ADMIN: 'default',
  VIEWER: 'secondary',
};

function formatDate(date: string): string {
  return new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));
}

interface InternalSettingsProps {
  adminRole?: string;
}

export default function InternalSettings({ adminRole }: InternalSettingsProps) {
  const { toast } = useToast();
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('ADMIN');
  const [inviteLoading, setInviteLoading] = useState(false);
  const isSuperAdmin = adminRole === 'SUPER_ADMIN';

  const { data: resp, isLoading } = useQuery({
    queryKey: ['/api/internal/admins'],
    queryFn: () => internalApi.getAdmins(),
  });

  const admins = (resp as any)?.data?.data || [];

  const handleInvite = async () => {
    if (!inviteEmail) return;
    setInviteLoading(true);
    const result = await internalApi.createInvite(inviteEmail, inviteRole);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Error', description: result.error as string });
    } else {
      toast({ title: 'Invitación enviada', description: `Se envió la invitación a ${inviteEmail}` });
      queryClient.invalidateQueries({ queryKey: ['/api/internal/admins'] });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteRole('ADMIN');
    }
    setInviteLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold">Administradores</h1>
            <p className="text-muted-foreground text-sm">Gestión del equipo interno</p>
          </div>
        </div>
        {isSuperAdmin && (
          <Button onClick={() => setInviteOpen(true)} data-testid="button-invite-admin">
            <UserPlus className="w-4 h-4 mr-2" />
            Invitar Admin
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Equipo Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Desde</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin: any) => (
                    <TableRow key={admin.id} data-testid={`row-admin-${admin.id}`}>
                      <TableCell className="font-medium">{admin.email}</TableCell>
                      <TableCell>
                        <Badge variant={(ROLE_COLORS[admin.role] as any) || 'outline'}>
                          {ROLE_LABELS[admin.role] || admin.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={admin.status === 'ACTIVE' ? 'default' : 'secondary'}>
                          {admin.status === 'ACTIVE' ? 'Activo' : admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(admin.created_at)}</TableCell>
                    </TableRow>
                  ))}
                  {admins.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No hay administradores
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invitar Administrador</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="invite-email">Correo electrónico</Label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@juntoscrecemos.co"
                data-testid="input-invite-email"
              />
            </div>
            <div>
              <Label htmlFor="invite-role">Rol</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger data-testid="select-invite-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                  <SelectItem value="VIEWER">Visualizador</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button onClick={handleInvite} disabled={inviteLoading || !inviteEmail} data-testid="button-confirm-invite">
              {inviteLoading ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
