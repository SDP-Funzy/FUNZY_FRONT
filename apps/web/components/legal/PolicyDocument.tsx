import type { ReactNode } from 'react';

export type PolicyKind = 'terms' | 'privacy';
const Section = ({ title, children }: { title: string; children: ReactNode }) => <section className="space-y-[8px]"><h3 className="font-semibold">{title}</h3>{children}</section>;
const List = ({ items }: { items: ReactNode[] }) => <ul className="list-disc space-y-[4px] pl-[20px]">{items.map((item, index) => <li key={index}>{item}</li>)}</ul>;
const ExternalLink = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{children}</a>;
const Table = ({ label, headings, rows }: { label: string; headings: string[]; rows: string[][] }) => <div role="region" aria-label={label} tabIndex={0} className="max-w-full overflow-x-auto rounded-control border border-gray-m-100 focus-visible:outline-2 focus-visible:outline-orange"><table className="w-full min-w-[480px] border-collapse text-left text-12"><caption className="sr-only">{label}</caption><thead className="bg-gray-m-50"><tr>{headings.map(heading => <th key={heading} scope="col" className="border-b border-gray-m-100 px-[12px] py-[10px] font-semibold">{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, column) => <td key={column} className="border-b border-gray-m-100 px-[12px] py-[10px] align-top">{cell}</td>)}</tr>)}</tbody></table></div>;

export const PolicyIntroduction = () => <div className="space-y-[12px] text-12 leading-[1.8]">
  <p>Funzy(이하 &quot;회사&quot;)는 이용자의 개인정보를 소중히 여기며, 「개인정보 보호법」 및 관련 법령을 준수합니다. 본 방침은 회사가 운영하는 디지털 마음카드·선물카드 서비스 Funzy에 적용됩니다.</p>
  <List items={['시행일: 2026.11.02', '최종 수정일: 2026.11.02', '버전: v1.0']} />
</div>;
const Terms = () => <>
  <Section title="제1조 목적"><p>이 약관은 Funzy(이하 &quot;회사&quot;)가 제공하는 디지털 마음카드·선물카드 서비스(이하 &quot;서비스&quot;)의 이용 조건과 회사·이용자의 권리, 의무를 정합니다.</p></Section>
  <Section title="제2조 서비스 내용"><List items={[
    '마음카드: 사진, 카테고리(음악·영화/TV·장소·책·패션·직접 입력), 글로 카드 작성',
    '선물카드(두들픽): 선물 후보를 그려 보내면 받는 사람이 하나를 고름',
    '전송: 링크 복사, 카카오톡 공유',
    '보관함·아카이브: 받은 카드 보관, 카테고리별 모음, 공개 여부 설정',
    '친구·반응: 아이디로 친구 찾기, 댓글·좋아요, 알림',
  ]} /><p>서비스 내용은 운영상 필요에 따라 바뀔 수 있으며, 중요한 변경은 미리 공지합니다.</p></Section>
  <Section title="제3조 회원가입과 계정"><List items={[
    '만 14세 이상이면 이메일 또는 구글·네이버·카카오 계정으로 가입할 수 있습니다.',
    '계정은 본인만 사용해야 하며, 관리 책임은 회원에게 있습니다.',
    '타인의 정보로 가입하면 이용이 제한될 수 있습니다.',
  ]} /></Section>
  <Section title="제4조 링크로 받은 카드"><List items={[
    '링크를 받은 사람은 가입 없이 카드를 볼 수 있습니다. 선물 고르기와 보관은 로그인이 필요합니다.',
    '링크를 아는 사람은 누구나 카드를 볼 수 있으니 받는 사람에게만 보내 주세요.',
  ]} /></Section>
  <Section title="제5조 선물카드(두들픽)"><p>Funzy는 상품을 판매하거나 배송하지 않습니다. 고른 선물을 실제로 주고받을지는 회원끼리 정하며, 회사는 그 이행에 책임지지 않습니다.</p></Section>
  <Section title="제6조 콘텐츠"><List items={[
    '카드, 사진, 그림, 댓글의 권리는 작성한 회원에게 있습니다.',
    '회사는 서비스 제공에 필요한 범위(저장·표시·전송·썸네일·백업)에서만 이용합니다. 홍보 등 다른 목적에는 별도 동의를 받으며, AI 학습에는 이용하지 않습니다.',
    '타인의 사진이나 저작물을 올릴 때는 권리자의 허락이 필요합니다.',
  ]} /></Section>
  <Section title="제7조 금지 행위"><List items={[
    '타인 사칭, 계정 도용·양도',
    '욕설·비방, 음란물, 동의 없는 타인 사진·개인정보 게시',
    '원치 않는 카드나 댓글을 반복해서 보내는 행위',
    '광고·스팸, 서비스 운영 방해',
  ]} /><p>위반하면 콘텐츠 삭제, 이용 정지, 탈퇴 처리가 단계적으로 이뤄질 수 있으며, 이의가 있으면 고객센터로 신청할 수 있습니다. 권리 침해 신고를 받은 콘텐츠는 관련 법령에 따라 최대 30일간 임시로 가려질 수 있습니다.</p></Section>
  <Section title="제8조 회원 탈퇴"><List items={[
    '설정 > 프로필 > 회원탈퇴에서 언제든 탈퇴할 수 있습니다.',
    '탈퇴하면 계정 정보, 보관함, 아카이브, 댓글이 삭제되며 복구할 수 없습니다.',
    '이미 보낸 카드는 받은 사람의 보관함에 남고, 보낸 사람은 "탈퇴한 회원"으로 표시됩니다.',
  ]} /></Section>
  <Section title="제9조 책임의 제한"><p>천재지변, 통신 장애처럼 회사가 통제할 수 없는 사유, 회원의 귀책 사유로 생긴 손해, 회원 간 분쟁에 대해서는 회사의 고의나 과실이 없는 한 책임지지 않습니다.</p></Section>
  <Section title="제10조 약관 변경과 분쟁"><List items={[
    '약관을 바꿀 때는 시행 7일 전(회원에게 불리한 변경은 30일 전)에 서비스 내에 공지합니다.',
    '분쟁에는 대한민국 법을 적용하며, 민사소송법상 관할 법원에서 해결합니다.',
  ]} /></Section>
</>;
const Privacy = () => <>
  <p>Funzy는 「개인정보 보호법」을 지키며, 이용자의 개인정보를 아래와 같이 처리합니다.</p>
  <Section title="제1조 수집하는 개인정보"><List items={[
    '회원가입(필수): 이메일, 아이디, 비밀번호, 이름 / 소셜 로그인 시 계정 식별값, 이메일, 이름(닉네임)',
    '프로필(선택): 프로필 사진',
    '카드·아카이브(이용 시): 작성한 글, 업로드한 사진, 그림, 친구 관계, 댓글·좋아요',
    '알림(허용 시): 웹 푸시 구독 정보',
    '자동 수집: 접속 IP, 접속 일시, 이용 기록, 브라우저·기기 정보, 쿠키',
    '링크로 카드를 연 비회원: 접속 IP, 접속 일시, 브라우저 정보',
  ]} /><p>사진의 촬영 위치 정보(EXIF)는 저장 전에 지웁니다. 만 14세 미만의 개인정보는 수집하지 않습니다.</p></Section>
  <Section title="제2조 이용 목적"><List items={[
    '회원 식별, 가입·탈퇴, 계정 관리',
    '카드 작성·전송·보관, 친구·댓글·알림 기능 제공',
    '부정 이용 방지, 오류 분석, 서비스 개선',
    '문의 응대',
  ]} /><p>보낸 카드는 받는 사람이, 공개로 설정한 아카이브는 친구가 볼 수 있습니다.</p></Section>
  <Section title="제3조 보유 기간"><p>탈퇴하면 지체 없이 삭제합니다. 다만 아래 정보는 정해진 기간 동안 보관합니다.</p><List items={[
    '서비스 접속 기록: 3개월(통신비밀보호법)',
    '부정 이용 방지를 위한 탈퇴 회원 식별값: 탈퇴 후 30일',
    '문의·신고 처리 기록: 처리 후 1년',
  ]} /></Section>
  <Section title="제4조 제3자 제공"><p>개인정보를 제3자에게 제공하지 않습니다. 법령에 근거가 있거나 이용자가 동의한 경우에만 예외로 합니다.</p></Section>
  <Section title="제5조 처리 위탁과 국외 이전"><p>서비스 운영을 위해 아래 업무를 외부에 맡기고 있습니다.</p>
    <Table label="개인정보 처리 위탁" headings={['수탁자', '업무']} rows={[
      ['Amazon Web Services, Inc.', '서버 운영, 데이터·이미지 저장 (서울 리전)'],
      ['이용자 브라우저의 푸시 서비스 제공자 (Google LLC, Apple Inc., Mozilla Corporation, Microsoft Corporation)', '웹 푸시 알림 전달'],
      ['Google LLC (Gmail)', '회원가입 인증번호 메일 발송'],
    ]} />
    <p>이 중 아래 정보는 해외에 있는 서버로 전송됩니다.</p>
    <Table label="개인정보 국외 이전" headings={['이전받는 자', '이전 국가', '이전 항목', '이전 목적', '보유 기간']} rows={[
      ['이용자 브라우저의 푸시 서비스 제공자', '미국', '웹 푸시 구독 정보, 암호화된 알림 내용', '알림 전달', '알림 전달 완료 시까지'],
      ['Google LLC', '미국', '이메일 주소, 인증번호 메일 내용', '인증번호 메일 발송', '발송 완료 후 Google 정책에 따른 기간'],
    ]} />
    <List items={[
      '이전 일시·방법: 알림을 보내거나 인증 메일을 발송할 때마다 네트워크로 전송',
      '푸시 서비스 제공자는 이용자가 쓰는 브라우저에 따라 정해지며, 알림 내용은 암호화되어 제공자가 볼 수 없습니다.',
      <>이전받는 자 연락처: 각 사의 개인정보 문의 창구(Google <ExternalLink href="http://policies.google.com/privacy">policies.google.com/privacy</ExternalLink> · Apple <ExternalLink href="http://apple.com/legal/privacy/contact">apple.com/legal/privacy/contact</ExternalLink> · Mozilla <ExternalLink href="http://mozilla.org/privacy">mozilla.org/privacy</ExternalLink> · Microsoft <ExternalLink href="http://privacy.microsoft.com/">privacy.microsoft.com</ExternalLink>)</>,
      '거부 방법: 알림을 끄면 푸시 관련 이전이 멈춥니다. 이메일 인증을 원하지 않으면 소셜 로그인으로 가입할 수 있습니다. 거부하면 해당 기능만 이용할 수 없습니다.',
    ]} />
  </Section>
  <Section title="제6조 이용자의 권리"><List items={[
    '언제든 개인정보 열람, 정정, 삭제, 처리 정지, 동의 철회를 요청할 수 있습니다.',
    '설정 > 프로필에서 직접 수정하거나 탈퇴할 수 있고, 아래 이메일로 요청하면 10일 이내에 처리합니다.',
  ]} /></Section>
  <Section title="제7조 파기"><p>보유 기간이 끝나면 복구할 수 없는 방법으로 지체 없이 삭제합니다.</p></Section>
  <Section title="제8조 쿠키"><p>로그인 유지와 이용 통계를 위해 쿠키를 사용합니다. 브라우저 설정에서 거부할 수 있지만 로그인이 유지되지 않을 수 있습니다. 맞춤형 광고를 위한 정보는 수집하지 않습니다.</p></Section>
  <Section title="제9조 안전성 확보 조치"><List items={[
    '비밀번호 암호화 저장, 전 구간 HTTPS 통신',
    '접근 권한 최소화, 접속 기록 보관',
    '유출 등이 발생하거나 그 가능성을 알게 되면 72시간 이내에 알립니다.',
  ]} /></Section>
  <Section title="제10조 개인정보 보호책임자"><List items={[
    '담당: Funzy 개인정보 보호팀',
    <>이메일: <a href="mailto:sdpygl@gmail.com" className="underline underline-offset-2">sdpygl@gmail.com</a></>,
    '처리 기간: 영업일 기준 3일 이내',
  ]} /><p>그 밖의 신고·상담: 개인정보침해신고센터(118, <ExternalLink href="http://privacy.kisa.or.kr/">privacy.kisa.or.kr</ExternalLink>), 개인정보분쟁조정위원회(1833-6972, <ExternalLink href="http://kopico.go.kr/">kopico.go.kr</ExternalLink>), 대검찰청(1301), 경찰청(182)</p></Section>
  <Section title="제11조 처리방침 변경"><p>변경 시 시행 7일 전(중요한 변경은 30일 전)에 서비스 내에 공지합니다.</p></Section>
</>;

export const PolicyDocument = ({ kind, introduction = true, showTitle = true }: { kind: PolicyKind; introduction?: boolean; showTitle?: boolean }) => <article className="min-w-0 space-y-[20px] text-left text-12 leading-[1.8] break-words text-black">
  {introduction && <PolicyIntroduction />}
  {showTitle && <h2 className="text-16 font-bold">{kind === 'terms' ? '서비스 이용약관' : '개인정보처리방침'}</h2>}
  {kind === 'terms' ? <Terms /> : <Privacy />}
  <p className="border-t border-gray-m-100 pt-[16px] text-gray-m-500">© 2026 Funzy. All rights reserved.</p>
</article>;
