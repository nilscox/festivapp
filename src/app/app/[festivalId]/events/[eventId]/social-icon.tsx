import Bandcamp from 'app/icons/bandcamp';
import Beatport from 'app/icons/beatport';
import Deezer from 'app/icons/deezer';
import Facebook from 'app/icons/facebook';
import Instagram from 'app/icons/instagram';
import SoundCloud from 'app/icons/soundcloud';
import Spotify from 'app/icons/spotify';
import YouTube from 'app/icons/youtube';
import { GlobeIcon } from 'lucide-react';

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
