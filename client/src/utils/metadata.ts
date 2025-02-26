export const downloadCSV = (results: MetadataResult[]) => {
  // Move CSV download logic here
};

export const countWords = (str: string) => {
  return str
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};
