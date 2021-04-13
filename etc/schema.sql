--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: node_type; Type: TYPE; Schema: public; Owner: kotidbuser
--

CREATE TYPE public.node_type AS ENUM (
    'file',
    'directory'
);


ALTER TYPE public.node_type OWNER TO kotidbuser;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: infos; Type: TABLE; Schema: public; Owner: kotidbuser
--

CREATE TABLE public.infos (
    id integer NOT NULL,
    node_id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying NOT NULL,
    data json DEFAULT '{}'::json NOT NULL
);


ALTER TABLE public.infos OWNER TO kotidbuser;

--
-- Name: infos_id_seq; Type: SEQUENCE; Schema: public; Owner: kotidbuser
--

CREATE SEQUENCE public.infos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.infos_id_seq OWNER TO kotidbuser;

--
-- Name: infos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kotidbuser
--

ALTER SEQUENCE public.infos_id_seq OWNED BY public.infos.id;


--
-- Name: meta; Type: TABLE; Schema: public; Owner: kotidbuser
--

CREATE TABLE public.meta (
    id integer NOT NULL,
    node_id integer NOT NULL,
    user_id integer NOT NULL,
    type character varying NOT NULL,
    data jsonb DEFAULT 'null'::jsonb NOT NULL
);


ALTER TABLE public.meta OWNER TO kotidbuser;

--
-- Name: meta_id_seq; Type: SEQUENCE; Schema: public; Owner: kotidbuser
--

CREATE SEQUENCE public.meta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.meta_id_seq OWNER TO kotidbuser;

--
-- Name: meta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kotidbuser
--

ALTER SEQUENCE public.meta_id_seq OWNED BY public.meta.id;


--
-- Name: node_process_reqs; Type: TABLE; Schema: public; Owner: kotidbuser
--

CREATE TABLE public.node_process_reqs (
    id integer NOT NULL,
    node_id integer NOT NULL,
    path character varying NOT NULL,
    remove_upload boolean DEFAULT false NOT NULL
);


ALTER TABLE public.node_process_reqs OWNER TO kotidbuser;

--
-- Name: node_process_reqs_id_seq; Type: SEQUENCE; Schema: public; Owner: kotidbuser
--

CREATE SEQUENCE public.node_process_reqs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.node_process_reqs_id_seq OWNER TO kotidbuser;

--
-- Name: node_process_reqs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kotidbuser
--

ALTER SEQUENCE public.node_process_reqs_id_seq OWNED BY public.node_process_reqs.id;


--
-- Name: nodes; Type: TABLE; Schema: public; Owner: kotidbuser
--

CREATE TABLE public.nodes (
    id integer NOT NULL,
    name character varying NOT NULL,
    size bigint,
    type public.node_type NOT NULL,
    mime_type character varying NOT NULL,
    owner_id integer,
    parent_id integer,
    modified_on timestamp with time zone DEFAULT now() NOT NULL,
    has_custom_thumb boolean DEFAULT false NOT NULL,
    length double precision
);


ALTER TABLE public.nodes OWNER TO kotidbuser;

--
-- Name: nodes_id_seq; Type: SEQUENCE; Schema: public; Owner: kotidbuser
--

CREATE SEQUENCE public.nodes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.nodes_id_seq OWNER TO kotidbuser;

--
-- Name: nodes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kotidbuser
--

ALTER SEQUENCE public.nodes_id_seq OWNED BY public.nodes.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: kotidbuser
--

CREATE TABLE public.users (
    id integer NOT NULL,
    name character varying NOT NULL,
    password character varying,
    admin boolean DEFAULT false NOT NULL,
    root_id integer
);


ALTER TABLE public.users OWNER TO kotidbuser;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: kotidbuser
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.users_id_seq OWNER TO kotidbuser;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: kotidbuser
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: infos id; Type: DEFAULT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.infos ALTER COLUMN id SET DEFAULT nextval('public.infos_id_seq'::regclass);


--
-- Name: meta id; Type: DEFAULT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.meta ALTER COLUMN id SET DEFAULT nextval('public.meta_id_seq'::regclass);


--
-- Name: node_process_reqs id; Type: DEFAULT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.node_process_reqs ALTER COLUMN id SET DEFAULT nextval('public.node_process_reqs_id_seq'::regclass);


--
-- Name: nodes id; Type: DEFAULT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.nodes ALTER COLUMN id SET DEFAULT nextval('public.nodes_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: infos infos_pkey; Type: CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.infos
    ADD CONSTRAINT infos_pkey PRIMARY KEY (id);


--
-- Name: meta meta_pkey; Type: CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.meta
    ADD CONSTRAINT meta_pkey PRIMARY KEY (id);


--
-- Name: node_process_reqs node_process_reqs_pkey; Type: CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.node_process_reqs
    ADD CONSTRAINT node_process_reqs_pkey PRIMARY KEY (id);


--
-- Name: nodes nodes_pkey; Type: CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_pkey PRIMARY KEY (id);


--
-- Name: users users_name_key; Type: CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_name_key UNIQUE (name);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: infos infos_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.infos
    ADD CONSTRAINT infos_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: infos infos_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.infos
    ADD CONSTRAINT infos_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meta meta_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.meta
    ADD CONSTRAINT meta_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: meta meta_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.meta
    ADD CONSTRAINT meta_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: node_process_reqs node_process_reqs_node_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.node_process_reqs
    ADD CONSTRAINT node_process_reqs_node_id_fkey FOREIGN KEY (node_id) REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: nodes nodes_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: nodes nodes_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.nodes
    ADD CONSTRAINT nodes_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_root_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: kotidbuser
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_root_id_fkey FOREIGN KEY (root_id) REFERENCES public.nodes(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

