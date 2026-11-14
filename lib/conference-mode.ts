// This project is a bid-stage functional demonstration, NOT the official conference launch.
// To launch officially: set BID_DEMO_MODE=false, review data/privacy, activate official flags,
// and set database conference_settings.demo_mode=false after deleting the demo records.
export const BID_DEMO_MODE = true;
export const registrationEnabled = () => BID_DEMO_MODE || process.env.REGISTRATION_OPEN === 'true';
export const submissionsEnabled = () => BID_DEMO_MODE || process.env.SUBMISSIONS_OPEN === 'true';
