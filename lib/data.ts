export type Author = { id: string; name: string; handle: string; bio: string; avatar: string; color: string };
export type Comment = { id: string; author: string; avatar: string; body: string; createdAt: string };
export type Post = { id: string; authorId: string; title: string; excerpt: string; content: string; category: string; cover: string; createdAt: string; readTime: number; likes: number; views: number; comments: Comment[] };

export const currentUser: Author = { id: "me", name: "민서", handle: "minseo.log", bio: "제품과 일상 사이의 작은 발견을 기록합니다.", avatar: "민", color: "#3182f6" };
export const authors: Author[] = [
  currentUser,
  { id: "a1", name: "서윤", handle: "seoyoon.design", bio: "좋은 경험을 설계하는 프로덕트 디자이너", avatar: "서", color: "#8b5cf6" },
  { id: "a2", name: "지호", handle: "jiho.codes", bio: "복잡한 기술을 단순하게 설명합니다", avatar: "지", color: "#12b886" },
  { id: "a3", name: "하늘", handle: "sky.archive", bio: "여행과 공간, 그 안의 사람들", avatar: "하", color: "#f59f00" },
  { id: "a4", name: "도윤", handle: "doyoon.note", bio: "더 나은 일의 방식을 고민합니다", avatar: "도", color: "#f06595" },
];

const detail: Record<string, string> = {
  design: "<h2>좋은 화면은 망설임을 줄입니다</h2><p>사용자는 화면을 꼼꼼히 읽지 않습니다. 익숙한 패턴과 시각적 단서를 따라 빠르게 판단하죠. 디자인의 역할은 지금 필요한 선택을 선명하게 만드는 데 있습니다.</p><blockquote>명확함은 친절함의 또 다른 이름입니다.</blockquote><h3>하나의 화면, 하나의 목적</h3><p>강조해야 할 행동을 하나만 정해보세요. 색상, 여백, 문장의 강약이 모두 같은 방향을 가리킬 때 사용자는 자연스럽게 움직입니다.</p><ul><li>핵심 행동에는 가장 강한 색을 사용하기</li><li>버튼의 문구는 결과를 예상할 수 있게 쓰기</li><li>관련 정보는 가까이 배치하기</li></ul>",
  code: "<h2>경계를 먼저 설계하세요</h2><p>App Router에서 가장 중요한 선택은 서버와 클라이언트의 경계입니다. 상호작용이 필요한 가장 작은 단위에만 클라이언트 컴포넌트를 적용하면 번들 크기와 복잡도를 함께 낮출 수 있습니다.</p><h3>데이터는 사용하는 곳 가까이</h3><p>페이지 최상단에서 모든 데이터를 가져오기보다 실제 사용하는 컴포넌트 가까이에서 요청하세요.</p>",
  travel: "<h2>조금 느리게 만난 도시</h2><p>아침 일찍 데마치야나기 역을 나섰습니다. 목적지를 촘촘하게 정하는 대신 강을 따라 걷다가 마음이 가는 골목으로 방향을 틀었습니다.</p><p>작은 찻집의 나무문, 자전거 바구니에 담긴 꽃. 여행의 기억은 늘 계획표 밖에서 더 선명해지는 것 같습니다.</p>",
  career: "<h2>지속 가능함에 대하여</h2><p>잘하는 일은 중요합니다. 하지만 오래 이어가려면 잘한다는 감각만큼 에너지가 회복되는 방식도 알아야 합니다.</p><blockquote>어떤 일을 끝낸 뒤, 나는 더 살아나는가?</blockquote><p>이 질문은 좋아하는 일과 그저 익숙한 일을 구분하는 데 도움이 되었습니다.</p>",
  life: "<h2>한 문장이면 충분합니다</h2><p>기록을 거창하게 시작하면 오래가기 어렵습니다. 오늘 발견한 것, 고마웠던 것, 내일 바꾸고 싶은 것 중 하나만 적어보세요.</p><p>짧은 기록은 부담 없이 쌓이고, 어느새 나를 이해하는 좋은 자료가 됩니다.</p>"
};

export const seedPosts: Post[] = [
  { id: "p1", authorId: "a1", category: "디자인", cover: "violet", createdAt: "2026. 10. 14", readTime: 6, likes: 128, views: 1842, title: "사용자가 망설이지 않는 화면을 만드는 법", excerpt: "좋은 인터페이스는 설명하지 않아도 다음 행동을 알려줍니다. 작은 선택들이 만드는 큰 차이를 이야기합니다.", content: detail.design, comments: [{ id: "c1", author: "지호", avatar: "지", body: "‘명확함은 친절함’이라는 문장이 오래 남네요.", createdAt: "2시간 전" }] },
  { id: "p2", authorId: "a2", category: "개발", cover: "mint", createdAt: "2026. 10. 13", readTime: 8, likes: 94, views: 1320, title: "Next.js App Router, 실무에서 배운 것들", excerpt: "서버 컴포넌트부터 캐싱 전략까지. 프로젝트를 운영하며 알게 된 실전 패턴을 정리했습니다.", content: detail.code, comments: [] },
  { id: "p3", authorId: "a3", category: "여행", cover: "sunset", createdAt: "2026. 10. 12", readTime: 5, likes: 211, views: 2964, title: "가을의 교토, 천천히 걷는 하루", excerpt: "유명한 장소보다 골목에서 만난 장면들이 더 오래 남았습니다. 교토 북쪽에서 보낸 느린 하루.", content: detail.travel, comments: [] },
  { id: "p4", authorId: "a4", category: "커리어", cover: "blue", createdAt: "2026. 10. 10", readTime: 7, likes: 76, views: 980, title: "잘하는 일보다 오래 할 수 있는 일을 찾기", excerpt: "커리어의 방향을 바꾼 세 가지 질문. 속도보다 방향이 중요하다는 흔한 말을 이제야 이해했습니다.", content: detail.career, comments: [] },
  { id: "p5", authorId: "me", category: "라이프", cover: "coral", createdAt: "2026. 10. 08", readTime: 4, likes: 43, views: 614, title: "일상을 가볍게 만드는 작은 기록 습관", excerpt: "완벽한 회고 대신 하루 한 문장. 꾸준히 기록할 수 있게 해준 작고 단순한 방법입니다.", content: detail.life, comments: [] }
];
