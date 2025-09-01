export function searchString(subject?: string, search?: string) {
  if (!subject) {
    return false;
  }

  if (!search) {
    return true;
  }

  return removeDiacriticCharacters(subject)
    .toLowerCase()
    .includes(removeDiacriticCharacters(search).toLowerCase());
}

function removeDiacriticCharacters(string: string) {
  return string.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
