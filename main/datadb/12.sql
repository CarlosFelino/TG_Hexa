-- ========================================
-- 📋 SCRIPT PARA POVOAR TABELA DE ORDENS
-- ========================================
-- Data de referência: 30/11/2025
-- Prazo: 9 dias corridos para conclusão
-- ✅ ORDENS EM ORDEM CRONOLÓGICA (ID crescente = data crescente)
-- ========================================

BEGIN;

-- ========================================
-- 🧹 LIMPAR TODOS OS DADOS
-- ========================================
TRUNCATE TABLE ordens_alertas RESTART IDENTITY CASCADE;
TRUNCATE TABLE ordens_problemas RESTART IDENTITY CASCADE;
TRUNCATE TABLE ordens_instalacoes RESTART IDENTITY CASCADE;
TRUNCATE TABLE ordens_anexos RESTART IDENTITY CASCADE;
TRUNCATE TABLE ordens RESTART IDENTITY CASCADE;

-- ========================================
-- 📊 IDs DOS USUÁRIOS
-- ========================================
-- 1 = Spock (professor)
-- 3 = Han Solo (suporte)
-- 4 = Anakin Skywalker (suporte)
-- 5 = Daenerys Targaryen (professor)
-- 6 = Marcus Acacius (suporte)

-- ========================================
-- 🔴 ORDENS MAIS ANTIGAS (15-16 de novembro)
-- ========================================

-- Ordem 1: 15/11 - Criada há 15 dias - VENCIDA - SEM responsável
INSERT INTO ordens (
    codigo, criador_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-001',
    5, -- Daenerys
    'problema',
    'laboratorio',
    '201',
    '201 - Projetor',
    'Projetor não liga, testamos em outra tomada e o problema persiste',
    'Não Concluída',
    1,
    '2025-11-15 09:30:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'Projetor', 'Não liga');

-- Ordem 2: 15/11 - Concluída COM avaliação baixa (2 estrelas)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade, avaliacao,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-002',
    1, -- Spock
    4, -- Anakin
    'problema',
    'sala',
    '110',
    '110 - tv',
    'TV com tela preta',
    'Cabo HDMI trocado. Problema resolvido mas demorou muito.',
    'Concluída',
    1,
    2,
    '2025-11-15 21:24:00',
    '2025-11-19 10:00:00',
    '2025-11-19 10:00:00'
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'tv', 'Tela preta');

-- Ordem 3: 16/11 - Concluída COM avaliação máxima (5 estrelas)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade, avaliacao,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-003',
    5, -- Daenerys
    6, -- Marcus
    'instalacao',
    'laboratorio',
    '215',
    '215 - C#',
    'Instalar Visual Studio Community com workload .NET',
    'Visual Studio Community instalado com todas as extensões solicitadas. Teste realizado com sucesso.',
    'Concluída',
    1,
    5,
    '2025-11-16 18:03:00',
    '2025-11-21 16:30:00',
    '2025-11-21 16:30:00'
);

INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao)
VALUES (currval('ordens_id_seq'), 'Visual Studio Community', '2022');

-- ========================================
-- 🟠 ORDENS ANTIGAS - 18 a 20 de novembro
-- ========================================

-- Ordem 4: 18/11 - Criada há 12 dias - VENCIDA - COM responsável
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-004',
    1, -- Spock
    3, -- Han Solo
    'problema',
    'sala',
    '308',
    '308 - kit-professor',
    'Mouse sem fio não conecta no receptor USB',
    'Não Concluída',
    1,
    '2025-11-18 14:20:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-professor', 'Mouse não funciona');

-- Ordem 5: 18/11 - Concluída COM avaliação (5 estrelas)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade, avaliacao,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-005',
    1, -- Spock
    3, -- Han Solo
    'problema',
    'sala',
    '303',
    '303 - kit-professor',
    'Teclado não funciona',
    'Teclado substituído por um novo. Problema resolvido.',
    'Concluída',
    1,
    5,
    '2025-11-18 10:00:00',
    '2025-11-20 14:30:00',
    '2025-11-20 14:30:00'
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-professor', 'Teclado com defeito');

-- Ordem 6: 19/11 - Criada há 11 dias - VENCIDA
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-006',
    5, -- Daenerys
    4, -- Anakin
    'instalacao',
    'laboratorio',
    '216',
    '216 - Python 3.11',
    'Necessário instalar Python 3.11 com pip, numpy e pandas',
    'Não Concluída',
    1,
    '2025-11-19 10:15:00',
    NOW()
);

INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao)
VALUES (currval('ordens_id_seq'), 'Python', '3.11');

-- Ordem 7: 20/11 - Concluída COM avaliação média (3 estrelas)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade, avaliacao,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-007',
    1, -- Spock
    6, -- Marcus
    'problema',
    'laboratorio',
    '206',
    '206 - kit-aluno-desktop',
    'Computador lento',
    'Limpeza de disco e desfragmentação realizadas. Desempenho melhorou.',
    'Concluída',
    1,
    3,
    '2025-11-20 13:00:00',
    '2025-11-23 10:00:00',
    '2025-11-23 10:00:00'
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-aluno-desktop', 'Lentidão');

-- ========================================
-- 🟡 ORDENS PRÓXIMAS DO PRAZO - 21 a 25 de novembro
-- ========================================

-- Ordem 8: 21/11 - Criada há 9 dias - VENCE HOJE (prioridade 5)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-008',
    1, -- Spock
    6, -- Marcus
    'problema',
    'sala',
    '405',
    '405 - tv',
    'TV não liga, testamos controle remoto e está funcionando',
    'Em Andamento',
    5,
    '2025-11-21 08:00:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'tv', 'Não liga');

INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo, criado_em)
VALUES (currval('ordens_id_seq'), 'prazo', true, NOW());

-- Ordem 9: 22/11 - Criada há 8 dias - VENCE AMANHÃ (prioridade 4)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-009',
    5, -- Daenerys
    3, -- Han Solo
    'problema',
    'laboratorio',
    '209',
    '209 - kit-aluno-desktop',
    'Computador não conecta na rede, cabo testado e funcionando',
    'Em Andamento',
    4,
    '2025-11-22 11:30:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-aluno-desktop', 'Sem conexão com internet');

INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo, criado_em)
VALUES (currval('ordens_id_seq'), 'prazo', true, NOW());

-- Ordem 10: 22/11 - Concluída SEM avaliação
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-010',
    5, -- Daenerys
    4, -- Anakin
    'instalacao',
    'sala',
    '307',
    '307 - Node.js',
    'Instalar Node.js LTS',
    'Node.js 20.11 LTS instalado e testado com sucesso.',
    'Concluída',
    1,
    '2025-11-22 09:00:00',
    '2025-11-24 16:00:00',
    '2025-11-24 16:00:00'
);

INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao)
VALUES (currval('ordens_id_seq'), 'Node.js', '20.11 LTS');

-- Ordem 11: 23/11 - Criada há 7 dias - Faltam 2 dias (prioridade 4)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-011',
    1, -- Spock
    4, -- Anakin
    'problema',
    'laboratorio',
    '208',
    '208 - perifericos',
    'Teclado com teclas travadas',
    'Em Andamento',
    4,
    '2025-11-23 09:45:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'perifericos', 'Teclado com defeito');

INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo, criado_em)
VALUES (currval('ordens_id_seq'), 'prazo', true, NOW());

-- Ordem 12: 24/11 - Criada há 6 dias - Faltam 3 dias (prioridade 3)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-012',
    5, -- Daenerys
    6, -- Marcus
    'instalacao',
    'sala',
    '312',
    '312 - Git',
    'Instalar Git para controle de versão',
    'Em Andamento',
    3,
    '2025-11-24 13:20:00',
    NOW()
);

INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao)
VALUES (currval('ordens_id_seq'), 'Git', '2.43');

INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo, criado_em)
VALUES (currval('ordens_id_seq'), 'prazo', true, NOW());

-- Ordem 13: 25/11 - Criada há 5 dias - Faltam 4 dias (prioridade 2)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-013',
    1, -- Spock
    3, -- Han Solo
    'problema',
    'sala',
    '202',
    '202 - kit-professor',
    'Cabo HDMI não funciona',
    'Em Andamento',
    2,
    '2025-11-25 15:10:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-professor', 'Sem imagem no projetor');

-- ========================================
-- 🔵 ORDENS RECENTES - 26 a 30 de novembro
-- ========================================

-- Ordem 14: 26/11 - Pendente há 4 dias - SEM responsável (alerta ativo)
INSERT INTO ordens (
    codigo, criador_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-014',
    5, -- Daenerys
    'problema',
    'laboratorio',
    '211',
    '211 - kit-aluno-notebook',
    'Notebook não carrega a bateria',
    'Pendente',
    4,
    '2025-11-26 10:00:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-aluno-notebook', 'Bateria não carrega');

INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo, criado_em)
VALUES (currval('ordens_id_seq'), 'sem_responsavel', true, NOW());

-- Ordem 15: 26/11 - Concluída recentemente SEM avaliação
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-015',
    5, -- Daenerys
    3, -- Han Solo
    'problema',
    'sala',
    '404',
    '404 - tv',
    'Controle remoto não funciona',
    'Pilhas do controle remoto substituídas. Problema resolvido.',
    'Concluída',
    1,
    '2025-11-26 11:00:00',
    '2025-11-28 15:00:00',
    '2025-11-28 15:00:00'
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'tv', 'Controle remoto não funciona');

-- Ordem 16: 27/11 - Pendente há 3 dias - SEM responsável (alerta ativo)
INSERT INTO ordens (
    codigo, criador_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-016',
    1, -- Spock
    'instalacao',
    'sala',
    '306',
    '306 - Visual Studio Code',
    'Instalar VS Code com extensões Python e C#',
    'Pendente',
    4,
    '2025-11-27 14:30:00',
    NOW()
);

INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao)
VALUES (currval('ordens_id_seq'), 'Visual Studio Code', 'latest');

INSERT INTO ordens_alertas (ordem_id, tipo_alerta, ativo, criado_em)
VALUES (currval('ordens_id_seq'), 'sem_responsavel', true, NOW());

-- Ordem 17: 27/11 - Concluída SEM avaliação (recente)
INSERT INTO ordens (
    codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, solucao, status, prioridade,
    data_criacao, data_atualizacao, data_finalizacao
) VALUES (
    '#ORD-2025-017',
    1, -- Spock
    3, -- Han Solo
    'problema',
    'laboratorio',
    '213',
    '213 - kit-aluno-notebook',
    'Notebook não conecta no Wi-Fi',
    'Driver de rede reinstalado. Conexão funcionando normalmente.',
    'Concluída',
    1,
    '2025-11-27 14:00:00',
    '2025-11-29 11:30:00',
    '2025-11-29 11:30:00'
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'kit-aluno-notebook', 'Sem Wi-Fi');

-- Ordem 18: 28/11 - Pendente há 2 dias - SEM responsável (ainda sem alerta)
INSERT INTO ordens (
    codigo, criador_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-018',
    5, -- Daenerys
    'problema',
    'sala',
    '401',
    '401 - tv',
    'TV sem som, imagem funcionando normalmente',
    'Pendente',
    1,
    '2025-11-28 09:15:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'tv', 'Sem som');

-- Ordem 19: 29/11 - Pendente há 1 dia - SEM responsável
INSERT INTO ordens (
    codigo, criador_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-019',
    1, -- Spock
    'problema',
    'laboratorio',
    '217',
    '217 - perifericos',
    'Mouse não funciona',
    'Pendente',
    1,
    '2025-11-29 11:00:00',
    NOW()
);

INSERT INTO ordens_problemas (ordem_id, equipamento, tipo_problema)
VALUES (currval('ordens_id_seq'), 'perifericos', 'Mouse com defeito');

-- Ordem 20: 30/11 - Criada HOJE - SEM responsável (mais recente!)
INSERT INTO ordens (
    codigo, criador_id, tipo_solicitacao, local_tipo, local_detalhe,
    titulo, descricao, status, prioridade, data_criacao, data_atualizacao
) VALUES (
    '#ORD-2025-020',
    5, -- Daenerys
    'instalacao',
    'laboratorio',
    '220',
    '220 - PostgreSQL 16',
    'Instalar PostgreSQL 16 para aulas de banco de dados',
    'Pendente',
    1,
    '2025-11-30 08:30:00',
    NOW()
);

INSERT INTO ordens_instalacoes (ordem_id, app_nome, app_versao)
VALUES (currval('ordens_id_seq'), 'PostgreSQL', '16');

-- ========================================
-- 📊 ESTATÍSTICAS FINAIS
-- ========================================
DO $$
DECLARE
    total_ordens INT;
    ordens_pendentes INT;
    ordens_andamento INT;
    ordens_concluidas INT;
    ordens_nao_concluidas INT;
    alertas_prazo INT;
    alertas_sem_resp INT;
BEGIN
    SELECT COUNT(*) INTO total_ordens FROM ordens;
    SELECT COUNT(*) INTO ordens_pendentes FROM ordens WHERE status = 'Pendente';
    SELECT COUNT(*) INTO ordens_andamento FROM ordens WHERE status = 'Em Andamento';
    SELECT COUNT(*) INTO ordens_concluidas FROM ordens WHERE status = 'Concluída';
    SELECT COUNT(*) INTO ordens_nao_concluidas FROM ordens WHERE status = 'Não Concluída';
    SELECT COUNT(*) INTO alertas_prazo FROM ordens_alertas WHERE ativo = true AND tipo_alerta = 'prazo';
    SELECT COUNT(*) INTO alertas_sem_resp FROM ordens_alertas WHERE ativo = true AND tipo_alerta = 'sem_responsavel';

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POVOAMENTO CONCLUÍDO COM SUCESSO!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Data de referência: 30/11/2025';
    RAISE NOTICE 'Total de ordens criadas: %', total_ordens;
    RAISE NOTICE '';
    RAISE NOTICE '📊 ORDENS POR STATUS:';
    RAISE NOTICE '  • Pendentes: %', ordens_pendentes;
    RAISE NOTICE '  • Em Andamento: %', ordens_andamento;
    RAISE NOTICE '  • Concluídas: %', ordens_concluidas;
    RAISE NOTICE '  • Não Concluídas: %', ordens_nao_concluidas;
    RAISE NOTICE '';
    RAISE NOTICE '⚠️ ALERTAS ATIVOS:';
    RAISE NOTICE '  • Alertas de prazo: %', alertas_prazo;
    RAISE NOTICE '  • Alertas sem responsável: %', alertas_sem_resp;
    RAISE NOTICE '';
    RAISE NOTICE '✅ ORDENS EM ORDEM CRONOLÓGICA:';
    RAISE NOTICE '  ID 1 = 15/11 (mais antiga)';
    RAISE NOTICE '  ID 20 = 30/11 (mais recente - HOJE!)';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
END$$;

COMMIT;