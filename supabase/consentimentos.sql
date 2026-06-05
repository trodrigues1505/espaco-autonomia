-- Tabela de consentimentos LGPD
CREATE TABLE IF NOT EXISTS consentimentos (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  aluno_id      uuid NOT NULL REFERENCES perfis(id) ON DELETE CASCADE,
  versao        text NOT NULL DEFAULT 'v1',
  nivel         text NOT NULL DEFAULT 'accepted', -- 'accepted' | 'essential_only'
  aceito_em     timestamptz NOT NULL DEFAULT now(),
  user_agent    text,
  idioma        text DEFAULT 'pt-BR',
  UNIQUE (aluno_id, versao)
);

-- RLS
ALTER TABLE consentimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario ve proprio consentimento"
  ON consentimentos FOR SELECT
  TO authenticated
  USING (aluno_id = auth.uid());

CREATE POLICY "usuario insere proprio consentimento"
  ON consentimentos FOR INSERT
  TO authenticated
  WITH CHECK (aluno_id = auth.uid());

CREATE POLICY "usuario atualiza proprio consentimento"
  ON consentimentos FOR UPDATE
  TO authenticated
  USING (aluno_id = auth.uid());

CREATE POLICY "admin ve todos consentimentos"
  ON consentimentos FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND tipo = 'admin'));
