CREATE SCHEMA auth;

CREATE TYPE auth.role AS ENUM ('user', 'admin', 'superadmin', 'owner');

CREATE TABLE auth.user (
	id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	password TEXT NOT NULL,
	first_name TEXT NOT NULL,
	middle_name TEXT,
	last_name TEXT NOT NULL,
	user_role auth.role NOT NULL DEFAULT 'user',
	created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE VIEW public.user AS
SELECT id, email, first_name, middle_name, last_name, user_role
FROM auth.user;

CREATE MATERIALIZED VIEW public.first_generation_user AS 
SELECT id, email, created_at
FROM auth.user
ORDER BY created_at ASC
LIMIT 10;

CREATE FUNCTION public.get_user_role(user_id INT) 
RETURNS auth.role AS $$
DECLARE
	user_role auth.role;
BEGIN
	SELECT au.user_role
	FROM auth.user au
	WHERE au.id = user_id
	LIMIT 1
	INTO user_role;

	RETURN user_role;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE public.comments_allowed_according_to_settings (
	comment_allowed_according_to_table_settings TEXT,
	comment_explicitly_allowed TEXT,
	comment_explicitly_disallowed TEXT
);

COMMENT ON TABLE 
public.comments_allowed_according_to_settings IS
'test comment';

COMMENT ON COLUMN 
public.comments_allowed_according_to_settings.comment_allowed_according_to_table_settings IS
'test comment';

COMMENT ON COLUMN 
public.comments_allowed_according_to_settings.comment_explicitly_allowed IS
'@introspeql-enable-tsdoc-comments test comment';

COMMENT ON COLUMN 
public.comments_allowed_according_to_settings.comment_explicitly_disallowed IS
'@introspeql-disable-tsdoc-comments test comment';

CREATE TABLE public.comments_explicitly_allowed (
	comment_allowed_according_to_table_settings TEXT,
	comment_explicitly_allowed TEXT,
	comment_explicitly_disallowed TEXT
);

COMMENT ON TABLE 
public.comments_explicitly_allowed IS
'@introspeql-enable-tsdoc-comments test comment';

COMMENT ON COLUMN 
public.comments_explicitly_allowed.comment_allowed_according_to_table_settings IS
'test comment';

COMMENT ON COLUMN 
public.comments_explicitly_allowed.comment_explicitly_allowed IS
'@introspeql-enable-tsdoc-comments test comment';

COMMENT ON COLUMN 
public.comments_explicitly_allowed.comment_explicitly_disallowed IS
'@introspeql-disable-tsdoc-comments test comment';

CREATE TABLE public.comments_explicitly_disallowed (
	comment_allowed_according_to_table_settings TEXT,
	comment_explicitly_allowed TEXT,
	comment_explicitly_disallowed TEXT
);

COMMENT ON TABLE 
public.comments_explicitly_disallowed IS
'@introspeql-disable-tsdoc-comments test comment';

COMMENT ON COLUMN 
public.comments_explicitly_disallowed.comment_allowed_according_to_table_settings IS
'test comment';

COMMENT ON COLUMN 
public.comments_explicitly_disallowed.comment_explicitly_allowed IS
'@introspeql-enable-tsdoc-comments test comment';

COMMENT ON COLUMN 
public.comments_explicitly_disallowed.comment_explicitly_disallowed IS
'@introspeql-disable-tsdoc-comments test comment';