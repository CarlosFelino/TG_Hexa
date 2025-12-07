--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: meu_usuario
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO meu_usuario;

--
-- Name: atualiza_data_atualizacao(); Type: FUNCTION; Schema: public; Owner: meu_usuario
--

CREATE FUNCTION public.atualiza_data_atualizacao() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.data_atualizacao = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.atualiza_data_atualizacao() OWNER TO meu_usuario;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    usuario_id integer,
    usuario_afetado_id integer,
    acao character varying(50) NOT NULL,
    detalhes jsonb,
    ip_address character varying(45),
    user_agent text,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO meu_usuario;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_id_seq OWNER TO meu_usuario;

--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: imagens_perfil; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.imagens_perfil (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    caminho_arquivo character varying(255) NOT NULL,
    data_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ativo boolean DEFAULT true
);


ALTER TABLE public.imagens_perfil OWNER TO meu_usuario;

--
-- Name: imagens_perfil_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.imagens_perfil_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.imagens_perfil_id_seq OWNER TO meu_usuario;

--
-- Name: imagens_perfil_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.imagens_perfil_id_seq OWNED BY public.imagens_perfil.id;


--
-- Name: matriculas_autorizadas; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.matriculas_autorizadas (
    id integer NOT NULL,
    matricula character varying(13) NOT NULL,
    role character varying(20) NOT NULL,
    status character varying(10) NOT NULL,
    nome_pre_cadastrado character varying(100),
    CONSTRAINT matriculas_autorizadas_role_check CHECK (((role)::text = ANY ((ARRAY['professor'::character varying, 'suporte'::character varying, 'admin'::character varying])::text[]))),
    CONSTRAINT matriculas_autorizadas_status_check CHECK (((status)::text = ANY ((ARRAY['ativa'::character varying, 'inativa'::character varying])::text[])))
);


ALTER TABLE public.matriculas_autorizadas OWNER TO meu_usuario;

--
-- Name: matriculas_autorizadas_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.matriculas_autorizadas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.matriculas_autorizadas_id_seq OWNER TO meu_usuario;

--
-- Name: matriculas_autorizadas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.matriculas_autorizadas_id_seq OWNED BY public.matriculas_autorizadas.id;


--
-- Name: ordens; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.ordens (
    id integer NOT NULL,
    codigo character varying(20),
    criador_id integer NOT NULL,
    responsavel_id integer,
    tipo_solicitacao character varying(20) NOT NULL,
    local_tipo character varying(20) NOT NULL,
    local_detalhe character varying(255) NOT NULL,
    titulo text NOT NULL,
    descricao text NOT NULL,
    solucao text,
    observacoes text,
    status character varying(20) DEFAULT 'Pendente'::character varying NOT NULL,
    data_criacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao timestamp without time zone,
    prioridade integer DEFAULT 1,
    avaliacao integer,
    data_limite date GENERATED ALWAYS AS (((data_criacao + '9 days'::interval))::date) STORED,
    CONSTRAINT ordens_avaliacao_check CHECK (((avaliacao >= 1) AND (avaliacao <= 5))),
    CONSTRAINT ordens_local_tipo_check CHECK (((local_tipo)::text = ANY ((ARRAY['sala'::character varying, 'laboratorio'::character varying])::text[]))),
    CONSTRAINT ordens_prioridade_check CHECK (((prioridade >= 1) AND (prioridade <= 5))),
    CONSTRAINT ordens_status_check CHECK (((status)::text = ANY ((ARRAY['Pendente'::character varying, 'Em Andamento'::character varying, 'Concluída'::character varying, 'Não Concluída'::character varying])::text[]))),
    CONSTRAINT ordens_tipo_solicitacao_check CHECK (((tipo_solicitacao)::text = ANY ((ARRAY['problema'::character varying, 'instalacao'::character varying])::text[])))
);


ALTER TABLE public.ordens OWNER TO meu_usuario;

--
-- Name: ordens_alertas; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.ordens_alertas (
    id integer NOT NULL,
    ordem_id integer NOT NULL,
    tipo_alerta character varying(50) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    ativo boolean DEFAULT true,
    resolvido_em timestamp without time zone,
    CONSTRAINT ordens_alertas_tipo_alerta_check CHECK (((tipo_alerta)::text = ANY (ARRAY[('prazo'::character varying)::text, ('sem_responsavel'::character varying)::text])))
);


ALTER TABLE public.ordens_alertas OWNER TO meu_usuario;

--
-- Name: TABLE ordens_alertas; Type: COMMENT; Schema: public; Owner: meu_usuario
--

COMMENT ON TABLE public.ordens_alertas IS 'Rastreia alertas ativos para ordens de serviço. Prioridade >= 3 dispara alertas.';


--
-- Name: COLUMN ordens_alertas.tipo_alerta; Type: COMMENT; Schema: public; Owner: meu_usuario
--

COMMENT ON COLUMN public.ordens_alertas.tipo_alerta IS 'Tipos: ''prazo'' (vencimento próximo, faltando <= 3 dias úteis) ou ''sem_responsavel'' (ordem sem técnico por >2 dias úteis)';


--
-- Name: COLUMN ordens_alertas.criado_em; Type: COMMENT; Schema: public; Owner: meu_usuario
--

COMMENT ON COLUMN public.ordens_alertas.criado_em IS 'Data/hora em que o alerta foi criado automaticamente pelo sistema';


--
-- Name: COLUMN ordens_alertas.ativo; Type: COMMENT; Schema: public; Owner: meu_usuario
--

COMMENT ON COLUMN public.ordens_alertas.ativo IS 'true = alerta ainda válido e deve aparecer no pop-up | false = resolvido/desativado';


--
-- Name: COLUMN ordens_alertas.resolvido_em; Type: COMMENT; Schema: public; Owner: meu_usuario
--

COMMENT ON COLUMN public.ordens_alertas.resolvido_em IS 'Data/hora em que o alerta foi desativado (ordem assumida/concluída)';


--
-- Name: ordens_alertas_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.ordens_alertas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordens_alertas_id_seq OWNER TO meu_usuario;

--
-- Name: ordens_alertas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.ordens_alertas_id_seq OWNED BY public.ordens_alertas.id;


--
-- Name: ordens_anexos; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.ordens_anexos (
    id integer NOT NULL,
    ordem_id integer NOT NULL,
    arquivo_nome character varying(255),
    arquivo_url text NOT NULL,
    data_upload timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    criado_em timestamp without time zone DEFAULT now()
);


ALTER TABLE public.ordens_anexos OWNER TO meu_usuario;

--
-- Name: ordens_anexos_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.ordens_anexos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordens_anexos_id_seq OWNER TO meu_usuario;

--
-- Name: ordens_anexos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.ordens_anexos_id_seq OWNED BY public.ordens_anexos.id;


--
-- Name: ordens_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.ordens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordens_id_seq OWNER TO meu_usuario;

--
-- Name: ordens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.ordens_id_seq OWNED BY public.ordens.id;


--
-- Name: ordens_instalacoes; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.ordens_instalacoes (
    id integer NOT NULL,
    ordem_id integer NOT NULL,
    app_nome character varying(100) NOT NULL,
    app_versao character varying(50),
    app_link text
);


ALTER TABLE public.ordens_instalacoes OWNER TO meu_usuario;

--
-- Name: ordens_instalacoes_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.ordens_instalacoes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordens_instalacoes_id_seq OWNER TO meu_usuario;

--
-- Name: ordens_instalacoes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.ordens_instalacoes_id_seq OWNED BY public.ordens_instalacoes.id;


--
-- Name: ordens_problemas; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.ordens_problemas (
    id integer NOT NULL,
    ordem_id integer NOT NULL,
    equipamento character varying(100) NOT NULL,
    tipo_problema character varying(100) NOT NULL
);


ALTER TABLE public.ordens_problemas OWNER TO meu_usuario;

--
-- Name: ordens_problemas_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.ordens_problemas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ordens_problemas_id_seq OWNER TO meu_usuario;

--
-- Name: ordens_problemas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.ordens_problemas_id_seq OWNED BY public.ordens_problemas.id;


--
-- Name: patrimonios; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.patrimonios (
    id integer NOT NULL,
    patrimonio character varying(50) NOT NULL,
    descricao character varying(100) NOT NULL,
    local character varying(100) NOT NULL,
    status character varying(50) DEFAULT 'Disponível'::character varying
);


ALTER TABLE public.patrimonios OWNER TO meu_usuario;

--
-- Name: patrimonios_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.patrimonios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.patrimonios_id_seq OWNER TO meu_usuario;

--
-- Name: patrimonios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.patrimonios_id_seq OWNED BY public.patrimonios.id;


--
-- Name: resetsenha; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.resetsenha (
    id integer NOT NULL,
    user_id integer,
    token text NOT NULL,
    expira_em timestamp without time zone NOT NULL,
    usado boolean DEFAULT false
);


ALTER TABLE public.resetsenha OWNER TO meu_usuario;

--
-- Name: resetsenha_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.resetsenha_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resetsenha_id_seq OWNER TO meu_usuario;

--
-- Name: resetsenha_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.resetsenha_id_seq OWNED BY public.resetsenha.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: meu_usuario
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nome character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    senha_hash text NOT NULL,
    matricula character varying(13) NOT NULL,
    role character varying(20) NOT NULL,
    criado_em timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    deletado_em timestamp without time zone,
    deletado_por integer,
    motivo_exclusao text,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['professor'::character varying, 'suporte'::character varying, 'admin'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO meu_usuario;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: meu_usuario
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO meu_usuario;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: meu_usuario
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: imagens_perfil id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.imagens_perfil ALTER COLUMN id SET DEFAULT nextval('public.imagens_perfil_id_seq'::regclass);


--
-- Name: matriculas_autorizadas id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.matriculas_autorizadas ALTER COLUMN id SET DEFAULT nextval('public.matriculas_autorizadas_id_seq'::regclass);


--
-- Name: ordens id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens ALTER COLUMN id SET DEFAULT nextval('public.ordens_id_seq'::regclass);


--
-- Name: ordens_alertas id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_alertas ALTER COLUMN id SET DEFAULT nextval('public.ordens_alertas_id_seq'::regclass);


--
-- Name: ordens_anexos id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_anexos ALTER COLUMN id SET DEFAULT nextval('public.ordens_anexos_id_seq'::regclass);


--
-- Name: ordens_instalacoes id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_instalacoes ALTER COLUMN id SET DEFAULT nextval('public.ordens_instalacoes_id_seq'::regclass);


--
-- Name: ordens_problemas id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_problemas ALTER COLUMN id SET DEFAULT nextval('public.ordens_problemas_id_seq'::regclass);


--
-- Name: patrimonios id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.patrimonios ALTER COLUMN id SET DEFAULT nextval('public.patrimonios_id_seq'::regclass);


--
-- Name: resetsenha id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.resetsenha ALTER COLUMN id SET DEFAULT nextval('public.resetsenha_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.audit_logs (id, usuario_id, usuario_afetado_id, acao, detalhes, ip_address, user_agent, criado_em) FROM stdin;
2	2	\N	CRIAR_USER	{"nome": "Luke Skywalker", "role": "professor", "email": "luke@fatec.sp.gov.br", "matricula": "00010", "usuario_afetado_id_original": 10}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-01 19:42:40.061982
3	2	\N	DELETAR_USER	{"tipo_exclusao": "HARD_DELETE", "usuario_deletado": {"nome": "Luke Skywalker", "role": "professor", "email": "luke@fatec.sp.gov.br", "matricula": "00010"}, "usuario_afetado_id_original": 10}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-01 19:43:08.339477
4	2	11	CRIAR_USER	{"nome": "Luke Skywalker", "role": "suporte", "email": "luke@fatec.sp.gov.br", "matricula": "2023000004321", "usuario_afetado_id_original": 11}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-01 19:44:07.297871
5	2	11	DELETAR_USER	{"tipo_exclusao": "SOFT_DELETE", "usuario_deletado": {"nome": "Luke Skywalker", "role": "suporte", "email": "luke@fatec.sp.gov.br", "matricula": "2023000004321"}, "usuario_afetado_id_original": 11}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-01 19:47:08.533998
6	2	12	CRIAR_USER	{"nome": "Teste da Silva", "role": "suporte", "email": "silva@fatec.sp.gov.br", "matricula": "0000000091000", "usuario_afetado_id_original": 12}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	2025-12-01 21:55:13.11389
7	2	12	DELETAR_USER	{"tipo_exclusao": "SOFT_DELETE", "usuario_deletado": {"nome": "Teste da Silva", "role": "suporte", "email": "silva@fatec.sp.gov.br", "matricula": "0000000091000"}, "usuario_afetado_id_original": 12}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	2025-12-01 22:30:57.981727
8	2	13	CRIAR_USER	{"nome": "Ana Loureiro", "role": "professor", "email": "ana@fatec.sp.gov.br", "matricula": "77766", "usuario_afetado_id_original": 13}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	2025-12-01 22:34:39.671336
9	2	13	ATUALIZAR_USER	{"alteracoes": {"nome_novo": "Ana Loureiro", "role_novo": "admin", "nome_antigo": "Ana Loureiro", "role_antigo": "professor"}, "usuario_afetado_id_original": "13"}	::ffff:172.31.91.2	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0	2025-12-01 22:34:55.720295
10	2	14	CRIAR_USER	{"nome": "Shadows", "role": "suporte", "email": "shadows@fatec.sp.gov.br", "matricula": "2024000052543", "usuario_afetado_id_original": 14}	::ffff:172.31.101.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-01 23:33:29.165468
11	2	14	DELETAR_USER	{"tipo_exclusao": "SOFT_DELETE", "usuario_deletado": {"nome": "Shadows", "role": "suporte", "email": "shadows@fatec.sp.gov.br", "matricula": "2024000052543"}, "usuario_afetado_id_original": 14}	::ffff:172.31.101.66	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-01 23:55:01.632598
12	2	15	DELETAR_USER	{"tipo_exclusao": "SOFT_DELETE", "usuario_deletado": {"nome": "Jean-Luc Picard", "role": "suporte", "email": "Jean@fatec.sp.gov.br", "matricula": "2023000000002"}, "usuario_afetado_id_original": 15}	::ffff:172.31.125.130	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 OPR/124.0.0.0 (Edition std-2)	2025-12-06 18:24:11.149519
\.


--
-- Data for Name: imagens_perfil; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.imagens_perfil (id, usuario_id, caminho_arquivo, data_upload, ativo) FROM stdin;
1	1	/uploads/perfis/1-1764540048807.png	2025-11-30 22:00:49.260927	t
4	2	/uploads/perfis/2-1764554443586.jpg	2025-12-01 02:00:44.354891	f
5	2	/uploads/perfis/2-1764554478440.png	2025-12-01 02:01:18.786389	f
16	2	/uploads/perfis/2-1764599749573.png	2025-12-01 14:35:49.60394	f
17	2	/uploads/perfis/2-1764599862783.png	2025-12-01 14:37:42.929784	t
18	9	/uploads/perfis/9-1764617558822.png	2025-12-01 19:32:39.00181	t
19	15	/uploads/perfis/15-1764633117404.png	2025-12-01 23:51:58.640075	t
2	5	/uploads/perfis/5-1764540253176.png	2025-11-30 22:04:13.192037	f
8	5	/uploads/perfis/5-1764596029281.png	2025-12-01 13:33:49.734482	f
9	5	/uploads/perfis/5-1764596713863.png	2025-12-01 13:45:14.32153	f
15	5	/uploads/perfis/5-1764599663815.png	2025-12-01 14:34:24.295455	f
20	5	/uploads/perfis/5-1764688585086.png	2025-12-02 15:16:25.587679	t
3	3	/uploads/perfis/3-1764554343312.png	2025-12-01 01:59:03.936538	f
7	3	/uploads/perfis/3-1764566265049.png	2025-12-01 05:17:46.530456	f
10	3	/uploads/perfis/3-1764598407739.png	2025-12-01 14:13:28.177775	f
11	3	/uploads/perfis/3-1764598471731.png	2025-12-01 14:14:32.055914	f
12	3	/uploads/perfis/3-1764598544102.png	2025-12-01 14:15:44.587366	f
13	3	/uploads/perfis/3-1764598552013.png	2025-12-01 14:15:52.509979	f
14	3	/uploads/perfis/3-1764598576833.png	2025-12-01 14:16:16.850899	t
\.


--
-- Data for Name: matriculas_autorizadas; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.matriculas_autorizadas (id, matricula, role, status, nome_pre_cadastrado) FROM stdin;
1	00001	professor	ativa	Obi-Wan Kenobi
3	00002	professor	inativa	Arya Stark
4	00003	professor	ativa	Spock
5	2023000000005	suporte	ativa	Han Solo
6	00004	professor	ativa	Daenerys Targaryen
7	2023000000007	suporte	inativa	Sansa Stark
8	00005	professor	ativa	Luke Skywalker
10	00006	professor	ativa	Leia Organa
11	00007	professor	inativa	Joffrey Baratheon
12	2023000000012	suporte	ativa	Rey Skywalker
13	00008	professor	ativa	James T. Kirk
14	2023000000014	suporte	inativa	Cersei Lannister
15	2023000000015	admin	ativa	Daemon Targaryen
16	2023000000123	suporte	ativa	Anakin Skywalker
17	2023000001234	suporte	ativa	Marcus Acacius
9	2023000000009	suporte	inativa	Tyrion Lannister
21	2023000004321	suporte	inativa	Luke Skywalker
22	0000000091000	suporte	inativa	Teste da Silva
23	77766	admin	ativa	Ana Loureiro
25	2024000052543	suporte	inativa	Shadows
26	12345	professor	ativa	Leon Kennedy
27	67890	professor	ativa	Claire Redfield
28	2024100100001	suporte	ativa	Jill Valentine
29	2024100100002	suporte	inativa	Chris Redfield
30	54321	professor	inativa	Geralt de Rivia
31	2024100100003	suporte	ativa	Lara Croft
32	98765	professor	ativa	Bruce Wayne
33	2024100100004	suporte	inativa	Clark kent
2	2023000000002	suporte	inativa	Jean-Luc Picard
\.


--
-- Data for Name: ordens; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.ordens (id, codigo, criador_id, responsavel_id, tipo_solicitacao, local_tipo, local_detalhe, titulo, descricao, solucao, observacoes, status, data_criacao, data_atualizacao, data_finalizacao, prioridade, avaliacao) FROM stdin;
2	#ORD-2025-002	1	4	problema	sala	110	110 - tv	TV com tela preta	Cabo HDMI trocado. Problema resolvido mas demorou muito.	\N	Concluída	2025-11-15 21:24:00	2025-11-19 10:00:00	2025-11-19 10:00:00	1	2
4	#ORD-2025-004	1	3	problema	sala	308	308 - kit-professor	Mouse sem fio não conecta no receptor USB	\N	\N	Não Concluída	2025-11-18 14:20:00	2025-12-01 04:39:44.969593	\N	1	\N
5	#ORD-2025-005	1	3	problema	sala	303	303 - kit-professor	Teclado não funciona	Teclado substituído por um novo. Problema resolvido.	\N	Concluída	2025-11-18 10:00:00	2025-11-20 14:30:00	2025-11-20 14:30:00	1	5
7	#ORD-2025-007	1	6	problema	laboratorio	206	206 - kit-aluno-desktop	Computador lento	Limpeza de disco e desfragmentação realizadas. Desempenho melhorou.	\N	Concluída	2025-11-20 13:00:00	2025-11-23 10:00:00	2025-11-23 10:00:00	1	3
17	#ORD-2025-017	1	3	problema	laboratorio	213	213 - kit-aluno-notebook	Notebook não conecta no Wi-Fi	Driver de rede reinstalado. Conexão funcionando normalmente.	\N	Concluída	2025-11-27 14:00:00	2025-11-29 11:30:00	2025-11-29 11:30:00	1	\N
8	#ORD-2025-008	1	6	problema	sala	405	405 - tv	TV não liga, testamos controle remoto e está funcionando	\N	\N	Não Concluída	2025-11-21 08:00:00	2025-12-01 04:40:19.436369	\N	1	\N
6	#ORD-2025-006	5	4	instalacao	laboratorio	216	216 - Python 3.11	Necessário instalar Python 3.11 com pip, numpy e pandas	\N	\N	Não Concluída	2025-11-19 10:15:00	2025-12-06 18:37:37.104119	\N	1	\N
18	#ORD-2025-018	5	3	problema	sala	401	401 - tv	TV sem som, imagem funcionando normalmente	1243	\N	Concluída	2025-11-28 09:15:00	2025-12-06 18:37:37.068791	2025-12-01 15:19:54.269012	1	1
32	#ORD-2025-032	3	3	problema	laboratorio	209	209 - kit-aluno-notebook	oto testando aqui 13:10	qwer	\N	Concluída	2025-12-01 16:09:10.715438	2025-12-06 18:16:51.863113	2025-12-01 16:18:22.451453	1	3
71	#ORD-2025-071	9	11	problema	sala	101	101 - kit-professor	Tela preta 	resolveu	\N	Concluída	2025-12-01 19:26:10.03499	2025-12-02 00:02:32.966972	2025-12-01 19:45:25.098888	1	\N
27	#ORD-2025-027	3	\N	instalacao	laboratorio	209	209 - asdf	Sem descrição	\N	\N	Pendente	2025-12-01 15:53:58.32066	2025-12-06 18:16:51.88197	\N	4	\N
12	#ORD-2025-012	5	6	instalacao	sala	312	312 - Git	Instalar Git para controle de versão	\N	\N	Não Concluída	2025-11-24 13:20:00	2025-12-06 18:37:37.089289	\N	1	\N
25	#ORD-2025-025	3	\N	problema	sala	109	109 - tv	Sem descrição	\N	\N	Pendente	2025-12-01 15:52:53.515004	2025-12-06 18:16:51.913179	\N	4	\N
19	#ORD-2025-019	1	\N	problema	laboratorio	217	217 - perifericos	Mouse não funciona	\N	\N	Pendente	2025-11-29 11:00:00	2025-12-06 03:13:16.825245	\N	5	\N
34	#ORD-2025-034	5	15	problema	sala	304	304 - tv	Sem descrição	resolvi tbm	\N	Concluída	2025-12-01 16:30:59.511647	2025-12-06 18:37:37.016834	2025-12-01 23:48:22.840737	1	\N
33	#ORD-2025-033	3	3	problema	sala	109	109 - kit-professor	Sem descrição	qwer	\N	Concluída	2025-12-01 16:18:03.640849	2025-12-06 18:16:51.859258	2025-12-01 16:18:18.714511	1	4
73	#ORD-2025-073	5	12	problema	laboratorio	210	210 - kit-aluno-notebook	Sem descrição	troquei o patch cord.	\N	Concluída	2025-12-01 21:59:33.162851	2025-12-06 18:37:36.966134	2025-12-01 22:30:27.320259	1	5
16	#ORD-2025-016	1	3	instalacao	sala	306	306 - Visual Studio Code	Instalar VS Code com extensões Python e C#	1234	\N	Concluída	2025-11-27 14:30:00	2025-12-01 15:19:58.546659	2025-12-01 15:19:58.546659	1	\N
1	#ORD-2025-001	5	\N	problema	laboratorio	201	201 - Projetor	Projetor não liga, testamos em outra tomada e o problema persiste	\N	\N	Não Concluída	2025-11-15 09:30:00	2025-12-06 18:37:37.113015	\N	1	\N
20	#ORD-2025-020	5	3	instalacao	laboratorio	220	220 - PostgreSQL 16	Instalar PostgreSQL 16 para aulas de banco de dados	asdf	\N	Concluída	2025-11-30 08:30:00	2025-12-06 18:37:37.062785	2025-12-01 14:46:12.150651	1	2
31	#ORD-2025-031	3	3	problema	laboratorio	210	210 - kit-aluno-notebook	Sem descrição	asdf	\N	Concluída	2025-12-01 16:06:06.531219	2025-12-06 18:16:51.867093	2025-12-01 16:06:18.451044	1	5
10	#ORD-2025-010	5	4	instalacao	sala	307	307 - Node.js	Instalar Node.js LTS	Node.js 20.11 LTS instalado e testado com sucesso.	\N	Concluída	2025-11-22 09:00:00	2025-12-06 18:37:37.100486	2025-11-24 16:00:00	1	2
35	#ORD-2025-035	3	15	problema	sala	104	104 - tv	teste denovo 13:43	resolvi	\N	Concluída	2025-12-01 16:42:47.074642	2025-12-06 18:16:51.85494	2025-12-01 23:47:40.084047	1	\N
21	#ORD-2025-021	5	3	problema	sala	305	305 - tv	está com a tela quebrada	1243	\N	Concluída	2025-12-01 04:42:46.955998	2025-12-06 18:37:37.055325	2025-12-01 15:09:41.676346	1	2
23	#ORD-2025-023	3	3	problema	laboratorio	207	207 - kit-aluno-notebook	Sem descrição	1234	\N	Concluída	2025-12-01 15:40:03.609303	2025-12-06 18:16:51.922645	2025-12-01 15:40:30.792205	1	5
30	#ORD-2025-030	3	3	problema	sala	105	105 - kit-professor	aaaaaaaa	asdf	\N	Concluída	2025-12-01 16:04:44.834267	2025-12-06 18:16:51.872488	2025-12-01 16:06:25.233232	1	5
11	#ORD-2025-011	1	4	problema	laboratorio	208	208 - perifericos	Teclado com teclas travadas	\N	\N	Não Concluída	2025-11-23 09:45:00	2025-12-06 03:13:16.987629	\N	1	\N
28	#ORD-2025-028	5	\N	problema	sala	109	109 - tv	Sem descrição	\N	\N	Pendente	2025-12-01 15:55:08.353956	2025-12-06 18:37:37.033434	\N	4	\N
14	#ORD-2025-014	5	3	problema	laboratorio	211	211 - kit-aluno-notebook	Notebook não carrega a bateria	2345	\N	Concluída	2025-11-26 10:00:00	2025-12-06 18:37:37.083654	2025-12-01 15:20:09.347183	1	3
22	#ORD-2025-022	3	3	problema	sala	109	109 - tv	a1234124	1243	\N	Concluída	2025-12-01 15:09:16.633341	2025-12-06 18:16:51.928303	2025-12-01 15:09:37.642101	1	4
15	#ORD-2025-015	5	3	problema	sala	404	404 - tv	Controle remoto não funciona	Pilhas do controle remoto substituídas. Problema resolvido.	\N	Concluída	2025-11-26 11:00:00	2025-12-06 18:37:37.075005	2025-11-28 15:00:00	1	5
70	#ORD-2025-070	1	3	problema	sala	Sala 205	Sala 205 - Projetor	Projetor não liga e apresenta tela azul	\N	\N	Não Concluída	2025-11-21 10:00:00	2025-12-01 19:27:23.923652	\N	1	\N
13	#ORD-2025-013	1	3	problema	sala	202	202 - kit-professor	Cabo HDMI não funciona	\N	\N	Não Concluída	2025-11-25 15:10:00	2025-12-06 03:13:17.042248	\N	1	\N
24	#ORD-2025-024	5	\N	problema	sala	310	310 - tv	Sem descrição	\N	\N	Pendente	2025-12-01 15:49:12.25034	2025-12-06 18:37:37.046167	\N	4	\N
3	#ORD-2025-003	5	6	instalacao	laboratorio	215	215 - C#	Instalar Visual Studio Community com workload .NET	Visual Studio Community instalado com todas as extensões solicitadas. Teste realizado com sucesso.	\N	Concluída	2025-11-16 18:03:00	2025-12-06 18:37:37.108331	2025-11-21 16:30:00	1	5
9	#ORD-2025-009	5	3	problema	laboratorio	209	209 - kit-aluno-desktop	Computador não conecta na rede, cabo testado e funcionando	\N	\N	Não Concluída	2025-11-22 11:30:00	2025-12-06 18:37:37.096286	\N	1	\N
36	#ORD-2025-036	3	14	instalacao	laboratorio	211	211 - firefox	Sem descrição	prontinho	\N	Concluída	2025-12-01 17:11:11.875738	2025-12-06 18:16:51.848703	2025-12-01 23:34:20.300332	1	\N
29	#ORD-2025-029	5	\N	problema	sala	304	304 - conectividade	Sem descrição	\N	\N	Pendente	2025-12-01 15:57:04.782867	2025-12-06 18:37:37.022954	\N	4	\N
26	#ORD-2025-026	3	\N	problema	laboratorio	206	206 - kit-aluno-desktop	Sem descrição	\N	\N	Pendente	2025-12-01 15:53:38.676225	2025-12-06 18:16:51.894367	\N	4	\N
\.


--
-- Data for Name: ordens_alertas; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.ordens_alertas (id, ordem_id, tipo_alerta, criado_em, ativo, resolvido_em) FROM stdin;
1	8	prazo	2025-12-01 04:39:44.969593	f	2025-12-01 04:40:19.459701
2	9	prazo	2025-12-01 04:39:44.969593	f	2025-12-02 15:10:01.062946
3	11	prazo	2025-12-01 04:39:44.969593	f	2025-12-06 03:13:16.991807
4	12	prazo	2025-12-01 04:39:44.969593	f	2025-12-06 03:13:17.000226
1422	13	prazo	2025-12-02 15:10:00.950509	f	2025-12-06 03:13:17.045902
6	16	sem_responsavel	2025-12-01 04:39:44.969593	f	2025-12-01 15:19:49.503599
1438	27	prazo	2025-12-06 03:13:16.888548	t	\N
1439	27	sem_responsavel	2025-12-06 03:13:16.891387	t	\N
1444	25	prazo	2025-12-06 03:13:16.940473	t	\N
1445	25	sem_responsavel	2025-12-06 03:13:16.943434	t	\N
5	14	sem_responsavel	2025-12-01 04:39:44.969593	f	2025-12-01 15:20:05.03008
1436	19	prazo	2025-12-06 03:13:16.830873	t	\N
1437	19	sem_responsavel	2025-12-06 03:13:16.834681	t	\N
1446	28	prazo	2025-12-06 03:13:17.008426	t	\N
1447	28	sem_responsavel	2025-12-06 03:13:17.01311	t	\N
1440	24	prazo	2025-12-06 03:13:16.89846	t	\N
1441	24	sem_responsavel	2025-12-06 03:13:16.901213	t	\N
1448	29	prazo	2025-12-06 03:13:17.02138	t	\N
1449	29	sem_responsavel	2025-12-06 03:13:17.02443	t	\N
1442	26	prazo	2025-12-06 03:13:16.921523	t	\N
1443	26	sem_responsavel	2025-12-06 03:13:16.92925	t	\N
\.


--
-- Data for Name: ordens_anexos; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.ordens_anexos (id, ordem_id, arquivo_nome, arquivo_url, data_upload, criado_em) FROM stdin;
1	21	Captura de tela 2025-10-22 170548.png	/home/runner/workspace/main/back-end/uploads/21/Captura de tela 2025-10-22 170548.png	2025-12-01 04:42:46.955998	2025-12-01 04:42:46.955998
2	24	Captura de tela 2025-12-01 021937.png	/home/runner/workspace/main/back-end/uploads/24/Captura de tela 2025-12-01 021937.png	2025-12-01 15:49:12.25034	2025-12-01 15:49:12.25034
3	24	Captura de tela 2025-12-01 113903.png	/home/runner/workspace/main/back-end/uploads/24/Captura de tela 2025-12-01 113903.png	2025-12-01 15:49:12.25034	2025-12-01 15:49:12.25034
4	24	faceCard.png	/home/runner/workspace/main/back-end/uploads/24/faceCard.png	2025-12-01 15:49:12.25034	2025-12-01 15:49:12.25034
5	26	carlos.jpg	/home/runner/workspace/main/back-end/uploads/26/carlos.jpg	2025-12-01 15:53:38.676225	2025-12-01 15:53:38.676225
6	26	thalia.jpg	/home/runner/workspace/main/back-end/uploads/26/thalia.jpg	2025-12-01 15:53:38.676225	2025-12-01 15:53:38.676225
7	26	vitoria.jpg	/home/runner/workspace/main/back-end/uploads/26/vitoria.jpg	2025-12-01 15:53:38.676225	2025-12-01 15:53:38.676225
8	29	Captura de tela 2025-09-28 131813.png	/home/runner/workspace/main/back-end/uploads/29/Captura de tela 2025-09-28 131813.png	2025-12-01 15:57:04.782867	2025-12-01 15:57:04.782867
9	29	Captura de tela 2025-10-20 194153.png	/home/runner/workspace/main/back-end/uploads/29/Captura de tela 2025-10-20 194153.png	2025-12-01 15:57:04.782867	2025-12-01 15:57:04.782867
10	30	matt-smith-a-casa-do-dragao.webp	/home/runner/workspace/main/back-end/uploads/30/matt-smith-a-casa-do-dragao.webp	2025-12-01 16:04:44.834267	2025-12-01 16:04:44.834267
11	32	matt-smith-a-casa-do-dragao.webp	/home/runner/workspace/main/back-end/uploads/32/matt-smith-a-casa-do-dragao.webp	2025-12-01 16:09:10.715438	2025-12-01 16:09:10.715438
12	71	imagem_2025-12-01_162607084.png	/home/runner/workspace/main/back-end/uploads/71/imagem_2025-12-01_162607084.png	2025-12-01 19:26:10.03499	2025-12-01 19:26:10.03499
\.


--
-- Data for Name: ordens_instalacoes; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.ordens_instalacoes (id, ordem_id, app_nome, app_versao, app_link) FROM stdin;
1	3	Visual Studio Community	2022	\N
2	6	Python	3.11	\N
3	10	Node.js	20.11 LTS	\N
4	12	Git	2.43	\N
5	16	Visual Studio Code	latest	\N
6	20	PostgreSQL	16	\N
7	27	asdf	asdf	\N
8	36	firefox	14.2.1	https://godotengine.org/pt-br/
\.


--
-- Data for Name: ordens_problemas; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.ordens_problemas (id, ordem_id, equipamento, tipo_problema) FROM stdin;
1	1	Projetor	Não liga
2	2	tv	Tela preta
3	4	kit-professor	Mouse não funciona
4	5	kit-professor	Teclado com defeito
5	7	kit-aluno-desktop	Lentidão
6	8	tv	Não liga
7	9	kit-aluno-desktop	Sem conexão com internet
8	11	perifericos	Teclado com defeito
9	13	kit-professor	Sem imagem no projetor
10	14	kit-aluno-notebook	Bateria não carrega
11	15	tv	Controle remoto não funciona
12	17	kit-aluno-notebook	Sem Wi-Fi
13	18	tv	Sem som
14	19	perifericos	Mouse com defeito
15	21	tv	outro
16	22	tv	sem-sinal
17	23	kit-aluno-notebook	nao-liga
18	24	tv	nao-liga
19	25	tv	nao-liga
20	26	kit-aluno-desktop	sem-internet
21	28	tv	sem-sinal
22	29	conectividade	keystone
23	30	kit-professor	nao-espelha-tv
24	31	kit-aluno-notebook	nao-liga
25	32	kit-aluno-notebook	nao-liga
26	33	kit-professor	nao-espelha-tv
27	34	tv	nao-liga
28	35	tv	nao-liga
62	70	Projetor	Não liga
63	71	kit-professor	sem-video
65	73	kit-aluno-notebook	sem-internet
\.


--
-- Data for Name: patrimonios; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.patrimonios (id, patrimonio, descricao, local, status) FROM stdin;
1	6546546	Notebook Dell Inspiron	Laboratório 1	Em uso
2	5465166	TV LG 43"	Sala 203	Disponível
\.


--
-- Data for Name: resetsenha; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.resetsenha (id, user_id, token, expira_em, usado) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: meu_usuario
--

COPY public.users (id, nome, email, senha_hash, matricula, role, criado_em, deletado_em, deletado_por, motivo_exclusao) FROM stdin;
1	Spock	spock@fatec.sp.gov.br	$2b$10$M4hOOXhgtSjwzn3.U2gO6O3Wsr5eB4L6GZGaCuRfOKScgvVvdWj/2	00003	professor	2025-11-30 21:11:35.579834	\N	\N	\N
2	Daemon Targaryen	principe@fatec.sp.gov.br	$2b$10$C92th.pPXm88sN.jQpXhxumYhtRsjtheR5RBj7tcP4ewHCvsV9LsW	2023000000015	admin	2025-11-30 21:13:15.843273	\N	\N	\N
3	Han Solo	han@fatec.sp.gov.br	$2b$10$XEc5BWPvc2hQ6WuihndlheWLR8h5FdX73opqeaQaXaoCeCywP.Ytu	2023000000005	suporte	2025-11-30 21:14:32.743329	\N	\N	\N
4	Anakin Skywalker	anakin@fatec.sp.gov.br	$2b$10$Kt0PxSsskeR8.HWWqH1h2u3ApxKsJKJUIEL3fXW45jl3gE5Q.y8hK	2023000000123	suporte	2025-11-30 21:18:21.49259	\N	\N	\N
5	Daenerys Targaryen	dany@fatec.sp.gov.br	$2b$10$/6TfY1W4Ij0ijXq5sxNlDuim7IvUCFTGGUDKIxlWpQCEjMdS767pK	00004	professor	2025-11-30 21:20:13.939718	\N	\N	\N
6	Marcus Acacius	marcus@fatec.sp.gov.br	$2b$10$vjBrlwZ/hLFlZPgFdnJw7.LYnGEsvIb74LXGkmxtXgFlHQ/diQigK	2023000001234	suporte	2025-11-30 21:23:03.366558	\N	\N	\N
11	Luke Skywalker	luke@fatec.sp.gov.br	$2b$10$cJ7.nHs2Fwdc1JPMw.8A4us/mguFcUi.dnIU6DtljI./n9OpCXiTu	2023000004321	suporte	2025-12-01 19:44:07.297871	2025-12-01 19:47:08.533998	2	Exclusão via painel admin
12	Teste da Silva	silva@fatec.sp.gov.br	$2b$10$M0XYxNsfi6SsfzQK.kvjUeW2rMhld5L2nEsKQyySiDV0tsyh2zz.O	0000000091000	suporte	2025-12-01 21:55:13.11389	2025-12-01 22:30:57.981727	2	Exclusão via painel admin
13	Ana Loureiro	ana@fatec.sp.gov.br	$2b$10$SyJbQB3fttGQvGxrD/8JvuH034.vB.PKdPzQX7exdDv.2Tus6Tw0m	77766	admin	2025-12-01 22:34:39.671336	\N	\N	\N
14	Shadows	shadows@fatec.sp.gov.br	$2b$10$UPfzLAX9ZaW4kgX1oe90ueXUz/FpBNTJPwmHKwu7U42zeoZg0wLPW	2024000052543	suporte	2025-12-01 23:33:29.165468	2025-12-01 23:55:01.632598	2	Exclusão via painel admin
9	Leia Organa	conclusaovitoria@proton.me	$2b$10$k4ikbW6GcMhHwWf48AA/RupPQLFEw1k/2RD00E5AdBOjqJZ7etS3K	00006	professor	2025-12-01 19:19:20.894817	\N	\N	\N
15	Jean-Luc Picard	Jean@fatec.sp.gov.br	$2b$10$bfNuARJWC4.2hdIE0u.LAOVqfBV7BEsw.FPfk5jm0k6rw6YJBhgTy	2023000000002	suporte	2025-12-01 23:45:43.955417	2025-12-06 18:24:11.149519	2	Exclusão via painel admin
\.


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 12, true);


--
-- Name: imagens_perfil_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.imagens_perfil_id_seq', 20, true);


--
-- Name: matriculas_autorizadas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.matriculas_autorizadas_id_seq', 40, true);


--
-- Name: ordens_alertas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.ordens_alertas_id_seq', 1533, true);


--
-- Name: ordens_anexos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.ordens_anexos_id_seq', 13, true);


--
-- Name: ordens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.ordens_id_seq', 74, true);


--
-- Name: ordens_instalacoes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.ordens_instalacoes_id_seq', 8, true);


--
-- Name: ordens_problemas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.ordens_problemas_id_seq', 66, true);


--
-- Name: patrimonios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.patrimonios_id_seq', 2, true);


--
-- Name: resetsenha_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.resetsenha_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: meu_usuario
--

SELECT pg_catalog.setval('public.users_id_seq', 15, true);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: imagens_perfil imagens_perfil_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.imagens_perfil
    ADD CONSTRAINT imagens_perfil_pkey PRIMARY KEY (id);


--
-- Name: matriculas_autorizadas matriculas_autorizadas_matricula_key; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.matriculas_autorizadas
    ADD CONSTRAINT matriculas_autorizadas_matricula_key UNIQUE (matricula);


--
-- Name: matriculas_autorizadas matriculas_autorizadas_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.matriculas_autorizadas
    ADD CONSTRAINT matriculas_autorizadas_pkey PRIMARY KEY (id);


--
-- Name: ordens_alertas ordens_alertas_ordem_tipo_unq; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_alertas
    ADD CONSTRAINT ordens_alertas_ordem_tipo_unq UNIQUE (ordem_id, tipo_alerta);


--
-- Name: ordens_alertas ordens_alertas_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_alertas
    ADD CONSTRAINT ordens_alertas_pkey PRIMARY KEY (id);


--
-- Name: ordens_anexos ordens_anexos_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_anexos
    ADD CONSTRAINT ordens_anexos_pkey PRIMARY KEY (id);


--
-- Name: ordens ordens_codigo_key; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens
    ADD CONSTRAINT ordens_codigo_key UNIQUE (codigo);


--
-- Name: ordens_instalacoes ordens_instalacoes_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_instalacoes
    ADD CONSTRAINT ordens_instalacoes_pkey PRIMARY KEY (id);


--
-- Name: ordens ordens_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens
    ADD CONSTRAINT ordens_pkey PRIMARY KEY (id);


--
-- Name: ordens_problemas ordens_problemas_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_problemas
    ADD CONSTRAINT ordens_problemas_pkey PRIMARY KEY (id);


--
-- Name: patrimonios patrimonios_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.patrimonios
    ADD CONSTRAINT patrimonios_pkey PRIMARY KEY (id);


--
-- Name: resetsenha resetsenha_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.resetsenha
    ADD CONSTRAINT resetsenha_pkey PRIMARY KEY (id);


--
-- Name: resetsenha resetsenha_token_key; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.resetsenha
    ADD CONSTRAINT resetsenha_token_key UNIQUE (token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_matricula_key; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_matricula_key UNIQUE (matricula);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_alertas_ativos; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_alertas_ativos ON public.ordens_alertas USING btree (ativo, tipo_alerta) WHERE (ativo = true);


--
-- Name: idx_alertas_ordem; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_alertas_ordem ON public.ordens_alertas USING btree (ordem_id);


--
-- Name: idx_alertas_tipo; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_alertas_tipo ON public.ordens_alertas USING btree (tipo_alerta) WHERE (ativo = true);


--
-- Name: idx_audit_acao; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_audit_acao ON public.audit_logs USING btree (acao);


--
-- Name: idx_audit_afetado; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_audit_afetado ON public.audit_logs USING btree (usuario_afetado_id);


--
-- Name: idx_audit_data; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_audit_data ON public.audit_logs USING btree (criado_em DESC);


--
-- Name: idx_audit_usuario; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_audit_usuario ON public.audit_logs USING btree (usuario_id);


--
-- Name: idx_users_deletado; Type: INDEX; Schema: public; Owner: meu_usuario
--

CREATE INDEX idx_users_deletado ON public.users USING btree (deletado_em) WHERE (deletado_em IS NULL);


--
-- Name: ordens trigger_atualiza_ordem; Type: TRIGGER; Schema: public; Owner: meu_usuario
--

CREATE TRIGGER trigger_atualiza_ordem BEFORE UPDATE ON public.ordens FOR EACH ROW EXECUTE FUNCTION public.atualiza_data_atualizacao();


--
-- Name: audit_logs audit_logs_usuario_afetado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_usuario_afetado_id_fkey FOREIGN KEY (usuario_afetado_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: audit_logs audit_logs_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: users fk_matricula; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_matricula FOREIGN KEY (matricula) REFERENCES public.matriculas_autorizadas(matricula) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: imagens_perfil imagens_perfil_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.imagens_perfil
    ADD CONSTRAINT imagens_perfil_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ordens_alertas ordens_alertas_ordem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_alertas
    ADD CONSTRAINT ordens_alertas_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.ordens(id) ON DELETE CASCADE;


--
-- Name: ordens_anexos ordens_anexos_ordem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_anexos
    ADD CONSTRAINT ordens_anexos_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.ordens(id) ON DELETE CASCADE;


--
-- Name: ordens ordens_criador_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens
    ADD CONSTRAINT ordens_criador_id_fkey FOREIGN KEY (criador_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: ordens_instalacoes ordens_instalacoes_ordem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_instalacoes
    ADD CONSTRAINT ordens_instalacoes_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.ordens(id) ON DELETE CASCADE;


--
-- Name: ordens_problemas ordens_problemas_ordem_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens_problemas
    ADD CONSTRAINT ordens_problemas_ordem_id_fkey FOREIGN KEY (ordem_id) REFERENCES public.ordens(id) ON DELETE CASCADE;


--
-- Name: ordens ordens_responsavel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.ordens
    ADD CONSTRAINT ordens_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: resetsenha resetsenha_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: meu_usuario
--

ALTER TABLE ONLY public.resetsenha
    ADD CONSTRAINT resetsenha_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

