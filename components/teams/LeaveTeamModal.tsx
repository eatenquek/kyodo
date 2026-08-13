import { Text } from 'react-native';
import { ConfirmModal, confirmModalStyles } from '@/components/ConfirmModal';
import { Team } from '@/types/domain';

export function LeaveTeamModal({
  visible,
  team,
  loading,
  error,
  onClose,
  onConfirm
}: {
  visible?: boolean;
  team: Team | null;
  loading: boolean;
  error: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ConfirmModal
      visible={visible ?? Boolean(team)}
      icon="exit-outline"
      title="Leave this team?"
      body={
        <>
          You'll need the <Text style={confirmModalStyles.code}>{team?.joinCode}</Text> code to join{' '}
          {team?.name || 'this team'} again.
        </>
      }
      confirmLabel="Leave team"
      loadingLabel="Leaving…"
      tone="danger"
      loading={loading}
      error={error}
      cancelAccessibilityLabel="Cancel leaving team"
      onClose={onClose}
      onConfirm={onConfirm}
    />
  );
}
