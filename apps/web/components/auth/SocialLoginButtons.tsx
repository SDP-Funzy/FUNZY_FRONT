type SocialProvider = {
  id: 'google' | 'naver' | 'kakao';
  label: string;
  iconSrc: string;
};

const SOCIAL_PROVIDERS: SocialProvider[] = [
  { id: 'google', label: '구글로 로그인', iconSrc: '/icons/social-google.svg' },
  { id: 'naver', label: '네이버로 로그인', iconSrc: '/icons/social-naver.svg' },
  { id: 'kakao', label: '카카오로 로그인', iconSrc: '/icons/social-kakao.svg' },
];

type SocialLoginButtonsProps = {
  onSelect: (provider: SocialProvider['id']) => void;
};

/**
 * 소셜 로그인 버튼 (35px 원형, 간격 25px)
 * 아이콘은 피그마에서 원형 배경까지 포함해 SVG 로 내보낸 파일을 쓴다.
 * 아직 연동 전이라 누르면 onSelect 로 알리기만 한다.
 */
export const SocialLoginButtons = ({ onSelect }: SocialLoginButtonsProps) => {
  return (
    <ul className="flex items-center gap-[25px]">
      {SOCIAL_PROVIDERS.map((provider) => (
        <li key={provider.id}>
          <button
            type="button"
            aria-label={provider.label}
            onClick={() => onSelect(provider.id)}
            className="flex size-[35px] items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange"
          >
            <img src={provider.iconSrc} alt="" className="block size-[35px]" />
          </button>
        </li>
      ))}
    </ul>
  );
};
