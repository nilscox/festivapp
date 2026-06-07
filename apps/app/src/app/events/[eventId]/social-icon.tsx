import { GlobeIcon } from 'lucide-react';

import Bandcamp from '@/icons/bandcamp';
import Beatport from '@/icons/beatport';
import Deezer from '@/icons/deezer';
import Facebook from '@/icons/facebook';
import Instagram from '@/icons/instagram';
import SoundCloud from '@/icons/soundcloud';
import Spotify from '@/icons/spotify';
import YouTube from '@/icons/youtube';

export function SocialIcon({ host, ...props }: { host: string } & React.SVGProps<SVGSVGElement>) {
  const media = host.split('.').at(-2) ?? 'unknown';

  const Icon =
    {
      bandcamp: Bandcamp,
      beatport: Beatport,
      deezer: Deezer,
      facebook: Facebook,
      instagram: Instagram,
      soundcloud: SoundCloud,
      youtube: YouTube,
      spotify: Spotify,
    }[media] ?? GlobeIcon;

  return <Icon {...props} />;
}
