import { GlobeIcon } from 'lucide-react';

import Bandcamp from '../icons/bandcamp.svg?react';
import Beatport from '../icons/beatport.svg?react';
import Deezer from '../icons/deezer.svg?react';
import Facebook from '../icons/facebook.svg?react';
import Instagram from '../icons/instagram.svg?react';
import SoundCloud from '../icons/soundcloud.svg?react';
import Spotify from '../icons/spotify.svg?react';
import YouTube from '../icons/youtube.svg?react';

export function SocialIcon({ platform, ...props }: { platform: string } & React.SVGProps<SVGSVGElement>) {
  const Icon = icons[platform as keyof typeof icons] ?? GlobeIcon;

  return <Icon {...props} />;
}

const icons = {
  bandcamp: Bandcamp,
  beatport: Beatport,
  deezer: Deezer,
  facebook: Facebook,
  instagram: Instagram,
  soundcloud: SoundCloud,
  youtube: YouTube,
  spotify: Spotify,
};
