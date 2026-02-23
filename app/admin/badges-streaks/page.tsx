import BadgesAndStreaks from '@/src/components/admin/badgesandstreaks/BadgesAndStreaks';
import { SchoolFilterProvider } from '@/src/contexts/SchoolFilterContext';

export default function BadgesAndStreaksPage() {
  return (
    <SchoolFilterProvider>
      <BadgesAndStreaks />
    </SchoolFilterProvider>
  );
}
