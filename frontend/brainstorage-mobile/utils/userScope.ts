type OwnedRecord = {
  user?: {
    id?: number | string | null;
  } | null;
  userId?: number | string | null;
};

const normalizeUserId = (value?: number | string | null) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? String(value) : parsed;
};

export const filterItemsByUser = <T extends OwnedRecord>(items: T[], userId?: number | string | null) => {
  const normalizedUserId = normalizeUserId(userId);

  if (normalizedUserId === null) {
    return items;
  }

  return items.filter((item) => {
    const itemUserId = normalizeUserId(item?.user?.id ?? item?.userId);
    return itemUserId === normalizedUserId;
  });
};
