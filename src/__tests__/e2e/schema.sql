CREATE SCHEMA common;

CREATE TYPE common.user_status AS ENUM (
    'active',
    'inactive',
    'suspended'
);

COMMENT ON TYPE common.user_status IS
'@introspeql-begin-tsdoc-comment
Possible states that a user account may be in.
@introspeql-end-tsdoc-comment
This will be excluded.';

CREATE TYPE common.order_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'cancelled'
);

COMMENT ON TYPE common.order_status IS
'Enumeration representing order lifecycle states.';

CREATE SCHEMA auth;

CREATE TABLE auth.users (
    user_id        BIGSERIAL PRIMARY KEY,
    email          TEXT NOT NULL,
    status         common.user_status NOT NULL,
    roles          TEXT[] NOT NULL,
    login_history  TIMESTAMP[][],
    created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auth.users IS
'@introspeql-begin-tsdoc-comment
Primary table for authenticated users.
@introspeql-end-tsdoc-comment
This will be excluded.';

COMMENT ON COLUMN auth.users.user_id IS
'Unique identifier for the user.';

COMMENT ON COLUMN auth.users.email IS
'Email address used for authentication and communication.';

COMMENT ON COLUMN auth.users.status IS
'Current account status.';

COMMENT ON COLUMN auth.users.roles IS
'Assigned authorization roles.';

COMMENT ON COLUMN auth.users.login_history IS
'Grouped login timestamps per session.';

COMMENT ON COLUMN auth.users.created_at IS
'Account creation timestamp.';

CREATE FUNCTION auth.set_user_status(
    p_user_id BIGINT,
    p_status common.user_status
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE auth.users
    SET status = p_status
    WHERE user_id = p_user_id;
END;
$$;

COMMENT ON FUNCTION auth.set_user_status(BIGINT, common.user_status) IS
'@introspeql-include
@introspeql-disable-nullable-return-types';

CREATE FUNCTION auth.get_user_by_email(
    p_email TEXT
)
RETURNS auth.users
LANGUAGE sql
AS $$
    SELECT *
    FROM auth.users
    WHERE email = p_email;
$$;

COMMENT ON FUNCTION auth.get_user_by_email(TEXT) IS
'@introspeql-include';

CREATE FUNCTION auth.get_user_by_email(
    p_email TEXT,
    p_ignore_case BOOLEAN DEFAULT FALSE
)
RETURNS auth.users
LANGUAGE sql
AS $$
    SELECT *
    FROM auth.users
    WHERE (
        CASE
            WHEN p_ignore_case THEN LOWER(email) = LOWER(p_email)
            ELSE email = p_email
        END
    );
$$;

COMMENT ON FUNCTION auth.get_user_by_email(TEXT, BOOLEAN) IS
'@introspeql-include';

CREATE FUNCTION auth.get_user_by_email(
    p_email TEXT,
    p_ignore_case BOOLEAN,
    p_allow_inactive BOOLEAN
)
RETURNS auth.users
LANGUAGE sql
AS $$
    SELECT *
    FROM auth.users
    WHERE (
        CASE
            WHEN p_ignore_case THEN LOWER(email) = LOWER(p_email)
            ELSE email = p_email
        END
    )
    AND (
        p_allow_inactive
        OR status = 'active'
    );
$$;

COMMENT ON FUNCTION auth.get_user_by_email(TEXT, BOOLEAN, BOOLEAN) IS
'Legacy overload intentionally excluded from introspection.';

CREATE SCHEMA sales;

CREATE TABLE sales.orders (
    order_id     BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES auth.users(user_id),
    status       common.order_status NOT NULL,
    tags         TEXT[],
    totals       NUMERIC[][],
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE sales.orders IS
'Represents an order placed by a user.';

COMMENT ON COLUMN sales.orders.order_id IS
'Primary identifier for the order.';

COMMENT ON COLUMN sales.orders.user_id IS
'User that placed the order.';

COMMENT ON COLUMN sales.orders.status IS
'Current processing status.';

COMMENT ON COLUMN sales.orders.tags IS
'Optional classification tags.';

COMMENT ON COLUMN sales.orders.totals IS
'Multi-dimensional numeric totals.';

COMMENT ON COLUMN sales.orders.created_at IS
'Timestamp when the order was created.';

CREATE TABLE sales."order-items$archive" (
    item_id    BIGSERIAL PRIMARY KEY,
    order_id   BIGINT NOT NULL REFERENCES sales.orders(order_id),
    sku        TEXT NOT NULL,
    quantities INTEGER[] NOT NULL
);

COMMENT ON TABLE sales."order-items$archive" IS
'Archived order item records.';

COMMENT ON COLUMN sales."order-items$archive".item_id IS
'Primary key of the archived item.';

COMMENT ON COLUMN sales."order-items$archive".order_id IS
'Associated order identifier.';

COMMENT ON COLUMN sales."order-items$archive".sku IS
'Stock keeping unit code.';

COMMENT ON COLUMN sales."order-items$archive".quantities IS
'Captured quantities at archive time.';

CREATE FUNCTION sales.create_order(
    p_user_id BIGINT,
    p_tags TEXT[] DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
    v_order_id BIGINT;
BEGIN
    INSERT INTO sales.orders (user_id, status, tags)
    VALUES (p_user_id, 'pending', p_tags)
    RETURNING order_id INTO v_order_id;

    RETURN v_order_id;
END;
$$;

COMMENT ON FUNCTION sales.create_order(BIGINT, TEXT[]) IS
'@introspeql-include';

CREATE FUNCTION sales.update_order_status(
    p_order_id BIGINT,
    p_status common.order_status
)
RETURNS common.order_status
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sales.orders
    SET status = p_status
    WHERE order_id = p_order_id;

    RETURN p_status;
END;
$$;

COMMENT ON FUNCTION sales.update_order_status(BIGINT, common.order_status) IS
'@introspeql-include';

CREATE FUNCTION sales.add_order_tags(
    p_order_id BIGINT,
    VARIADIC p_tags TEXT[]
)
RETURNS TEXT[]
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE sales.orders
    SET tags = COALESCE(tags, '{}') || p_tags
    WHERE order_id = p_order_id;

    RETURN p_tags;
END;
$$;

COMMENT ON FUNCTION sales.add_order_tags(BIGINT, TEXT[]) IS
'@introspeql-include';

CREATE SCHEMA reporting;

CREATE TABLE reporting.config (
    config_key   TEXT PRIMARY KEY,
    config_value TEXT NOT NULL,
    flags        TEXT[]
);

COMMENT ON TABLE reporting.config IS
'@introspeql-disable-tsdoc-comments';

COMMENT ON COLUMN reporting.config.config_key IS
'@introspeql-enable-tsdoc-comments
Unique configuration key.';

COMMENT ON COLUMN reporting.config.config_value IS
'@introspeql-enable-tsdoc-comments
Associated configuration value.';

COMMENT ON COLUMN reporting.config.flags IS
'This will be excluded.';

CREATE FUNCTION reporting.count_orders_for_user(
    p_user_id BIGINT
)
RETURNS INTEGER
LANGUAGE sql
AS $$
    SELECT COUNT(*)
    FROM sales.orders
    WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION reporting.count_orders_for_user(BIGINT) IS
'@introspeql-include';

CREATE FUNCTION reporting.list_order_statuses_for_user(
    p_user_id BIGINT
)
RETURNS common.order_status[]
LANGUAGE sql
AS $$
    SELECT ARRAY_AGG(DISTINCT status)
    FROM sales.orders
    WHERE user_id = p_user_id;
$$;

COMMENT ON FUNCTION reporting.list_order_statuses_for_user(BIGINT) IS
'@introspeql-include';

CREATE VIEW reporting.user_order_summary AS
SELECT
    u.user_id,
    u.email,
    COUNT(o.order_id)      AS order_count,
    MIN(o.created_at)      AS first_order_at,
    MAX(o.created_at)      AS last_order_at
FROM auth.users u
LEFT JOIN sales.orders o
    ON o.user_id = u.user_id
GROUP BY
    u.user_id,
    u.email;

COMMENT ON VIEW reporting.user_order_summary IS
'@introspeql-begin-tsdoc-comment
Read-only per-user order summary for reporting and analytics.
@introspeql-end-tsdoc-comment
This will be excluded.';

COMMENT ON COLUMN reporting.user_order_summary.user_id IS
'User identifier.';

COMMENT ON COLUMN reporting.user_order_summary.email IS
'User email address.';

COMMENT ON COLUMN reporting.user_order_summary.order_count IS
'Total number of orders placed by the user.';

COMMENT ON COLUMN reporting.user_order_summary.first_order_at IS
'Timestamp of the user''s first order.';

COMMENT ON COLUMN reporting.user_order_summary.last_order_at IS
'Timestamp of the user''s most recent order.';

CREATE MATERIALIZED VIEW reporting.order_status_counts AS
SELECT
    status,
    COUNT(*) AS total_orders
FROM sales.orders
GROUP BY status;

COMMENT ON MATERIALIZED VIEW reporting.order_status_counts IS
'@introspeql-begin-tsdoc-comment
Aggregated order counts by status.
@introspeql-end-tsdoc-comment
This will be excluded.';

COMMENT ON COLUMN reporting.order_status_counts.status IS
'Order status value.';

COMMENT ON COLUMN reporting.order_status_counts.total_orders IS
'Number of orders in this status.';
