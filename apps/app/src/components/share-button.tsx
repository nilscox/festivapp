'use client';

export function ShareButton({
  url,
  title,
  text,
  ...props
}: { url: string; title?: string; text?: string } & React.ComponentProps<'button'>) {
  return <button onClick={() => void handleShare(url, title, text)} {...props} />;
}

async function handleShare(url: string, title?: string, text?: string) {
  try {
    if (!navigator.share || !navigator.canShare({ title, text, url })) {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard');
      return;
    }

    await navigator.share({ title, text, url });
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      alert(`Error while sharing: ${error.message}`);
    }
  }
}
