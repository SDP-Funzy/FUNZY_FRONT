export type LetterboxTab = 'all' | 'favorites' | 'hidden';
export type PreviewLetter = { id: string; senderId: string; sender: string; date: string; image: string; favorite: boolean; hidden: boolean };

export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export const parseDateKey = (value: string) => new Date(`${value}T12:00:00`);
export const koreaToday = () => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());

export const createPreviewLetters = (): PreviewLetter[] => {
  const today = koreaToday();
  const yesterday = parseDateKey(today); yesterday.setDate(yesterday.getDate() - 1);
  const earlier = parseDateKey(today); earlier.setDate(earlier.getDate() - 14);
  const images = ['sample-train.png', 'sample-night.png', 'sample-shirt.jpg', 'sample-beach.png'];
  return ['YESEUNG', 'JHeee', 'MINSOL', 'Rayul', 'FunFun', 'SUJIN'].flatMap((sender, index) =>
    Array.from({ length: index === 0 ? 6 : index % 3 + 1 }, (_, card) => ({
      id: `${index + 1}-${card + 1}`, senderId: String(index + 1), sender,
      date: card === 0 ? today : card % 2 ? dateKey(yesterday) : dateKey(earlier),
      image: `/images/letterbox/${images[(index + card) % images.length]}`,
      favorite: index === 0 && card < 2, hidden: index === 2 && card === 0,
    })));
};

export const filterLetters = (letters: PreviewLetter[], tab: LetterboxTab, query: string, date: string | null) => letters.filter(letter =>
  (tab === 'hidden' ? letter.hidden : !letter.hidden && (tab !== 'favorites' || letter.favorite)) &&
  letter.sender.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (!date || letter.date === date));
