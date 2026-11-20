import {Participation} from '@/components/home/HomeSections';
import {getPublicConferenceSettings, publicStatus} from '@/lib/public-settings';

export const metadata = {title: 'Participation', alternates: {canonical: '/participation'}};
export const revalidate = 60;

export default async function Page() {
  return <Participation status={publicStatus(await getPublicConferenceSettings())} />;
}
