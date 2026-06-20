import { EmptyState, PageHeader, Screen } from '@/components/ui';

export default function TeamsScreen() {
  return (
    <Screen>
      <PageHeader title="Teams" />
      <EmptyState
        title="Your team space"
        body="Create, join, and manage project teams here. More team tools are coming soon."
      />
    </Screen>
  );
}
