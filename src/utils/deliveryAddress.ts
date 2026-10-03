const DELIVERY_NOTES_SEPARATOR = ' | Observações de entrega: ';

export function splitDeliverySnapshot(value?: string | null) {
  const snapshot = value?.trim() || '';
  const separatorIndex = snapshot.indexOf(DELIVERY_NOTES_SEPARATOR);

  if (separatorIndex < 0) {
    return { address: snapshot, notes: '' };
  }

  return {
    address: snapshot.slice(0, separatorIndex).trim(),
    notes: snapshot.slice(separatorIndex + DELIVERY_NOTES_SEPARATOR.length).trim(),
  };
}
