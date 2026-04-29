import colors from '../constants/colors';
import { useTenant } from '../context/TenantContext';

export function useColors() {
  const { tenant } = useTenant();
  return tenant?.theme ?? colors.light;
}
