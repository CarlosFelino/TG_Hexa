CREATE TABLE ordens_alertas (
    id SERIAL PRIMARY KEY,
    ordem_id INT NOT NULL REFERENCES ordens(id) ON DELETE CASCADE,
    tipo_alerta VARCHAR(30) NOT NULL CHECK (tipo_alerta IN ('prazo', 'sem_responsavel')),
    data_alerta TIMESTAMP DEFAULT NOW(),
    ativo BOOLEAN DEFAULT TRUE,
    resolvido_em TIMESTAMP DEFAULT NULL
);


-- ========================================
-- MIGRAÇÃO SEGURA: ordens_alertas
-- Adapta tabela existente para o novo modelo
-- ========================================

BEGIN;

-- ========================================
-- 1. BACKUP DE SEGURANÇA (Opcional mas recomendado)
-- ========================================
-- Descomente se quiser guardar os dados antigos
-- CREATE TABLE ordens_alertas_backup AS SELECT * FROM ordens_alertas;

-- ========================================
-- 2. AUMENTAR TAMANHO DO CAMPO tipo_alerta
-- ========================================
DO $$
BEGIN
    ALTER TABLE ordens_alertas
        ALTER COLUMN tipo_alerta TYPE VARCHAR(50);
    RAISE NOTICE '✅ Campo tipo_alerta expandido para VARCHAR(50)';
END$$;

-- ========================================
-- 3. RENOMEAR COLUNA data_alerta → criado_em
-- ========================================
DO $$
BEGIN
    ALTER TABLE ordens_alertas
        RENAME COLUMN data_alerta TO criado_em;
    RAISE NOTICE '✅ Coluna data_alerta renomeada para criado_em';
END$$;

-- ========================================
-- 4. AJUSTAR DEFAULT da coluna criado_em
-- ========================================
DO $$
BEGIN
    ALTER TABLE ordens_alertas
        ALTER COLUMN criado_em SET DEFAULT CURRENT_TIMESTAMP;
    RAISE NOTICE '✅ Default de criado_em ajustado';
END$$;

-- ========================================
-- 5. GARANTIR QUE resolvido_em ACEITE NULL
-- ========================================
DO $$
BEGIN
    ALTER TABLE ordens_alertas
        ALTER COLUMN resolvido_em DROP NOT NULL;

    ALTER TABLE ordens_alertas
        ALTER COLUMN resolvido_em DROP DEFAULT;

    RAISE NOTICE '✅ Coluna resolvido_em configurada para aceitar NULL';
END$$;

-- ========================================
-- 6. LIMPAR DUPLICATAS ANTES DA CONSTRAINT
-- ========================================
DO $$
DECLARE
    deletados INT;
BEGIN
    WITH duplicatas AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY ordem_id, tipo_alerta
                   ORDER BY ativo DESC, criado_em DESC, id DESC
               ) AS rn
        FROM ordens_alertas
    )
    DELETE FROM ordens_alertas
    WHERE id IN (
        SELECT id FROM duplicatas WHERE rn > 1
    );

    GET DIAGNOSTICS deletados = ROW_COUNT;
    RAISE NOTICE '✅ Duplicatas removidas: % registros deletados', deletados;
END$$;

-- ========================================
-- 7. ADICIONAR UNIQUE CONSTRAINT
-- ========================================
DO $$
BEGIN
    ALTER TABLE ordens_alertas
        ADD CONSTRAINT ordens_alertas_ordem_tipo_unq 
        UNIQUE (ordem_id, tipo_alerta);
    RAISE NOTICE '✅ Constraint UNIQUE adicionada';
EXCEPTION
    WHEN duplicate_table THEN
        RAISE NOTICE '⚠️ Constraint já existe, pulando...';
END$$;

-- ========================================
-- 8. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================
DO $$
BEGIN
    -- Índice para buscar alertas ativos rapidamente
    CREATE INDEX IF NOT EXISTS idx_alertas_ativos
        ON ordens_alertas(ativo, tipo_alerta) 
        WHERE ativo = true;

    -- Índice para buscar alertas por ordem
    CREATE INDEX IF NOT EXISTS idx_alertas_ordem
        ON ordens_alertas(ordem_id);

    -- Índice para buscar por tipo
    CREATE INDEX IF NOT EXISTS idx_alertas_tipo
        ON ordens_alertas(tipo_alerta)
        WHERE ativo = true;

    RAISE NOTICE '✅ Índices criados';
END$$;

-- ========================================
-- 9. ADICIONAR COMENTÁRIOS (Documentação)
-- ========================================
DO $$
BEGIN
    COMMENT ON TABLE ordens_alertas IS 
        'Rastreia alertas ativos para ordens de serviço. Prioridade >= 3 dispara alertas.';

    COMMENT ON COLUMN ordens_alertas.tipo_alerta IS 
        'Tipos: ''prazo'' (vencimento próximo, faltando <= 3 dias úteis) ou ''sem_responsavel'' (ordem sem técnico por >2 dias úteis)';

    COMMENT ON COLUMN ordens_alertas.ativo IS 
        'true = alerta ainda válido e deve aparecer no pop-up | false = resolvido/desativado';

    COMMENT ON COLUMN ordens_alertas.criado_em IS 
        'Data/hora em que o alerta foi criado automaticamente pelo sistema';

    COMMENT ON COLUMN ordens_alertas.resolvido_em IS 
        'Data/hora em que o alerta foi desativado (ordem assumida/concluída)';

    RAISE NOTICE '✅ Comentários adicionados';
END$$;

-- ========================================
-- 10. VERIFICAÇÃO FINAL
-- ========================================
DO $$
DECLARE
    total_alertas INT;
    alertas_ativos INT;
    alertas_resolvidos INT;
BEGIN
    SELECT COUNT(*) INTO total_alertas FROM ordens_alertas;
    SELECT COUNT(*) INTO alertas_ativos FROM ordens_alertas WHERE ativo = true;
    SELECT COUNT(*) INTO alertas_resolvidos FROM ordens_alertas WHERE ativo = false;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 ESTATÍSTICAS PÓS-MIGRAÇÃO';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total de alertas: %', total_alertas;
    RAISE NOTICE 'Alertas ativos: %', alertas_ativos;
    RAISE NOTICE 'Alertas resolvidos: %', alertas_resolvidos;
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END$$;

COMMIT;

-- ========================================
-- ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!
-- ========================================
