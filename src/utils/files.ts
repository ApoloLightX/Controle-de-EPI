import * as FileSystem from 'expo-file-system/legacy';

function safeFileName(name: string) {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/-+/g, '-');
  return cleaned || 'arquivo';
}

export async function persistPickedFile(uri: string, name: string, prefix: string) {
  const base = FileSystem.documentDirectory;
  if (!base) return uri;

  const directory = `${base}attachments/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });

  const destination = `${directory}${safeFileName(prefix)}-${Date.now()}-${safeFileName(name)}`;
  if (uri === destination) return uri;

  await FileSystem.copyAsync({ from: uri, to: destination });
  return destination;
}
