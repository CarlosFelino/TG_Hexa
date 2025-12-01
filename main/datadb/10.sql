INSERT INTO ordens (
  codigo, criador_id, responsavel_id, tipo_solicitacao,
  local_tipo, local_detalhe, titulo, descricao,
  solucao, observacoes, status,
  data_criacao, data_atualizacao, data_finalizacao,
  prioridade, avaliacao
) VALUES
-- 1 ----------------------------------------------------------------------
('#ORD-2025-001', 1, 3, 'problema',
'sala', '101', 'Projetor sem sinal', 'Projetor da sala 101 não exibe imagem.',
NULL, NULL, 'Pendente',
'2025-11-28 09:12', '2025-11-28 09:12', NULL,
3, NULL),

-- 2 ----------------------------------------------------------------------
('#ORD-2025-002', 5, 4, 'problema',
'sala', '104', 'Microfone com chiado', 'Microfone apresenta ruído constante.',
NULL, NULL, 'Pendente',
'2025-11-29 14:33', '2025-11-29 14:33', NULL,
2, NULL),

-- 3 ----------------------------------------------------------------------
('#ORD-2025-003', 3, 6, 'instalacao',
'laboratorio', '203', 'Instalação de software', 'Solicitada instalação do LibreOffice no Lab 203.',
NULL, NULL, 'Pendente',
'2025-11-30 08:55', '2025-11-30 08:55', NULL,
4, NULL),

-- 4 ----------------------------------------------------------------------
('#ORD-2025-004', 4, 3, 'problema',
'sala', '307', 'Ar-condicionado fraco', 'Equipamento resfria muito pouco.',
NULL, NULL, 'Pendente',
'2025-11-27 10:21', '2025-11-27 10:21', NULL,
3, NULL),

-- 5 ----------------------------------------------------------------------
('#ORD-2025-005', 6, 4, 'problema',
'laboratorio', '210', 'PC não liga', 'Computador 210-B não responde ao botão de energia.',
NULL, NULL, 'Pendente',
'2025-11-29 18:02', '2025-11-29 18:02', NULL,
5, NULL),

-- 6 ----------------------------------------------------------------------
('#ORD-2025-006', 1, 3, 'problema',
'sala', '110', 'Wi-Fi instável', 'Perda de conexão frequente durante aulas.',
NULL, NULL, 'Pendente',
'2025-11-26 11:03', '2025-11-26 11:03', NULL,
2, NULL),

-- 7 ----------------------------------------------------------------------
('#ORD-2025-007', 5, 6, 'problema',
'laboratorio', '214', 'Monitor apagando', 'Monitor desliga sozinho após alguns minutos.',
NULL, NULL, 'Pendente',
'2025-11-30 10:44', '2025-11-30 10:44', NULL,
3, NULL),

-- 8 - Em andamento --------------------------------------------------------
('#ORD-2025-008', 3, 4, 'instalacao',
'laboratorio', '205', 'Instalação do VSCode', 'Instalar VSCode em 15 máquinas.',
NULL, 'Processo iniciado no dia 27/11.', 'Em Andamento',
'2025-11-25 09:55', '2025-11-28 17:20', NULL,
4, NULL),

-- 9 ----------------------------------------------------------------------
('#ORD-2025-009', 4, 6, 'problema',
'sala', '113', 'Caixas de som falhando', 'Som interrompe aleatoriamente.',
NULL, 'Testes realizados em 28/11.', 'Em Andamento',
'2025-11-24 13:40', '2025-11-28 15:42', NULL,
2, NULL),

-- 10 ---------------------------------------------------------------------
('#ORD-2025-010', 6, 3, 'instalacao',
'laboratorio', '213', 'Instalar drivers de áudio', 'Drivers precisam ser atualizados nas máquinas.',
NULL, NULL, 'Em Andamento',
'2025-11-22 10:14', '2025-11-27 16:50', NULL,
3, NULL),

-- 11 ---------------------------------------------------------------------
('#ORD-2025-011', 1, 4, 'problema',
'sala', '304', 'Projetor superaquecendo', 'Projetor desliga sozinho após aquecer.',
NULL, 'Peças encomendadas.', 'Em Andamento',
'2025-11-20 09:25', '2025-11-29 11:59', NULL,
4, NULL),

-- 12 ---------------------------------------------------------------------
('#ORD-2025-012', 5, 6, 'problema',
'laboratorio', '208', 'Teclado com teclas falhando', 'Algumas teclas não respondem.',
NULL, NULL, 'Em Andamento',
'2025-11-23 14:11', '2025-11-28 14:11', NULL,
1, NULL),

-- 13 ---------------------------------------------------------------------
('#ORD-2025-013', 3, 4, 'problema',
'sala', '311', 'Lâmpada queimada', 'Lâmpadas do fundo da sala não acendem.',
NULL, NULL, 'Em Andamento',
'2025-11-21 08:16', '2025-11-26 17:00', NULL,
2, NULL),

-- 14 ---------------------------------------------------------------------
('#ORD-2025-014', 4, 3, 'problema',
'laboratorio', '206', 'Mouse com falha', 'Mouse apresenta cliques duplos involuntários.',
NULL, NULL, 'Em Andamento',
'2025-11-19 12:40', '2025-11-28 09:44', NULL,
1, NULL),

-- 15 ---------------------------------------------------------------------
('#ORD-2025-015', 6, 6, 'instalacao',
'laboratorio', '212', 'Instalar antivírus', 'Instalação de antivírus corporativo.',
NULL, 'Aguardando verificação.', 'Em Andamento',
'2025-11-18 10:55', '2025-11-27 18:30', NULL,
3, NULL),

-- CONCLUÍDAS -------------------------------------------------------------

('#ORD-2025-016', 1, 3, 'problema',
'sala', '310', 'Quadro digital travando', 'Painel interativo não responde.',
'Atualização de firmware realizada.', NULL, 'Concluída',
'2025-11-10 09:00', '2025-11-12 10:33', '2025-11-12 10:33',
3, 5),

('#ORD-2025-017', 5, 4, 'problema',
'laboratorio', '203', 'PC reiniciando', 'Equipamento reinicia sozinho.',
'Substituição da fonte.', NULL, 'Concluída',
'2025-11-05 14:20', '2025-11-07 15:00', '2025-11-07 15:00',
4, 5),

('#ORD-2025-018', 3, 6, 'instalacao',
'laboratorio', '209', 'Instalar Java JDK', 'Solicitado JDK para aulas de programação.',
'Instalação concluída nas 20 máquinas.', NULL, 'Concluída',
'2025-11-08 11:12', '2025-11-10 09:30', '2025-11-10 09:30',
2, 4),

('#ORD-2025-019', 4, 3, 'problema',
'sala', '312', 'Controle do projetor perdido', 'Novo controle foi entregue.',
'Reposição fornecida ao solicitante.', NULL, 'Concluída',
'2025-11-09 16:44', '2025-11-11 17:00', '2025-11-11 17:00',
1, 5),

('#ORD-2025-020', 6, 4, 'instalacao',
'laboratorio', '204', 'Instalar Python', 'Ambiente Python solicitado.',
'Instalação concluída.', 'Tudo funcionando.', 'Concluída',
'2025-11-01 13:20', '2025-11-05 11:00', '2025-11-05 11:00',
2, 5),

('#ORD-2025-021', 1, 6, 'problema',
'sala', '305', 'Som não funciona', 'Sistema de som totalmente mudo.',
'Troca de cabo e reconfiguração do mixer.', NULL, 'Concluída',
'2025-11-02 09:55', '2025-11-04 18:00', '2025-11-04 18:00',
4, 4),

('#ORD-2025-022', 3, 3, 'problema',
'laboratorio', '207', 'Monitor escurecendo', 'Tela fica esverdeada.',
'Troca do cabo HDMI.', NULL, 'Concluída',
'2025-11-03 10:22', '2025-11-06 08:40', '2025-11-06 08:40',
3, 4),

('#ORD-2025-023', 5, 4, 'instalacao',
'laboratorio', '202', 'Instalação de LibreOffice', 'Solicitada instalação completa.',
'Instalado e testado.', NULL, 'Concluída',
'2025-11-04 08:33', '2025-11-08 11:55', '2025-11-08 11:55',
2, 5),

-- CANCELADAS -------------------------------------------------------------

('#ORD-2025-024', 4, 6, 'problema',
'sala', '111', 'Microfone sem áudio', 'Microfone totalmente mudo.',
NULL, '', 'Não Concluída',
'2025-11-15 14:55', '2025-11-16 09:32', NULL,
2, NULL),

('#ORD-2025-025', 3, 3, 'instalacao',
'laboratorio', '210', 'Instalar pacote de idiomas', 'Windows precisa dos pacotes PT-BR.',
NULL, '', 'Não Concluída',
'2025-11-12 13:21', '2025-11-14 10:39', NULL,
1, NULL),

('#ORD-2025-026', 6, 4, 'problema',
'laboratorio', '213', 'Teclado travado', 'Teclado não responde.',
NULL, '', 'Não Concluída',
'2025-11-11 11:10', '2025-11-12 17:40', NULL,
3, NULL),

('#ORD-2025-027', 5, 6, 'problema',
'sala', '107', 'Projetor não liga', 'Não há energia no equipamento.',
NULL, '', 'Não Concluída',
'2025-11-14 09:19', '2025-11-15 13:00', NULL,
4, NULL),

-- MAIS 3 PARA FECHAR AS 30 -----------------------------------------------

('#ORD-2025-028', 1, 3, 'problema',
'sala', '101', 'Imagem distorcida', 'Projetor exibe imagem torta.',
NULL, NULL, 'Em Andamento',
'2025-11-26 15:44', '2025-11-29 10:20', NULL,
3, NULL),

('#ORD-2025-029', 6, 4, 'instalacao',
'laboratorio', '205', 'Atualização de navegadores', 'Chrome e Firefox desatualizados.',
NULL, NULL, 'Pendente',
'2025-11-30 11:33', '2025-11-30 11:33', NULL,
2, NULL),

('#ORD-2025-030', 4, 6, 'problema',
'sala', '112', 'Ventilador não funciona', 'Ventilador de teto sem resposta.',
NULL, NULL, 'Pendente',
'2025-11-29 10:10', '2025-11-29 10:10', NULL,
3, NULL);
