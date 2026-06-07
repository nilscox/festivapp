'use client';

import { useLingui } from '@lingui/react/macro';

export function ShareButton({
  url,
  title,
  text,
  ...props
}: { url: string; title?: string; text?: string } & React.ComponentProps<'button'>) {
  const { t } = useLingui();

  const handleShare = async (url: string, title?: string, text?: string) => {
    try {
      if (!navigator.share || !navigator.canShare({ title, text, url })) {
        await navigator.clipboard.writeText(url);
        alert(t`Link copied to clipboard`);
        return;
      }

      await navigator.share({ title, text, url });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        alert(t`Error while sharing: ${error.message}`);
      }
    }
  };

  return <button onClick={() => void handleShare(url, title, text)} {...props} />;
}
