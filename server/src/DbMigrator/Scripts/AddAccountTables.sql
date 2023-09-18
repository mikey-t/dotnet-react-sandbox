-- Table: public.account

DROP TABLE IF EXISTS public.account;

CREATE TABLE IF NOT EXISTS public.account
(
    id           integer                                             NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 2147483647 CACHE 1 ),
    email        character varying(100) COLLATE pg_catalog."default" NOT NULL,
    first_name   character varying(100) COLLATE pg_catalog."default",
    last_name    character varying(100) COLLATE pg_catalog."default",
    display_name character varying(50) COLLATE pg_catalog."default",
    password     character varying(100) COLLATE pg_catalog."default",
    CONSTRAINT account_pkey PRIMARY KEY (id),
    CONSTRAINT u_account_email UNIQUE (email)
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.account
    OWNER to :DB_USER;

-- Index: idx_account_email

DROP INDEX IF EXISTS public.idx_account_email;

CREATE UNIQUE INDEX IF NOT EXISTS idx_account_email
    ON public.account USING btree
        (lower(email::text) COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Table: public.role

DROP TABLE IF EXISTS public.role;

CREATE TABLE IF NOT EXISTS public.role
(
    name character varying(60) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT role_pkey PRIMARY KEY (name)
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.role
    OWNER to :DB_USER;

-- Seed roles

insert into "role" ("name")
values ('SUPER_ADMIN'),
       ('USER');

-- Table: public.account_role

DROP TABLE IF EXISTS public.account_role;

CREATE TABLE IF NOT EXISTS public.account_role
(
    account_id integer,
    role       character varying(60) COLLATE pg_catalog."default",
    CONSTRAINT u_account_role UNIQUE (account_id, role),
    CONSTRAINT account_id_fk FOREIGN KEY (account_id)
        REFERENCES public.account (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT role_fk FOREIGN KEY (role)
        REFERENCES public.role (name) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.account_role
    OWNER to :DB_USER;

-- Table: public.registration

DROP TABLE IF EXISTS public.registration;

CREATE TABLE IF NOT EXISTS public.registration
(
    email                    character varying(100) COLLATE pg_catalog."default" NOT NULL,
    first_name               character varying(100) COLLATE pg_catalog."default",
    last_name                character varying(100) COLLATE pg_catalog."default",
    password                 character varying(100) COLLATE pg_catalog."default",
    verification_code        uuid                                                NOT NULL,
    created_at               timestamp(0) without time zone,
    verification_email_count integer DEFAULT 0,
    CONSTRAINT registration_pkey PRIMARY KEY (email)
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.registration
    OWNER to :DB_USER;

-- Table: public.login_whitelist

DROP TABLE IF EXISTS public.login_whitelist;

CREATE TABLE IF NOT EXISTS public.login_whitelist
(
    email character varying(120) COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT login_whitelist_pkey PRIMARY KEY (email)
)
    TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.login_whitelist
    OWNER to :DB_USER;
