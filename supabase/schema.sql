-- MONEY 금전출납부 앱 - Supabase 스키마

-- 입금처 테이블
CREATE TABLE IF NOT EXISTS income_sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 지출 카테고리 테이블
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('office', 'personal')),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 거래 내역 테이블
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type VARCHAR(10) NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount BIGINT NOT NULL,
  transaction_date DATE NOT NULL,
  description TEXT,
  memo TEXT,
  payment_method VARCHAR(50),
  income_source_id UUID REFERENCES income_sources(id) ON DELETE SET NULL,
  expense_category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  expense_type VARCHAR(20) CHECK (expense_type IN ('office', 'personal')),
  is_fixed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기존 테이블에 결제수단 컬럼 추가 (이미 테이블이 있는 경우)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- 월별 예산 목표 테이블
CREATE TABLE IF NOT EXISTS monthly_budgets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  income_target BIGINT DEFAULT 0,
  office_expense_budget BIGINT DEFAULT 0,
  personal_expense_budget BIGINT DEFAULT 0,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(year, month)
);

-- 수입 카테고리 (판매대금 / 기타)
INSERT INTO income_sources (name, description) VALUES
  ('판매대금', '쇼핑몰 판매 수입'),
  ('기타', '기타 수입')
ON CONFLICT DO NOTHING;

-- 기본 지출 카테고리 - 사무실용
INSERT INTO expense_categories (name, type, description) VALUES
  ('재료비/원가', 'office', '판매 상품 원가 및 재료비'),
  ('포장재', 'office', '박스, 완충재, 테이프 등'),
  ('택배비', 'office', '배송 택배비'),
  ('플랫폼 수수료', 'office', '쇼핑몰 판매 수수료'),
  ('광고비', 'office', '온라인 광고비'),
  ('사무용품', 'office', '사무실 용품 구매'),
  ('임차료', 'office', '사무실/창고 임대료'),
  ('통신비', 'office', '사업용 통신비'),
  ('공과금', 'office', '전기/수도/가스 등'),
  ('인건비', 'office', '직원 급여/알바비'),
  ('세금/공과', 'office', '세금, 4대보험 등'),
  ('기타업무비', 'office', '기타 사업 관련 지출')
ON CONFLICT DO NOTHING;

-- 기본 지출 카테고리 - 개인용
INSERT INTO expense_categories (name, type, description) VALUES
  ('식비', 'personal', '개인 식사비'),
  ('교통비', 'personal', '개인 교통비'),
  ('의료비', 'personal', '병원/약국'),
  ('의류비', 'personal', '의류 구매'),
  ('문화/여가', 'personal', '영화, 취미, 여행 등'),
  ('교육비', 'personal', '자기계발, 학원 등'),
  ('보험료', 'personal', '개인 보험'),
  ('경조사비', 'personal', '결혼, 장례 등'),
  ('주거비', 'personal', '월세, 관리비 등'),
  ('기타개인비', 'personal', '기타 개인 지출')
ON CONFLICT DO NOTHING;

-- 내역 프리셋 테이블 (수입 내역 빠른 선택)
CREATE TABLE IF NOT EXISTS description_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE description_presets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on description_presets" ON description_presets FOR ALL USING (true) WITH CHECK (true);

INSERT INTO description_presets (name) VALUES
  ('스마트스토어'), ('토스쇼핑'), ('지마켓'), ('옥션'), ('쿠팡'), ('11번가')
ON CONFLICT DO NOTHING;

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- RLS 활성화
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_budgets ENABLE ROW LEVEL SECURITY;

-- 공개 접근 정책 (개인 사용 앱)
CREATE POLICY "Allow all on income_sources" ON income_sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on expense_categories" ON expense_categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on monthly_budgets" ON monthly_budgets FOR ALL USING (true) WITH CHECK (true);
