# 💰 MONEY - 스마트 금전출납부

개인사업자를 위한 스마트 금전출납부 웹 애플리케이션

## 주요 기능

- **수입 관리**: 쇼핑몰별 판매대금 및 기타 수입 입력/관리
- **지출 관리**: 사무실/개인 지출 구분, 고정비/변동비 분류
- **대시보드**: 월별 수입·지출·잔액 요약
- **분석/비교**: 최대 12개월 추이 차트, 월별 비교표
- **예측 & 코칭**: 다음달 수입/지출 예측 + 맞춤 재무 코칭

## 기술 스택

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Backend/DB**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Deployment**: Vercel

## 로컬 개발

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 Supabase 키 입력

# 개발 서버 실행
npm run dev
```

## Supabase 설정

1. [Supabase 대시보드](https://supabase.com/dashboard/project/isjnmoithzgefvrbhzpy)에 접속
2. SQL 에디터에서 `supabase/schema.sql` 실행
3. 프로젝트 설정 > API에서 `anon key` 복사
4. `.env.local`에 키 입력

## 환경변수

```env
NEXT_PUBLIC_SUPABASE_URL=https://isjnmoithzgefvrbhzpy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## Vercel 배포

1. GitHub에 푸시
2. [Vercel](https://vercel.com)에서 GitHub 저장소 연결
3. 환경변수 설정 후 배포
