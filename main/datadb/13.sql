-- ============================================
-- 📌 INSERIR ORDEM DE TESTE - Vencida em 30/12/2025
-- ============================================

BEGIN;

-- ✅ Pegar o próximo ID da sequência
DO $$
DECLARE
    next_id INT;
    codigo_ordem VARCHAR(20);
BEGIN
    -- Pega próximo ID
    SELECT nextval('ordens_id_seq') INTO next_id;

    -- Gera código da ordem
    codigo_ordem := '#ORD-2025-' || LPAD(next_id::TEXT, 3, '0');

    -- ✅ Insere ordem com data_criacao = 21/12/2025 (9 dias atrás de 30/12)
    -- Assim data_limite será 30/12/2025 (data_criacao + 9 dias)
    INSERT INTO ordens (
        id,
        codigo,
        criador_id,
        responsavel_id,
        tipo_solicitacao,
        local_tipo,
        local_detalhe,
        titulo,
        descricao,
        status,
        prioridade,
        data_criacao,
        data_atualizacao
    ) VALUES (
        next_id,
        codigo_ordem,
        1,  -- Spock (professor) criou
        3,  -- Han Solo (suporte) é responsável
        'problema',
        'sala',
        'Sala 205',
        'Sala 205 - Projetor',
        'Projetor não liga e apresenta tela azul',
        'Em Andamento',  -- ⚠️ Status que DEVERIA ser "Não Concluída"
        3,  -- Prioridade padrão
        '2025-11-21 10:00:00'::TIMESTAMP,  -- ✅ 21/12/2025 (9 dias antes de 30/12)
        NOW()
    );

    -- ✅ Insere detalhes do problema
    INSERT INTO ordens_problemas (
        ordem_id,
        equipamento,
        tipo_problema
    ) VALUES (
        next_id,
        'Projetor',
        'Não liga'
    );

    RAISE NOTICE '✅ Ordem criada: % | Data limite: 30/12/2025', codigo_ordem;
    RAISE NOTICE '⚠️  Status atual: Em Andamento (deveria mudar para "Não Concluída")';
    RAISE NOTICE '📋 Para testar, acesse: /api/ordens ou force atualização';
END$$;

COMMIT;
