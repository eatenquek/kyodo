import { Team } from '@/types/domain';

// figures out which team is "active" - activeTeamId can be stale/deleted
export function resolveActiveTeam(teams: Team[], activeTeamId: string | undefined, userId: string): Team | undefined {
  const isMember = (team: Team) => team.members.some((member) => member.id === userId);
  const selected = teams.find((team) => team.id === activeTeamId);
  if (selected && isMember(selected)) return selected;
  return teams.find(isMember);
}
