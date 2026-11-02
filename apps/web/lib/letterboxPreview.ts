export type LetterboxTab = 'all' | 'favorites' | 'hidden';
export type PreviewLetterPage = { id: string; content: string };
export type PreviewLetter = { id: string; senderId: string; sender: string; date: string; image: string; favorite: boolean; hidden: boolean; to: string; pages: PreviewLetterPage[] };
export type PreviewComment = { id: string; parentId: string | null; author: string; body: string; mine: boolean; favorite: boolean; deleted?: boolean };

const sampleMessage = '여행 갔을 때 샀던 거 오랜만에 보니까 갑자기 생각났어. 그때는 그냥 기념으로 하나 산 건데 지금 보니까 괜히 더 반갑고, 여행 다니면서 있었던 일들도 하나씩 생각나.\n같이 돌아다니고 사진 찍고 별 얘기 다 했던 것도 지금 생각하면 진짜 재밌었어ㅋㅋ\n이런 거 하나만 봐도 그때 분위기까지 같이 떠오르는 게 신기하다.\n또 여행가자~~';

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
      to: 'FunFun',
      pages: [
        { id: 'message-1', content: sampleMessage },
        ...(card === 0 ? [{ id: 'message-2', content: '사진을 보니까 우리 추억이 하나씩 떠오르네.\n다음에도 함께 새로운 곳에 가보자!\n늘 고맙고, 앞으로도 좋은 기억 많이 만들자.' }] : []),
      ],
    })));
};

export const createPreviewComments = (): Record<string, PreviewComment[]> => ({
  '1-1': [
    { id: 'sample-1', parentId: null, author: '랑울', body: '나도 끼워줘', mine: false, favorite: false },
    { id: 'sample-2', parentId: 'sample-1', author: 'FunFun', body: '다음에는 같이 가자!', mine: true, favorite: false },
    { id: 'sample-3', parentId: null, author: 'FunFun', body: '너네만 가냐..', mine: true, favorite: false },
  ],
});

export const filterLetters = (letters: PreviewLetter[], tab: LetterboxTab, query: string, date: string | null) => letters.filter(letter =>
  (tab === 'hidden' ? letter.hidden : !letter.hidden && (tab !== 'favorites' || letter.favorite)) &&
  letter.sender.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()) && (!date || letter.date === date));
