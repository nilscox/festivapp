import { GlobeIcon } from 'lucide-react';
import Bandcamp from 'src/icons/bandcamp';
import Beatport from 'src/icons/beatport';
import Deezer from 'src/icons/deezer';
import Facebook from 'src/icons/facebook';
import Instagram from 'src/icons/instagram';
import SoundCloud from 'src/icons/soundcloud';
import Spotify from 'src/icons/spotify';
import YouTube from 'src/icons/youtube';

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
