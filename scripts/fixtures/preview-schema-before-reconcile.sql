--
-- PostgreSQL database dump
--


-- Dumped from database version 18.7
-- Dumped by pg_dump version 18.7

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
-- Name: ItineraryStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ItineraryStatus" AS ENUM (
    'RASCUNHO',
    'EM_ANALISE',
    'PUBLICADO',
    'REJEITADO'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'GUIA'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Itinerary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Itinerary" (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    "userId" text NOT NULL,
    "duracaoDias" integer NOT NULL,
    status public."ItineraryStatus" DEFAULT 'RASCUNHO'::public."ItineraryStatus" NOT NULL,
    "rejectionReason" text
);


--
-- Name: Place; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Place" (
    id text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    city text NOT NULL,
    category text NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    "imageUrl" text
);


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "userId" text NOT NULL,
    "placeId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "imageUrl" text
);


--
-- Name: Token; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Token" (
    id text NOT NULL,
    hash text NOT NULL,
    "userId" text NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    password text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL
);


--
-- Name: _ItineraryToPlace; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."_ItineraryToPlace" (
    "A" text NOT NULL,
    "B" text NOT NULL
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: Itinerary Itinerary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Itinerary"
    ADD CONSTRAINT "Itinerary_pkey" PRIMARY KEY (id);


--
-- Name: Place Place_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Place"
    ADD CONSTRAINT "Place_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: Token Token_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Token"
    ADD CONSTRAINT "Token_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _ItineraryToPlace _ItineraryToPlace_AB_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ItineraryToPlace"
    ADD CONSTRAINT "_ItineraryToPlace_AB_pkey" PRIMARY KEY ("A", "B");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Itinerary_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Itinerary_status_idx" ON public."Itinerary" USING btree (status);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _ItineraryToPlace_B_index; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "_ItineraryToPlace_B_index" ON public."_ItineraryToPlace" USING btree ("B");


--
-- Name: Itinerary Itinerary_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Itinerary"
    ADD CONSTRAINT "Itinerary_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_placeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES public."Place"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Token Token_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Token"
    ADD CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: _ItineraryToPlace _ItineraryToPlace_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ItineraryToPlace"
    ADD CONSTRAINT "_ItineraryToPlace_A_fkey" FOREIGN KEY ("A") REFERENCES public."Itinerary"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ItineraryToPlace _ItineraryToPlace_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."_ItineraryToPlace"
    ADD CONSTRAINT "_ItineraryToPlace_B_fkey" FOREIGN KEY ("B") REFERENCES public."Place"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--
