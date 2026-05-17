export const formatWebBedsName = (name: string): string => {

  const cleaned = name.replace(/[^a-zA-Z]/g, '');

  return cleaned.substring(0, 25);
};