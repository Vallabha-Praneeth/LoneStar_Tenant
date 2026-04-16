import colors from '../../constants/colors';
import { useTenant } from '../../context/TenantContext';

export function colorsByTenant() {
  const { tenant } = useTenant();
  return tenant?.theme ?? colors.light;
}

export function radiusByTenant() {
  const { tenant } = useTenant();
  return tenant?.radius ?? colors.radius;
}
