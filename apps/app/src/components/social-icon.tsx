import { GlobeIcon } from 'lucide-react';

import Bandcamp from '../icons/bandcamp.svg?react';
import Beatport from '../icons/beatport.svg?react';
import Deezer from '../icons/deezer.svg?react';
import Facebook from '../icons/facebook.svg?react';
import Instagram from '../icons/instagram.svg?react';
import SoundCloud from '../icons/soundcloud.svg?react';
import Spotify from '../icons/spotify.svg?react';
import YouTube from '../icons/youtube.svg?react';

export function SocialIcon({ url, ...props }: { url: string } & React.SVGProps<SVGSVGElement>) {
  const Icon = icons[domain(url) as keyof typeof icons] ?? GlobeIcon;

  return <Icon {...props} />;
}

const icons = {
  'bandcamp.com': Bandcamp,
  'beatport.com': Beatport,
  'deezer.com': Deezer,
  'facebook.com': Facebook,
  'instagram.com': Instagram,
  'soundcloud.com': SoundCloud,
  'youtube.com': YouTube,
  'youtu.be': YouTube,
  'spotify.com': Spotify,
};

// keep the last two labels only, so open.spotify.com and artist.bandcamp.com match
function domain(url: string) {
  try {
    return new URL(url).hostname.split('.').slice(-2).join('.');
  } catch {
    return '';
  }
}
