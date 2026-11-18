// Pure helpers that are safe to import from client components.
/** Reference prefixes keep test records visibly distinct from official ones.
 *  DEMO- is kept because participants have already received it by email. */
export const registrationReference = (serial: number, isTest: boolean) =>
  (isTest ? 'DEMO-AKH-2027-' : 'AKH-2027-') + String(serial).padStart(4, '0');
export const abstractReference = (serial: number, isTest: boolean) =>
  (isTest ? 'DEMO-AKH-ABS-' : 'AKH-ABS-') + String(serial).padStart(4, '0');

export const formatDeadline = (iso: string) =>
  new Date(iso).toLocaleString('en-GB', {timeZone: 'Africa/Lagos', dateStyle: 'long', timeStyle: 'short'}) + ' WAT';
