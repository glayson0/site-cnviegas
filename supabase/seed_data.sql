-- ==============================================================================
-- BIBLIOTECA COLETIVO NEGRO VIEGAS D'ABREU
-- Script SQL para Setup de RLS, Usuários de Teste e Carga de Livros no Supabase
--
-- Como usar:
-- 1. Acesse o painel do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique em "SQL Editor"
-- 3. Crie uma "New query", cole este script completo e clique em "Run"
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEGURANÇA E POLÍTICAS DE ACESSO (Row Level Security - RLS)
-- ------------------------------------------------------------------------------

-- Habilita RLS nas tabelas
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para a tabela 'books'
DROP POLICY IF EXISTS "Permitir leitura pública de livros" ON public.books;
CREATE POLICY "Permitir leitura pública de livros"
  ON public.books FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir inserção de livros" ON public.books;
CREATE POLICY "Permitir inserção de livros"
  ON public.books FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de livros" ON public.books;
CREATE POLICY "Permitir atualização de livros"
  ON public.books FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir exclusão de livros" ON public.books;
CREATE POLICY "Permitir exclusão de livros"
  ON public.books FOR DELETE
  TO authenticated, anon
  USING (true);

-- Políticas para a tabela 'loans'
DROP POLICY IF EXISTS "Permitir leitura de empréstimos" ON public.loans;
CREATE POLICY "Permitir leitura de empréstimos"
  ON public.loans FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Permitir criação de empréstimos" ON public.loans;
CREATE POLICY "Permitir criação de empréstimos"
  ON public.loans FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir atualização de empréstimos" ON public.loans;
CREATE POLICY "Permitir atualização de empréstimos"
  ON public.loans FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Políticas para a tabela 'renewals'
DROP POLICY IF EXISTS "Permitir leitura de renovações" ON public.renewals;
CREATE POLICY "Permitir leitura de renovações"
  ON public.renewals FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Permitir inserção de renovações" ON public.renewals;
CREATE POLICY "Permitir inserção de renovações"
  ON public.renewals FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Políticas para a tabela 'profiles'
DROP POLICY IF EXISTS "Permitir leitura de perfis" ON public.profiles;
CREATE POLICY "Permitir leitura de perfis"
  ON public.profiles FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Permitir atualização de perfis" ON public.profiles;
CREATE POLICY "Permitir atualização de perfis"
  ON public.profiles FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. USUÁRIOS DE DEMONSTRAÇÃO (Auth & Profiles)
-- Senha padrão de todos: demo123456
-- ------------------------------------------------------------------------------

-- Inserir usuários no auth.users caso ainda não existam
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin,
  confirmation_token, recovery_token,
  email_change_token_new, email_change
)
SELECT
  u.id, '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', u.email,
  extensions.crypt('demo123456', extensions.gen_salt('bf')),
  now(), now(), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', u.name),
  false,
  '', '', '', ''
FROM (VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'admin@cnviegas.org',   'Coordenação da Biblioteca'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'leitor@cnviegas.org',  'Leitor Comunitário'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'beatriz@cnviegas.org', 'Beatriz Nascimento'),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'lucas@cnviegas.org',   'Lucas Andrade')
) AS u(id, email, name)
ON CONFLICT (id) DO NOTHING;

-- Inserir ou atualizar na tabela public.profiles
INSERT INTO public.profiles (id, name, email, role)
VALUES
  ('d0000000-0000-0000-0000-000000000001'::uuid, 'Coordenação da Biblioteca', 'admin@cnviegas.org', 'admin'),
  ('d0000000-0000-0000-0000-000000000002'::uuid, 'Leitor Comunitário', 'leitor@cnviegas.org', 'reader'),
  ('d0000000-0000-0000-0000-000000000003'::uuid, 'Beatriz Nascimento', 'beatriz@cnviegas.org', 'reader'),
  ('d0000000-0000-0000-0000-000000000004'::uuid, 'Lucas Andrade', 'lucas@cnviegas.org', 'reader')
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  email = excluded.email,
  role = excluded.role;

-- ------------------------------------------------------------------------------
-- 3. CARGA DO ACERVO DE LIVROS (Tabela public.books)
-- ------------------------------------------------------------------------------

INSERT INTO public.books (title, author, notes, available)
SELECT b.title, b.author, b.notes, b.available
FROM (VALUES
  (
    'Pedagogia do Oprimido',
    'Paulo Freire',
    'Obra fundamental da educação popular crítica mundial. Propõe uma práxis libertadora que visa transformar a relação opressor-oprimido por meio do diálogo consciente.',
    true
  ),
  (
    'Quarto de Despejo: Diário de uma Favelada',
    'Carolina Maria de Jesus',
    'O diário cru, poético e contundente de Carolina Maria de Jesus, narrando a luta diária pela sobrevivência e pela dignidade na favela do Canindé em São Paulo.',
    true
  ),
  (
    'Ideias para Adiar o Fim do Mundo',
    'Ailton Krenak',
    'Reflexões urgentes sobre o antropoceno, a desconexão do ser humano com a Terra e a riqueza cósmica dos saberes originários para resistir e reinventar a vida.',
    true
  ),
  (
    'Calibã e a Bruxa: Mulheres, Corpo e Acumulação Primitiva',
    'Silvia Federici',
    'Investigação histórica crucial que relaciona a caça às bruxas na Europa e a colonização das Américas à instauração do capitalismo e à subjugação do trabalho reprodutivo feminino.',
    true
  ),
  (
    'Torto Arado',
    'Itamar Vieira Junior',
    'Romance épico no sertão baiano sobre a vida de duas irmãs marcadas por um acidente de infância e a luta por terra, ancestralidade e liberdade.',
    true
  ),
  (
    'Peles Negras, Máscaras Brancas',
    'Frantz Fanon',
    'Análise psicanalítica e social pioneira sobre os efeitos alienantes da dominação colonial e do racismo na subjetividade dos indivíduos racializados.',
    false
  ),
  (
    'A Queda do Céu: Palavras de um Xamã Yanomami',
    'Davi Kopenawa e Bruce Albert',
    'Testemunho xamânico e denúncia profética da destruição da floresta amazônica pelos comedores de terra, trazendo uma visão cosmológica profunda sobre o equilíbrio do planeta.',
    true
  ),
  (
    'Necropolítica',
    'Achille Mbembe',
    'Ensaio teórico fundamental que conceitua o poder de ditar quem pode viver e quem deve morrer como a expressão máxima da soberania no mundo contemporâneo.',
    true
  ),
  (
    'O Povo Brasileiro: A Formação e o Sentido do Brasil',
    'Darcy Ribeiro',
    'Um clássico do pensamento sociológico brasileiro que examina a gestação étnica, a dor do processo colonizador e a potência criadora da civilização brasileira.',
    true
  ),
  (
    'Feminismo para os 99%: Um Manifesto',
    'Cinzia Arruzza, Tithi Bhattacharya, Nancy Fraser',
    'Manifesto urgente por um feminismo anticapitalista, antirracista e ecológico, que rompa com a lógica liberal corporativa e enfrente a crise da reprodução social.',
    true
  ),
  (
    'Poemas dos Becos de Goiás e Estórias Mais',
    'Cora Coralina',
    'A lírica telúrica e doce de Cora Coralina, entoando a sabedoria das mulheres cozinheiras, as pedras dos becos e o pulsar simples e profundo da vida.',
    true
  ),
  (
    'Zine Autonomia & Resistência Cultural (Edição Coletiva #01)',
    'Coletivo Negro Viegas D''Abreu',
    'Publicação impressa e serigrafada pelo coletivo, reunindo ensaios curtos, colagens, poesia marginal e relatos da horta e biblioteca comunitária.',
    true
  )
) AS b(title, author, notes, available)
WHERE NOT EXISTS (
  SELECT 1 FROM public.books WHERE books.title = b.title
);

-- ------------------------------------------------------------------------------
-- 4. EXEMPLOS DE EMPRÉSTIMOS INICIAIS (Tabela public.loans)
-- ------------------------------------------------------------------------------

-- Empréstimo 1: "Peles Negras, Máscaras Brancas" para Leitor Comunitário
INSERT INTO public.loans (book_id, user_id, notes, borrowed_at, due_date)
SELECT 
  b.id,
  'd0000000-0000-0000-0000-000000000002'::uuid,
  'Pesquisa acadêmica para grupo de estudos.',
  (now() - interval '14 days')::timestamptz,
  now()::timestamptz
FROM public.books b 
WHERE b.title ILIKE 'Peles Negras%'
  AND NOT EXISTS (
    SELECT 1 FROM public.loans l WHERE l.book_id = b.id AND l.returned_at IS NULL
  )
LIMIT 1;

-- Empréstimo 2: "Pedagogia do Oprimido" para Beatriz Nascimento
INSERT INTO public.loans (book_id, user_id, notes, borrowed_at, due_date)
SELECT 
  b.id,
  'd0000000-0000-0000-0000-000000000003'::uuid,
  'Uso na oficina de alfabetização de jovens e adultos.',
  (now() - interval '5 days')::timestamptz,
  (now() + interval '9 days')::timestamptz
FROM public.books b 
WHERE b.title ILIKE 'Pedagogia do Oprimido%'
  AND NOT EXISTS (
    SELECT 1 FROM public.loans l WHERE l.book_id = b.id AND l.returned_at IS NULL
  )
LIMIT 1;
