import { createSignal } from 'solid-js';

function readBookmarks(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem('bookmarks') ?? '[]'));
  } catch {
    writeBookmarks(new Set());
    return new Set();
  }
}

function writeBookmarks(bookmarks: Set<string>): void {
  localStorage.setItem('bookmarks', JSON.stringify(Array.from(bookmarks)));
}

const [bookmarks, setBookmarks] = createSignal(readBookmarks());

export function getBookmarks() {
  return Array.from(bookmarks());
}

export function isBookmarked(artistId: string) {
  return bookmarks().has(artistId);
}

export function setBookmarked(artistId: string, bookmarked: boolean) {
  const copy = new Set(bookmarks());

  if (bookmarked) {
    copy.add(artistId);
  } else {
    copy.delete(artistId);
  }

  writeBookmarks(copy);
  setBookmarks(copy);
}
