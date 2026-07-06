--
-- PostgreSQL database dump
--

\restrict 8qSWHfMhGDDyRcZEJTujCcbmKauMaNgWxnvFonLUS36a7ubTJddXMwbBlZao3oB

-- Dumped from database version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.14 (Ubuntu 16.14-0ubuntu0.24.04.1)

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

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: accommodation_reservations; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.accommodation_reservations (
    reservation_id integer NOT NULL,
    customer_id integer NOT NULL,
    room_id integer NOT NULL,
    reservation_code character varying(20) NOT NULL,
    check_in_date date NOT NULL,
    check_out_date date NOT NULL,
    num_nights integer NOT NULL,
    rate_per_night numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    amount_paid numeric(10,2),
    balance_due numeric(10,2),
    reservation_status character varying(20),
    payment_status character varying(20),
    is_contract_booking boolean,
    num_adults integer,
    num_children integer,
    special_requests character varying(500),
    check_in_actual timestamp without time zone,
    check_out_actual timestamp without time zone,
    checked_in_by integer,
    checked_out_by integer,
    cancelled_at timestamp without time zone,
    cancel_reason character varying(300),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.accommodation_reservations OWNER TO seyeya_user;

--
-- Name: accommodation_reservations_reservation_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.accommodation_reservations_reservation_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.accommodation_reservations_reservation_id_seq OWNER TO seyeya_user;

--
-- Name: accommodation_reservations_reservation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.accommodation_reservations_reservation_id_seq OWNED BY public.accommodation_reservations.reservation_id;


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.activity_logs (
    activity_id integer NOT NULL,
    user_id integer,
    activity_type character varying(100) NOT NULL,
    description character varying(500),
    reference_table character varying(100),
    reference_id integer,
    ip_address character varying(50),
    user_agent character varying(500),
    created_at timestamp without time zone
);


ALTER TABLE public.activity_logs OWNER TO seyeya_user;

--
-- Name: activity_logs_activity_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.activity_logs_activity_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.activity_logs_activity_id_seq OWNER TO seyeya_user;

--
-- Name: activity_logs_activity_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.activity_logs_activity_id_seq OWNED BY public.activity_logs.activity_id;


--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO seyeya_user;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.audit_logs (
    audit_id integer NOT NULL,
    table_name character varying(100) NOT NULL,
    record_id integer,
    action character varying(10) NOT NULL,
    old_values text,
    new_values text,
    changed_by integer,
    ip_address character varying(50),
    changed_at timestamp without time zone
);


ALTER TABLE public.audit_logs OWNER TO seyeya_user;

--
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.audit_logs_audit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.audit_logs_audit_id_seq OWNER TO seyeya_user;

--
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.audit_logs_audit_id_seq OWNED BY public.audit_logs.audit_id;


--
-- Name: conference_halls; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.conference_halls (
    hall_id integer NOT NULL,
    hall_name character varying(150) NOT NULL,
    capacity integer NOT NULL,
    hourly_rate numeric(10,2),
    full_day_rate numeric(10,2),
    half_day_rate numeric(10,2),
    description character varying(500),
    amenities character varying(500),
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.conference_halls OWNER TO seyeya_user;

--
-- Name: conference_halls_hall_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.conference_halls_hall_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conference_halls_hall_id_seq OWNER TO seyeya_user;

--
-- Name: conference_halls_hall_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.conference_halls_hall_id_seq OWNED BY public.conference_halls.hall_id;


--
-- Name: conference_meal_bookings; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.conference_meal_bookings (
    meal_booking_id integer NOT NULL,
    conference_res_id integer NOT NULL,
    package_id integer NOT NULL,
    num_participants integer NOT NULL,
    price_per_person numeric(10,2) NOT NULL,
    total_cost numeric(10,2) NOT NULL
);


ALTER TABLE public.conference_meal_bookings OWNER TO seyeya_user;

--
-- Name: conference_meal_bookings_meal_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.conference_meal_bookings_meal_booking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conference_meal_bookings_meal_booking_id_seq OWNER TO seyeya_user;

--
-- Name: conference_meal_bookings_meal_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.conference_meal_bookings_meal_booking_id_seq OWNED BY public.conference_meal_bookings.meal_booking_id;


--
-- Name: conference_meal_packages; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.conference_meal_packages (
    package_id integer NOT NULL,
    package_name character varying(150) NOT NULL,
    description character varying(500),
    price_per_person numeric(10,2) NOT NULL,
    min_participants integer,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.conference_meal_packages OWNER TO seyeya_user;

--
-- Name: conference_meal_packages_package_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.conference_meal_packages_package_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conference_meal_packages_package_id_seq OWNER TO seyeya_user;

--
-- Name: conference_meal_packages_package_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.conference_meal_packages_package_id_seq OWNED BY public.conference_meal_packages.package_id;


--
-- Name: conference_reservations; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.conference_reservations (
    conference_res_id integer NOT NULL,
    customer_id integer NOT NULL,
    hall_id integer NOT NULL,
    reservation_code character varying(20) NOT NULL,
    event_name character varying(200),
    event_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    num_participants integer,
    booking_type character varying(20),
    hall_cost numeric(10,2),
    resource_cost numeric(10,2),
    meal_cost numeric(10,2),
    total_amount numeric(10,2) NOT NULL,
    amount_paid numeric(10,2),
    balance_due numeric(10,2),
    reservation_status character varying(20),
    payment_status character varying(20),
    special_requests character varying(500),
    cancelled_at timestamp without time zone,
    cancel_reason character varying(300),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.conference_reservations OWNER TO seyeya_user;

--
-- Name: conference_reservations_conference_res_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.conference_reservations_conference_res_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conference_reservations_conference_res_id_seq OWNER TO seyeya_user;

--
-- Name: conference_reservations_conference_res_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.conference_reservations_conference_res_id_seq OWNED BY public.conference_reservations.conference_res_id;


--
-- Name: conference_resource_bookings; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.conference_resource_bookings (
    resource_booking_id integer NOT NULL,
    conference_res_id integer NOT NULL,
    resource_id integer NOT NULL,
    quantity integer,
    rate numeric(10,2),
    total_cost numeric(10,2)
);


ALTER TABLE public.conference_resource_bookings OWNER TO seyeya_user;

--
-- Name: conference_resource_bookings_resource_booking_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.conference_resource_bookings_resource_booking_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conference_resource_bookings_resource_booking_id_seq OWNER TO seyeya_user;

--
-- Name: conference_resource_bookings_resource_booking_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.conference_resource_bookings_resource_booking_id_seq OWNED BY public.conference_resource_bookings.resource_booking_id;


--
-- Name: conference_resources; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.conference_resources (
    resource_id integer NOT NULL,
    resource_name character varying(100) NOT NULL,
    daily_rate numeric(10,2),
    quantity integer,
    is_available boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.conference_resources OWNER TO seyeya_user;

--
-- Name: conference_resources_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.conference_resources_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conference_resources_resource_id_seq OWNER TO seyeya_user;

--
-- Name: conference_resources_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.conference_resources_resource_id_seq OWNED BY public.conference_resources.resource_id;


--
-- Name: customer_reviews; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.customer_reviews (
    review_id integer NOT NULL,
    customer_id integer NOT NULL,
    review_type character varying(20),
    reference_id integer,
    rating integer NOT NULL,
    comment character varying(1000),
    management_reply character varying(1000),
    replied_by integer,
    replied_at timestamp without time zone,
    is_published boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.customer_reviews OWNER TO seyeya_user;

--
-- Name: customer_reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.customer_reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_reviews_review_id_seq OWNER TO seyeya_user;

--
-- Name: customer_reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.customer_reviews_review_id_seq OWNED BY public.customer_reviews.review_id;


--
-- Name: customers; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.customers (
    customer_id integer NOT NULL,
    user_id integer,
    customer_code character varying(100) NOT NULL,
    full_name character varying(200) NOT NULL,
    phone_number character varying(20),
    passport_number character varying(30),
    nin character varying(20),
    customer_type character varying(20),
    is_contract_client boolean,
    total_spent numeric(18,2),
    visit_count integer,
    loyalty_points integer,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    email character varying(150),
    gender character varying(20),
    date_of_birth date,
    nationality character varying(100),
    address character varying(300),
    is_active boolean DEFAULT true
);


ALTER TABLE public.customers OWNER TO seyeya_user;

--
-- Name: customers_customer_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.customers_customer_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_customer_id_seq OWNER TO seyeya_user;

--
-- Name: customers_customer_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.customers_customer_id_seq OWNED BY public.customers.customer_id;


--
-- Name: device_tokens; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.device_tokens (
    device_token_id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(500) NOT NULL,
    platform character varying(20),
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.device_tokens OWNER TO seyeya_user;

--
-- Name: device_tokens_device_token_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.device_tokens_device_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.device_tokens_device_token_id_seq OWNER TO seyeya_user;

--
-- Name: device_tokens_device_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.device_tokens_device_token_id_seq OWNED BY public.device_tokens.device_token_id;


--
-- Name: guest_checkin_details; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.guest_checkin_details (
    checkin_detail_id integer NOT NULL,
    reservation_id integer NOT NULL,
    guest_name character varying(200) NOT NULL,
    nationality character varying(100),
    phone_number character varying(20),
    next_of_kin character varying(200),
    next_of_kin_phone character varying(20),
    passport_number character varying(30),
    nin character varying(20),
    is_primary boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.guest_checkin_details OWNER TO seyeya_user;

--
-- Name: guest_checkin_details_checkin_detail_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.guest_checkin_details_checkin_detail_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.guest_checkin_details_checkin_detail_id_seq OWNER TO seyeya_user;

--
-- Name: guest_checkin_details_checkin_detail_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.guest_checkin_details_checkin_detail_id_seq OWNED BY public.guest_checkin_details.checkin_detail_id;


--
-- Name: hall_photos; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.hall_photos (
    photo_id integer NOT NULL,
    hall_id integer NOT NULL,
    photo_url character varying(500) NOT NULL,
    sort_order integer,
    created_at timestamp without time zone
);


ALTER TABLE public.hall_photos OWNER TO seyeya_user;

--
-- Name: hall_photos_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.hall_photos_photo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.hall_photos_photo_id_seq OWNER TO seyeya_user;

--
-- Name: hall_photos_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.hall_photos_photo_id_seq OWNED BY public.hall_photos.photo_id;


--
-- Name: login_logs; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.login_logs (
    login_log_id integer NOT NULL,
    user_id integer,
    email character varying(150),
    ip_address character varying(50),
    user_agent character varying(500),
    device_info character varying(300),
    login_status character varying(20) NOT NULL,
    failure_reason character varying(200),
    attempted_at timestamp without time zone
);


ALTER TABLE public.login_logs OWNER TO seyeya_user;

--
-- Name: login_logs_login_log_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.login_logs_login_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.login_logs_login_log_id_seq OWNER TO seyeya_user;

--
-- Name: login_logs_login_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.login_logs_login_log_id_seq OWNED BY public.login_logs.login_log_id;


--
-- Name: menu_categories; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.menu_categories (
    category_id integer NOT NULL,
    category_name character varying(150) NOT NULL,
    description character varying(300),
    image_url character varying(500),
    sort_order integer,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.menu_categories OWNER TO seyeya_user;

--
-- Name: menu_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.menu_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_categories_category_id_seq OWNER TO seyeya_user;

--
-- Name: menu_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.menu_categories_category_id_seq OWNED BY public.menu_categories.category_id;


--
-- Name: menu_extras; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.menu_extras (
    extra_id integer NOT NULL,
    extra_name character varying(100) NOT NULL,
    price numeric(10,2),
    is_available boolean,
    created_at timestamp without time zone,
    menu_item_id integer NOT NULL,
    image_url character varying(500)
);


ALTER TABLE public.menu_extras OWNER TO seyeya_user;

--
-- Name: menu_extras_extra_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.menu_extras_extra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_extras_extra_id_seq OWNER TO seyeya_user;

--
-- Name: menu_extras_extra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.menu_extras_extra_id_seq OWNED BY public.menu_extras.extra_id;


--
-- Name: menu_items; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.menu_items (
    menu_item_id integer NOT NULL,
    category_id integer NOT NULL,
    item_name character varying(200) NOT NULL,
    description character varying(500),
    price numeric(10,2) NOT NULL,
    image_url character varying(500),
    allergen_info character varying(500),
    preparation_time integer,
    is_available boolean,
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    quantity integer
);


ALTER TABLE public.menu_items OWNER TO seyeya_user;

--
-- Name: menu_items_menu_item_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.menu_items_menu_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.menu_items_menu_item_id_seq OWNER TO seyeya_user;

--
-- Name: menu_items_menu_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.menu_items_menu_item_id_seq OWNED BY public.menu_items.menu_item_id;


--
-- Name: notification_templates; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.notification_templates (
    template_id integer NOT NULL,
    template_name character varying(100) NOT NULL,
    subject character varying(300),
    body_template text NOT NULL,
    channel character varying(20),
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.notification_templates OWNER TO seyeya_user;

--
-- Name: notification_templates_template_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.notification_templates_template_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notification_templates_template_id_seq OWNER TO seyeya_user;

--
-- Name: notification_templates_template_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.notification_templates_template_id_seq OWNED BY public.notification_templates.template_id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.notifications (
    notification_id integer NOT NULL,
    customer_id integer,
    user_id integer,
    template_id integer,
    notification_type character varying(50),
    channel character varying(20) NOT NULL,
    title character varying(300),
    body text,
    recipient_address character varying(300),
    sent_status character varying(20),
    delivery_status character varying(20),
    read_status boolean,
    read_at timestamp without time zone,
    sent_at timestamp without time zone,
    provider_response text,
    created_at timestamp without time zone
);


ALTER TABLE public.notifications OWNER TO seyeya_user;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.notifications_notification_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_notification_id_seq OWNER TO seyeya_user;

--
-- Name: notifications_notification_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.notifications_notification_id_seq OWNED BY public.notifications.notification_id;


--
-- Name: order_item_extras; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.order_item_extras (
    order_item_extra_id integer NOT NULL,
    order_item_id integer NOT NULL,
    extra_id integer NOT NULL,
    quantity integer,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL
);


ALTER TABLE public.order_item_extras OWNER TO seyeya_user;

--
-- Name: order_item_extras_order_item_extra_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.order_item_extras_order_item_extra_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_item_extras_order_item_extra_id_seq OWNER TO seyeya_user;

--
-- Name: order_item_extras_order_item_extra_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.order_item_extras_order_item_extra_id_seq OWNED BY public.order_item_extras.order_item_extra_id;


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.order_items (
    order_item_id integer NOT NULL,
    order_id integer NOT NULL,
    menu_item_id integer NOT NULL,
    quantity integer NOT NULL,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    special_notes character varying(300)
);


ALTER TABLE public.order_items OWNER TO seyeya_user;

--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.order_items_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_items_order_item_id_seq OWNER TO seyeya_user;

--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.order_items_order_item_id_seq OWNED BY public.order_items.order_item_id;


--
-- Name: order_status_history; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.order_status_history (
    status_hist_id integer NOT NULL,
    order_id integer NOT NULL,
    old_status character varying(20),
    new_status character varying(20) NOT NULL,
    changed_by integer,
    note character varying(300),
    changed_at timestamp without time zone
);


ALTER TABLE public.order_status_history OWNER TO seyeya_user;

--
-- Name: order_status_history_status_hist_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.order_status_history_status_hist_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.order_status_history_status_hist_id_seq OWNER TO seyeya_user;

--
-- Name: order_status_history_status_hist_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.order_status_history_status_hist_id_seq OWNED BY public.order_status_history.status_hist_id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.password_reset_tokens (
    token_id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(500) NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used_at timestamp without time zone,
    created_at timestamp without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO seyeya_user;

--
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.password_reset_tokens_token_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNER TO seyeya_user;

--
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.password_reset_tokens_token_id_seq OWNED BY public.password_reset_tokens.token_id;


--
-- Name: payment_refunds; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.payment_refunds (
    refund_id integer NOT NULL,
    payment_id integer NOT NULL,
    refund_amount numeric(10,2) NOT NULL,
    reason character varying(300),
    processed_by integer,
    processed_at timestamp without time zone,
    status character varying(20)
);


ALTER TABLE public.payment_refunds OWNER TO seyeya_user;

--
-- Name: payment_refunds_refund_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.payment_refunds_refund_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payment_refunds_refund_id_seq OWNER TO seyeya_user;

--
-- Name: payment_refunds_refund_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.payment_refunds_refund_id_seq OWNED BY public.payment_refunds.refund_id;


--
-- Name: payments; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.payments (
    payment_id integer NOT NULL,
    customer_id integer,
    payment_type character varying(30) NOT NULL,
    reference_id integer NOT NULL,
    payment_method character varying(30) NOT NULL,
    transaction_id character varying(100),
    payment_reference character varying(100) NOT NULL,
    amount_paid numeric(10,2) NOT NULL,
    currency character varying(5),
    payment_status character varying(20),
    payment_date timestamp without time zone,
    is_deposit boolean,
    deposit_percent numeric(5,2),
    bank_slip_url character varying(500),
    verified_by integer,
    verified_at timestamp without time zone,
    verification_note character varying(300),
    gateway_response text,
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    reference_type character varying(30)
);


ALTER TABLE public.payments OWNER TO seyeya_user;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.payments_payment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.payments_payment_id_seq OWNER TO seyeya_user;

--
-- Name: payments_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.payments_payment_id_seq OWNED BY public.payments.payment_id;


--
-- Name: permission_groups; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.permission_groups (
    group_id integer NOT NULL,
    group_name character varying(100) NOT NULL
);


ALTER TABLE public.permission_groups OWNER TO seyeya_user;

--
-- Name: permission_groups_group_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.permission_groups_group_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permission_groups_group_id_seq OWNER TO seyeya_user;

--
-- Name: permission_groups_group_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.permission_groups_group_id_seq OWNED BY public.permission_groups.group_id;


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.permissions (
    permission_id integer NOT NULL,
    permission_key character varying(100) NOT NULL,
    display_name character varying(150) NOT NULL,
    description character varying(300),
    is_active boolean,
    created_at timestamp without time zone,
    group_id integer
);


ALTER TABLE public.permissions OWNER TO seyeya_user;

--
-- Name: permissions_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.permissions_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.permissions_permission_id_seq OWNER TO seyeya_user;

--
-- Name: permissions_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.permissions_permission_id_seq OWNED BY public.permissions.permission_id;


--
-- Name: restaurant_orders; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.restaurant_orders (
    order_id integer NOT NULL,
    customer_id integer,
    order_number character varying(20) NOT NULL,
    seating_location character varying(20),
    delivery_option character varying(20),
    delivery_address character varying(300),
    delivery_lat numeric(9,6),
    delivery_lng numeric(9,6),
    delivery_charge numeric(10,2),
    preferred_time timestamp without time zone,
    special_instr character varying(500),
    allergy_info character varying(500),
    sub_total numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    amount_paid numeric(10,2),
    balance_due numeric(10,2),
    order_status character varying(20),
    payment_status character varying(20),
    assigned_waiter integer,
    tracking_number character varying(50),
    cancelled_at timestamp without time zone,
    cancel_reason character varying(300),
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.restaurant_orders OWNER TO seyeya_user;

--
-- Name: restaurant_orders_order_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.restaurant_orders_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restaurant_orders_order_id_seq OWNER TO seyeya_user;

--
-- Name: restaurant_orders_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.restaurant_orders_order_id_seq OWNED BY public.restaurant_orders.order_id;


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.role_permissions (
    role_permission_id integer NOT NULL,
    role_id integer NOT NULL,
    permission_id integer NOT NULL,
    granted_at timestamp without time zone,
    granted_by integer
);


ALTER TABLE public.role_permissions OWNER TO seyeya_user;

--
-- Name: role_permissions_role_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.role_permissions_role_permission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.role_permissions_role_permission_id_seq OWNER TO seyeya_user;

--
-- Name: role_permissions_role_permission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.role_permissions_role_permission_id_seq OWNED BY public.role_permissions.role_permission_id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.roles (
    role_id integer NOT NULL,
    role_name character varying(100) NOT NULL,
    description character varying(300),
    parent_role_id integer,
    is_active boolean,
    is_system_role boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.roles OWNER TO seyeya_user;

--
-- Name: roles_role_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.roles_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.roles_role_id_seq OWNER TO seyeya_user;

--
-- Name: roles_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.roles_role_id_seq OWNED BY public.roles.role_id;


--
-- Name: room_categories; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.room_categories (
    room_category_id integer NOT NULL,
    category_name character varying(100) NOT NULL,
    description character varying(500),
    base_rate_usd numeric(10,2) NOT NULL,
    is_active boolean,
    created_at timestamp without time zone
);


ALTER TABLE public.room_categories OWNER TO seyeya_user;

--
-- Name: room_categories_room_category_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.room_categories_room_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_categories_room_category_id_seq OWNER TO seyeya_user;

--
-- Name: room_categories_room_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.room_categories_room_category_id_seq OWNED BY public.room_categories.room_category_id;


--
-- Name: room_photos; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.room_photos (
    photo_id integer NOT NULL,
    room_id integer NOT NULL,
    photo_url character varying(500) NOT NULL,
    caption character varying(200),
    sort_order integer,
    created_at timestamp without time zone
);


ALTER TABLE public.room_photos OWNER TO seyeya_user;

--
-- Name: room_photos_photo_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.room_photos_photo_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.room_photos_photo_id_seq OWNER TO seyeya_user;

--
-- Name: room_photos_photo_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.room_photos_photo_id_seq OWNED BY public.room_photos.photo_id;


--
-- Name: rooms; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.rooms (
    room_id integer NOT NULL,
    room_category_id integer NOT NULL,
    room_number character varying(20) NOT NULL,
    floor character varying(10),
    room_status character varying(20),
    max_occupancy integer,
    description character varying(500),
    amenities character varying(500),
    is_active boolean,
    created_at timestamp without time zone,
    updated_at timestamp without time zone
);


ALTER TABLE public.rooms OWNER TO seyeya_user;

--
-- Name: rooms_room_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.rooms_room_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rooms_room_id_seq OWNER TO seyeya_user;

--
-- Name: rooms_room_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.rooms_room_id_seq OWNED BY public.rooms.room_id;


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.user_roles (
    user_role_id integer NOT NULL,
    user_id integer NOT NULL,
    role_id integer NOT NULL,
    assigned_at timestamp without time zone,
    assigned_by integer,
    expires_at timestamp without time zone
);


ALTER TABLE public.user_roles OWNER TO seyeya_user;

--
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.user_roles_user_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_roles_user_role_id_seq OWNER TO seyeya_user;

--
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.user_roles_user_role_id_seq OWNED BY public.user_roles.user_role_id;


--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.user_sessions (
    session_id integer NOT NULL,
    user_id integer NOT NULL,
    refresh_token character varying(500) NOT NULL,
    device_info character varying(300),
    ip_address character varying(50),
    user_agent character varying(500),
    is_active boolean,
    created_at timestamp without time zone,
    expires_at timestamp without time zone NOT NULL,
    revoked_at timestamp without time zone
);


ALTER TABLE public.user_sessions OWNER TO seyeya_user;

--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.user_sessions_session_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.user_sessions_session_id_seq OWNER TO seyeya_user;

--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.user_sessions_session_id_seq OWNED BY public.user_sessions.session_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: seyeya_user
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(200) NOT NULL,
    email character varying(150),
    phone_number character varying(20),
    password_hash character varying(500) NOT NULL,
    is_staff boolean,
    is_active boolean,
    last_login_at timestamp without time zone
);


ALTER TABLE public.users OWNER TO seyeya_user;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: seyeya_user
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO seyeya_user;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: seyeya_user
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: accommodation_reservations reservation_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations ALTER COLUMN reservation_id SET DEFAULT nextval('public.accommodation_reservations_reservation_id_seq'::regclass);


--
-- Name: activity_logs activity_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.activity_logs ALTER COLUMN activity_id SET DEFAULT nextval('public.activity_logs_activity_id_seq'::regclass);


--
-- Name: audit_logs audit_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN audit_id SET DEFAULT nextval('public.audit_logs_audit_id_seq'::regclass);


--
-- Name: conference_halls hall_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_halls ALTER COLUMN hall_id SET DEFAULT nextval('public.conference_halls_hall_id_seq'::regclass);


--
-- Name: conference_meal_bookings meal_booking_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_meal_bookings ALTER COLUMN meal_booking_id SET DEFAULT nextval('public.conference_meal_bookings_meal_booking_id_seq'::regclass);


--
-- Name: conference_meal_packages package_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_meal_packages ALTER COLUMN package_id SET DEFAULT nextval('public.conference_meal_packages_package_id_seq'::regclass);


--
-- Name: conference_reservations conference_res_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_reservations ALTER COLUMN conference_res_id SET DEFAULT nextval('public.conference_reservations_conference_res_id_seq'::regclass);


--
-- Name: conference_resource_bookings resource_booking_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_resource_bookings ALTER COLUMN resource_booking_id SET DEFAULT nextval('public.conference_resource_bookings_resource_booking_id_seq'::regclass);


--
-- Name: conference_resources resource_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_resources ALTER COLUMN resource_id SET DEFAULT nextval('public.conference_resources_resource_id_seq'::regclass);


--
-- Name: customer_reviews review_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customer_reviews ALTER COLUMN review_id SET DEFAULT nextval('public.customer_reviews_review_id_seq'::regclass);


--
-- Name: customers customer_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customers ALTER COLUMN customer_id SET DEFAULT nextval('public.customers_customer_id_seq'::regclass);


--
-- Name: device_tokens device_token_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.device_tokens ALTER COLUMN device_token_id SET DEFAULT nextval('public.device_tokens_device_token_id_seq'::regclass);


--
-- Name: guest_checkin_details checkin_detail_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.guest_checkin_details ALTER COLUMN checkin_detail_id SET DEFAULT nextval('public.guest_checkin_details_checkin_detail_id_seq'::regclass);


--
-- Name: hall_photos photo_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.hall_photos ALTER COLUMN photo_id SET DEFAULT nextval('public.hall_photos_photo_id_seq'::regclass);


--
-- Name: login_logs login_log_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.login_logs ALTER COLUMN login_log_id SET DEFAULT nextval('public.login_logs_login_log_id_seq'::regclass);


--
-- Name: menu_categories category_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_categories ALTER COLUMN category_id SET DEFAULT nextval('public.menu_categories_category_id_seq'::regclass);


--
-- Name: menu_extras extra_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_extras ALTER COLUMN extra_id SET DEFAULT nextval('public.menu_extras_extra_id_seq'::regclass);


--
-- Name: menu_items menu_item_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_items ALTER COLUMN menu_item_id SET DEFAULT nextval('public.menu_items_menu_item_id_seq'::regclass);


--
-- Name: notification_templates template_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notification_templates ALTER COLUMN template_id SET DEFAULT nextval('public.notification_templates_template_id_seq'::regclass);


--
-- Name: notifications notification_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notifications ALTER COLUMN notification_id SET DEFAULT nextval('public.notifications_notification_id_seq'::regclass);


--
-- Name: order_item_extras order_item_extra_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_item_extras ALTER COLUMN order_item_extra_id SET DEFAULT nextval('public.order_item_extras_order_item_extra_id_seq'::regclass);


--
-- Name: order_items order_item_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_items ALTER COLUMN order_item_id SET DEFAULT nextval('public.order_items_order_item_id_seq'::regclass);


--
-- Name: order_status_history status_hist_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_status_history ALTER COLUMN status_hist_id SET DEFAULT nextval('public.order_status_history_status_hist_id_seq'::regclass);


--
-- Name: password_reset_tokens token_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN token_id SET DEFAULT nextval('public.password_reset_tokens_token_id_seq'::regclass);


--
-- Name: payment_refunds refund_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payment_refunds ALTER COLUMN refund_id SET DEFAULT nextval('public.payment_refunds_refund_id_seq'::regclass);


--
-- Name: payments payment_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payments ALTER COLUMN payment_id SET DEFAULT nextval('public.payments_payment_id_seq'::regclass);


--
-- Name: permission_groups group_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permission_groups ALTER COLUMN group_id SET DEFAULT nextval('public.permission_groups_group_id_seq'::regclass);


--
-- Name: permissions permission_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permissions ALTER COLUMN permission_id SET DEFAULT nextval('public.permissions_permission_id_seq'::regclass);


--
-- Name: restaurant_orders order_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.restaurant_orders ALTER COLUMN order_id SET DEFAULT nextval('public.restaurant_orders_order_id_seq'::regclass);


--
-- Name: role_permissions role_permission_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.role_permissions ALTER COLUMN role_permission_id SET DEFAULT nextval('public.role_permissions_role_permission_id_seq'::regclass);


--
-- Name: roles role_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.roles ALTER COLUMN role_id SET DEFAULT nextval('public.roles_role_id_seq'::regclass);


--
-- Name: room_categories room_category_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.room_categories ALTER COLUMN room_category_id SET DEFAULT nextval('public.room_categories_room_category_id_seq'::regclass);


--
-- Name: room_photos photo_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.room_photos ALTER COLUMN photo_id SET DEFAULT nextval('public.room_photos_photo_id_seq'::regclass);


--
-- Name: rooms room_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.rooms ALTER COLUMN room_id SET DEFAULT nextval('public.rooms_room_id_seq'::regclass);


--
-- Name: user_roles user_role_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_roles ALTER COLUMN user_role_id SET DEFAULT nextval('public.user_roles_user_role_id_seq'::regclass);


--
-- Name: user_sessions session_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_sessions ALTER COLUMN session_id SET DEFAULT nextval('public.user_sessions_session_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: accommodation_reservations; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.accommodation_reservations (reservation_id, customer_id, room_id, reservation_code, check_in_date, check_out_date, num_nights, rate_per_night, total_amount, amount_paid, balance_due, reservation_status, payment_status, is_contract_booking, num_adults, num_children, special_requests, check_in_actual, check_out_actual, checked_in_by, checked_out_by, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
1	9	1	ACC-2026-0D95E19F	2026-06-25	2026-06-26	1	150.00	150.00	150.00	0.00	CheckedOut	Paid	f	2	0	Ocean view if possible	2026-06-24 21:07:31.380389	2026-06-24 21:07:31.596931	1	1	\N	\N	2026-06-24 21:07:30.865625	2026-06-24 21:07:31.597764
2	10	1	ACC-2026-98A6B833	2026-06-25	2026-06-26	1	150.00	150.00	150.00	0.00	CheckedOut	Paid	f	2	0	Ocean view if possible	2026-06-24 21:08:01.548959	2026-06-24 21:08:01.76362	1	1	\N	\N	2026-06-24 21:08:00.976264	2026-06-24 21:08:01.765
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.activity_logs (activity_id, user_id, activity_type, description, reference_table, reference_id, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: alembic_version; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.alembic_version (version_num) FROM stdin;
aff1fdec6b39
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.audit_logs (audit_id, table_name, record_id, action, old_values, new_values, changed_by, ip_address, changed_at) FROM stdin;
\.


--
-- Data for Name: conference_halls; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.conference_halls (hall_id, hall_name, capacity, hourly_rate, full_day_rate, half_day_rate, description, amenities, is_active, created_at, updated_at) FROM stdin;
1	Grand Ballroom	150	100.00	600.00	350.00	Spacious grand ballroom for large events	Projector, PA system, AC	t	2026-06-24 21:07:28.301378	2026-06-24 21:07:28.301384
\.


--
-- Data for Name: conference_meal_bookings; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.conference_meal_bookings (meal_booking_id, conference_res_id, package_id, num_participants, price_per_person, total_cost) FROM stdin;
\.


--
-- Data for Name: conference_meal_packages; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.conference_meal_packages (package_id, package_name, description, price_per_person, min_participants, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: conference_reservations; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.conference_reservations (conference_res_id, customer_id, hall_id, reservation_code, event_name, event_date, start_time, end_time, num_participants, booking_type, hall_cost, resource_cost, meal_cost, total_amount, amount_paid, balance_due, reservation_status, payment_status, special_requests, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
1	10	1	CON-2026-B0C31533	Annual General Meeting	2026-06-25	09:00:00	17:00:00	50	FullDay	600.00	0.00	0.00	600.00	600.00	0.00	Pending	Paid	Projector and sound system required	\N	\N	2026-06-24 21:08:02.041998	2026-06-24 21:08:02.385206
\.


--
-- Data for Name: conference_resource_bookings; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.conference_resource_bookings (resource_booking_id, conference_res_id, resource_id, quantity, rate, total_cost) FROM stdin;
\.


--
-- Data for Name: conference_resources; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.conference_resources (resource_id, resource_name, daily_rate, quantity, is_available, created_at) FROM stdin;
\.


--
-- Data for Name: customer_reviews; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.customer_reviews (review_id, customer_id, review_type, reference_id, rating, comment, management_reply, replied_by, replied_at, is_published, created_at) FROM stdin;
1	1	Restaurant	2	5	Tasted absolutely superb!	\N	\N	\N	t	2026-06-24 20:46:03.542717
\.


--
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.customers (customer_id, user_id, customer_code, full_name, phone_number, passport_number, nin, customer_type, is_contract_client, total_spent, visit_count, loyalty_points, created_at, updated_at, email, gender, date_of_birth, nationality, address, is_active) FROM stdin;
1	30	CUST-20260624201636-3C75D186	Keti Test 264d42	+256700e71511	\N	\N	Registered	f	0.00	0	0	2026-06-24 20:16:36.043258	2026-06-24 20:16:36.043262	keti_791f11@gmail.com	male	2026-06-24	ug	kati	t
2	31	CUST-20260624201725-083A1DDC	keti	077677333	k786	cm544	Registered	f	0.00	0	0	2026-06-24 20:17:25.242763	2026-06-24 20:17:25.242766	ahikirizahenry5@gmail.com	male	2026-06-24	ug	kati	t
3	1	CUST-49748ABA	Keti	077677333	\N	\N	Registered	f	0.00	0	0	2026-06-24 20:44:54.343331	2026-06-24 20:44:54.343335	ahikirizahenry5@gmail.com	male	\N	\N	\N	t
4	32	CUST-20260624205424-040A451A	CRM Updated Name	+256700794754	\N	\N	Registered	f	0.00	0	0	2026-06-24 20:54:24.58971	2026-06-24 20:54:24.971226	crm_test_41cd09ac@gmail.com	female	1998-05-15	ug	Kampala	t
5	33	CUST-20260624205449-8292AD7A	CRM Updated Name	+25670004176e	\N	\N	Registered	f	0.00	0	0	2026-06-24 20:54:49.834547	2026-06-24 20:54:50.213786	crm_test_d5b59b61@gmail.com	female	1998-05-15	ug	Kampala	t
6	34	CUST-20260624205512-DDEF536D	CRM Updated Name	+256700c34b91	\N	\N	Registered	f	0.00	0	0	2026-06-24 20:55:12.365581	2026-06-24 20:55:13.606855	crm_test_c9b3d24a@gmail.com	female	1998-05-15	ug	Kampala	f
7	35	CUST-20260624210204-323DC95B	Reset Test Customer	+2567006f7581	\N	\N	Registered	f	0.00	0	0	2026-06-24 21:02:04.619734	2026-06-24 21:02:04.619739	cust_reset_5ad355b2@example.com	male	1995-10-10	ug	Kampala	t
8	36	CUST-20260624210640-F04E16F5	Booking Flow Customer	+256700a83da1	\N	\N	Registered	f	0.00	0	0	2026-06-24 21:06:40.310195	2026-06-24 21:06:40.310199	book_test_fb583363@gmail.com	male	1990-01-01	ug	Entebbe	t
9	37	CUST-20260624210730-80A3B0DB	Booking Flow Customer	+256700dbf53a	\N	\N	Registered	f	0.00	0	0	2026-06-24 21:07:30.645674	2026-06-24 21:07:30.645677	book_test_dc56dc03@gmail.com	male	1990-01-01	ug	Entebbe	t
10	38	CUST-20260624210800-69EC693D	Booking Flow Customer	+2567003d3595	\N	\N	Registered	f	0.00	0	0	2026-06-24 21:08:00.755928	2026-06-24 21:08:00.755932	book_test_bf96102d@gmail.com	male	1990-01-01	ug	Entebbe	t
\.


--
-- Data for Name: device_tokens; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.device_tokens (device_token_id, user_id, token, platform, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: guest_checkin_details; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.guest_checkin_details (checkin_detail_id, reservation_id, guest_name, nationality, phone_number, next_of_kin, next_of_kin_phone, passport_number, nin, is_primary, created_at) FROM stdin;
\.


--
-- Data for Name: hall_photos; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.hall_photos (photo_id, hall_id, photo_url, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: login_logs; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.login_logs (login_log_id, user_id, email, ip_address, user_agent, device_info, login_status, failure_reason, attempted_at) FROM stdin;
2	1	ahikirizahenry5@gmail.com	\N	\N	\N	Success	\N	2026-06-23 02:43:37.166641
3	1	ahikirizahenry5@gmail.com	\N	\N	\N	Success	\N	2026-06-23 02:50:44.482073
4	1	ahikirizahenry5@gmail.com	\N	\N	\N	Failed	\N	2026-06-23 03:26:53.695667
5	1	ahikirizahenry5@gmail.com	\N	\N	\N	Success	\N	2026-06-23 03:27:04.91837
6	1	ahikirizahenry5@gmail.com	\N	\N	\N	Success	\N	2026-06-23 03:39:21.924115
8	11	test_35651d05@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 19:41:55.373088
9	11	test_35651d05@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 19:42:09.216716
10	12	test_b43cea38@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 19:42:29.19709
12	15	test_c4efbf1d@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 19:42:53.167624
14	18	test_87f7647e@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 19:43:27.110026
16	22	test_26ad6b10@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 19:44:44.205042
17	1	ahikirizahenry5@gmail.com	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	Success	\N	2026-06-24 19:46:24.080791
18	25	test_83dcee06@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 20:00:59.502259
19	27	test_0437bb4b@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 20:01:13.988768
20	1	ahikirizahenry5@gmail.com	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	Success	\N	2026-06-24 20:03:23.172266
21	31	ahikirizahenry5@gmail.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 20:33:05.046985
22	31	ahikirizahenry5@gmail.com	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	Failed	\N	2026-06-24 20:38:33.03699
23	31	ahikirizahenry5@gmail.com	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	\N	Success	\N	2026-06-24 20:38:41.484857
24	35	cust_reset_5ad355b2@example.com	127.0.0.1	python-httpx/0.25.2	\N	Success	\N	2026-06-24 21:02:07.719659
\.


--
-- Data for Name: menu_categories; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.menu_categories (category_id, category_name, description, image_url, sort_order, is_active, created_at) FROM stdin;
1	starters	beggining at the very meal	string	0	t	2026-06-23 02:45:09.0813
2	drinks	cool	string	0	t	2026-06-23 02:57:26.307615
3	Drinks 14db22	Refreshing beverage choices	\N	0	t	2026-06-24 20:44:54.582773
4	Drinks e3a5c9	Refreshing beverage choices	\N	0	t	2026-06-24 20:46:02.660778
5	CRM Cat bee3	\N	\N	0	t	2026-06-24 20:54:25.120207
6	CRM Cat c4e4	\N	\N	0	t	2026-06-24 20:54:50.36583
7	CRM Cat 5158	\N	\N	0	t	2026-06-24 20:55:12.911252
\.


--
-- Data for Name: menu_extras; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.menu_extras (extra_id, extra_name, price, is_available, created_at, menu_item_id, image_url) FROM stdin;
1	omred	50.00	t	2026-06-23 03:06:25.740018	1	string
2	greens	50.00	t	2026-06-23 03:06:39.730671	3	string
3	paper	50.00	t	2026-06-23 03:07:03.000008	2	string
4	sandwich	50.00	t	2026-06-23 03:08:16.916763	3	string
5	Whipped Cream	1000.00	t	2026-06-24 20:44:54.828029	7	\N
6	Whipped Cream	1000.00	t	2026-06-24 20:46:02.905508	8	\N
\.


--
-- Data for Name: menu_items; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.menu_items (menu_item_id, category_id, item_name, description, price, image_url, allergen_info, preparation_time, is_available, is_active, created_at, updated_at, quantity) FROM stdin;
1	1	gnuts	kipoli	56660.00	string	no alergyic	2	t	t	2026-06-23 02:47:32.283078	2026-06-23 02:47:32.283084	2
2	1	gnuts	kipoli	56660.00	string	no alergyic	2	t	t	2026-06-23 02:49:58.073431	2026-06-23 02:49:58.073436	2
3	1	Matooke	warm	5660.00	string	not for ulcers	3	t	t	2026-06-23 02:57:34.743984	2026-06-23 02:57:34.743989	3
4	1	matooke	string	6770.00	string	no issue	0	t	t	2026-06-23 02:59:05.770734	2026-06-23 02:59:05.770739	1
5	1	matooke	string	6770.00	string	no issue	0	t	t	2026-06-23 03:01:28.883597	2026-06-23 03:01:28.883602	1
6	1	matooke	string	6770.00	string	no issue	0	t	t	2026-06-23 03:08:49.773138	2026-06-23 03:08:49.773142	1
7	3	Smoothie bee03b	Freshly blended organic mango smoothie	5000.00	\N	\N	\N	t	t	2026-06-24 20:44:54.732285	2026-06-24 20:44:54.732292	100
8	4	Smoothie f6f0d8	Freshly blended organic mango smoothie	5000.00	\N	\N	\N	t	t	2026-06-24 20:46:02.808079	2026-06-24 20:46:02.808084	100
9	5	CRM Item 865d	\N	2500.00	\N	\N	\N	t	t	2026-06-24 20:54:25.2081	2026-06-24 20:54:25.208105	0
10	6	CRM Item 6de9	\N	2500.00	\N	\N	\N	t	t	2026-06-24 20:54:50.458782	2026-06-24 20:54:50.458786	0
11	7	CRM Item 9414	\N	2500.00	\N	\N	\N	t	t	2026-06-24 20:55:13.001538	2026-06-24 20:55:13.001543	0
\.


--
-- Data for Name: notification_templates; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.notification_templates (template_id, template_name, subject, body_template, channel, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.notifications (notification_id, customer_id, user_id, template_id, notification_type, channel, title, body, recipient_address, sent_status, delivery_status, read_status, read_at, sent_at, provider_response, created_at) FROM stdin;
\.


--
-- Data for Name: order_item_extras; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.order_item_extras (order_item_extra_id, order_item_id, extra_id, quantity, unit_price, total_price) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.order_items (order_item_id, order_id, menu_item_id, quantity, unit_price, total_price, special_notes) FROM stdin;
1	1	7	2	5000.00	10000.00	Very cold
2	2	8	2	5000.00	10000.00	Very cold
3	5	11	3	2500.00	7500.00	\N
\.


--
-- Data for Name: order_status_history; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.order_status_history (status_hist_id, order_id, old_status, new_status, changed_by, note, changed_at) FROM stdin;
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.password_reset_tokens (token_id, user_id, token, expires_at, used_at, created_at) FROM stdin;
1	3	ce255286d5fa4cbebe8f6828b1229ce2	2026-06-24 03:28:17.550213	\N	2026-06-23 03:28:17.551518
2	3	b6f3aba1734a458382c5ad42b455fbe6	2026-06-24 03:29:39.087681	\N	2026-06-23 03:29:39.089549
3	3	37f4fb04d1074fb2a80313ca1f37c0d4	2026-06-24 03:31:23.236302	\N	2026-06-23 03:31:23.238321
4	3	596793c8bf5d48e7881e178b3738b0fe	2026-06-24 03:33:04.735449	\N	2026-06-23 03:33:04.736968
5	3	9d85f88905024fe380e476c3e9b9596e	2026-06-24 03:38:25.753272	\N	2026-06-23 03:38:25.755282
6	3	0fc028495c51469ca4b64906b4aae3dd	2026-06-24 03:40:05.359361	\N	2026-06-23 03:40:05.35981
7	29	bcd9bb54555645f793529967038a27e2	2026-06-25 20:15:45.039459	\N	2026-06-24 20:15:45.040874
8	30	2bb5fba8bfa144afb92fabf02e591633	2026-06-25 20:16:33.594608	\N	2026-06-24 20:16:33.59545
9	31	c7f827cc8877440f8ca448893cf4be28	2026-06-25 20:17:22.616745	\N	2026-06-24 20:17:22.617503
10	31	7bec8e6b089b4eb3871a9173bd674749	2026-06-25 20:33:02.175048	2026-06-24 20:33:04.983494	2026-06-24 20:33:02.176729
11	31	15b9c63392514238b15507b158831a24	2026-06-25 20:33:05.110958	2026-06-24 20:33:07.299676	2026-06-24 20:33:05.111251
12	31	b0e07a8be32c41be925cf9a3231d55bd	2026-06-25 20:34:46.483206	2026-06-24 20:37:48.69015	2026-06-24 20:34:46.484287
13	32	a101bba6f5354f43b5264f8f6cfb429e	2026-06-25 20:54:22.197252	\N	2026-06-24 20:54:22.198982
14	33	7af160f3bebd4b289dc236d9f05440bb	2026-06-25 20:54:47.676932	\N	2026-06-24 20:54:47.677525
15	34	8324b88aa15746dabf3fb80abe2bcbd1	2026-06-25 20:55:09.565619	\N	2026-06-24 20:55:09.567826
16	35	303906180a554397997accf8a85f870c	2026-06-25 21:02:02.329779	\N	2026-06-24 21:02:02.331476
17	35	a62832dc819043c194d9ea90d1eda4da	2026-06-25 21:02:04.78934	2026-06-24 21:02:07.58259	2026-06-24 21:02:04.789924
18	36	22bd346e7e7e45bd8b599a078d514077	2026-06-25 21:06:38.110863	\N	2026-06-24 21:06:38.112719
19	37	0f2a2c2e4b1e4b8fb11c40e72e6e853b	2026-06-25 21:07:28.488199	\N	2026-06-24 21:07:28.488688
20	38	13cfa7d6b0b141f58e1c6533c60a3fbe	2026-06-25 21:07:58.662737	\N	2026-06-24 21:07:58.663991
\.


--
-- Data for Name: payment_refunds; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.payment_refunds (refund_id, payment_id, refund_amount, reason, processed_by, processed_at, status) FROM stdin;
\.


--
-- Data for Name: payments; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.payments (payment_id, customer_id, payment_type, reference_id, payment_method, transaction_id, payment_reference, amount_paid, currency, payment_status, payment_date, is_deposit, deposit_percent, bank_slip_url, verified_by, verified_at, verification_note, gateway_response, created_at, updated_at, reference_type) FROM stdin;
1	9	AccommodationReservation	1	VISA	\N	PAY-20260624210730-B90A58C0	150.00	UGX	Paid	2026-06-24 21:07:31.016844	f	\N	\N	1	2026-06-24 21:07:31.147158	\N	\N	2026-06-24 21:07:31.01685	2026-06-24 21:07:31.14854	AccommodationReservation
2	10	AccommodationReservation	2	VISA	\N	PAY-20260624210801-298201B3	150.00	UGX	Paid	2026-06-24 21:08:01.186689	f	\N	\N	1	2026-06-24 21:08:01.314875	\N	\N	2026-06-24 21:08:01.186693	2026-06-24 21:08:01.31598	AccommodationReservation
3	10	ConferenceReservation	1	MobileMoney	\N	PAY-20260624210802-1485BBC9	600.00	UGX	Paid	2026-06-24 21:08:02.247213	f	\N	\N	1	2026-06-24 21:08:02.376981	\N	\N	2026-06-24 21:08:02.247218	2026-06-24 21:08:02.37776	ConferenceReservation
\.


--
-- Data for Name: permission_groups; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.permission_groups (group_id, group_name) FROM stdin;
1	Restaurant
2	Accommodation
3	Conference
4	Payments
5	Reports
6	Users
7	Roles
8	CRM
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.permissions (permission_id, permission_key, display_name, description, is_active, created_at, group_id) FROM stdin;
1	restaurant.view	View Restaurant	\N	\N	\N	1
2	restaurant.create	Create Restaurant Order	\N	\N	\N	1
3	restaurant.edit	Edit Restaurant Order	\N	\N	\N	1
4	restaurant.delete	Delete Restaurant Order	\N	\N	\N	1
5	restaurant.kitchen	Manage Kitchen	\N	\N	\N	1
6	accommodation.view	View Accommodation	\N	\N	\N	2
7	accommodation.create	Create Reservation	\N	\N	\N	2
8	accommodation.edit	Edit Reservation	\N	\N	\N	2
9	accommodation.checkin	Manage Check-In/Out	\N	\N	\N	2
10	conference.view	View Conference	\N	\N	\N	3
11	conference.create	Create Conference Booking	\N	\N	\N	3
12	conference.edit	Edit Conference Booking	\N	\N	\N	3
13	payments.view	View Payments	\N	\N	\N	4
14	payments.approve	Approve Payments	\N	\N	\N	4
15	payments.refund	Process Refunds	\N	\N	\N	4
16	reports.view	View Reports	\N	\N	\N	5
17	reports.export	Export Reports	\N	\N	\N	5
18	users.view	View Users	\N	\N	\N	6
19	users.manage	Manage Users	\N	\N	\N	6
20	roles.view	View Roles	\N	\N	\N	7
21	roles.manage	Manage Roles	\N	\N	\N	7
22	crm.view	View CRM	\N	\N	\N	8
23	crm.manage	Manage CRM	\N	\N	\N	8
\.


--
-- Data for Name: restaurant_orders; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.restaurant_orders (order_id, customer_id, order_number, seating_location, delivery_option, delivery_address, delivery_lat, delivery_lng, delivery_charge, preferred_time, special_instr, allergy_info, sub_total, total_amount, amount_paid, balance_due, order_status, payment_status, assigned_waiter, tracking_number, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
1	3	ORD-2026-8B292203	Garden	Premises	\N	\N	\N	0.00	\N	No sugar please	\N	11000.00	11000.00	0.00	0.00	Pending	Pending	\N	\N	\N	\N	2026-06-24 20:44:54.957866	2026-06-24 20:44:55.156777
2	3	ORD-2026-D8D8702C	Garden	Premises	\N	\N	\N	0.00	\N	No sugar please	\N	11000.00	11000.00	11000.00	0.00	Ready	Paid	\N	\N	\N	\N	2026-06-24 20:46:03.035606	2026-06-24 20:46:03.364316
3	4	ORD-2026-D03B8FDE	\N	\N	\N	\N	\N	0.00	\N	\N	\N	0.00	0.00	0.00	0.00	Pending	Pending	\N	\N	\N	\N	2026-06-24 20:54:25.306588	2026-06-24 20:54:25.306592
4	5	ORD-2026-01C1BDB1	\N	\N	\N	\N	\N	0.00	\N	\N	\N	0.00	0.00	0.00	0.00	Pending	Pending	\N	\N	\N	\N	2026-06-24 20:54:50.556911	2026-06-24 20:54:50.556918
5	6	ORD-2026-39B4D532	Indoor	Premises	\N	\N	\N	0.00	\N	\N	\N	7500.00	7500.00	0.00	0.00	Pending	Pending	\N	\N	\N	\N	2026-06-24 20:55:13.102172	2026-06-24 20:55:13.24827
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.role_permissions (role_permission_id, role_id, permission_id, granted_at, granted_by) FROM stdin;
1	2	1	\N	\N
2	2	2	\N	\N
3	2	3	\N	\N
4	2	4	\N	\N
5	2	5	\N	\N
6	2	6	\N	\N
7	2	7	\N	\N
8	2	8	\N	\N
9	2	9	\N	\N
10	2	10	\N	\N
11	2	11	\N	\N
12	2	12	\N	\N
13	2	13	\N	\N
14	2	14	\N	\N
15	2	15	\N	\N
16	2	16	\N	\N
17	2	17	\N	\N
18	2	18	\N	\N
19	2	19	\N	\N
20	2	20	\N	\N
21	2	21	\N	\N
22	2	22	\N	\N
23	2	23	\N	\N
24	3	6	\N	\N
25	3	7	\N	\N
26	3	8	\N	\N
27	3	9	\N	\N
28	3	10	\N	\N
29	3	11	\N	\N
30	3	12	\N	\N
31	3	13	\N	\N
32	3	14	\N	\N
33	3	15	\N	\N
34	3	16	\N	\N
35	3	17	\N	\N
36	3	18	\N	\N
37	3	19	\N	\N
38	3	20	\N	\N
39	3	21	\N	\N
40	3	22	\N	\N
41	3	23	\N	\N
42	4	1	\N	\N
43	4	2	\N	\N
44	4	3	\N	\N
45	4	4	\N	\N
46	4	5	\N	\N
47	4	13	\N	\N
48	4	16	\N	\N
49	4	17	\N	\N
50	4	22	\N	\N
51	5	6	\N	\N
52	5	7	\N	\N
53	5	8	\N	\N
54	5	9	\N	\N
55	5	10	\N	\N
56	5	13	\N	\N
57	5	22	\N	\N
58	6	1	\N	\N
59	6	5	\N	\N
60	7	1	\N	\N
61	7	2	\N	\N
62	7	13	\N	\N
63	8	1	\N	\N
64	8	2	\N	\N
65	8	13	\N	\N
66	8	14	\N	\N
67	8	15	\N	\N
68	9	1	2026-06-24 20:27:23.912687	\N
69	9	2	2026-06-24 20:27:23.91269	\N
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.roles (role_id, role_name, description, parent_role_id, is_active, is_system_role, created_at, updated_at) FROM stdin;
1	Verification Role	Role for registration test	\N	t	f	2026-06-24 19:41:44.635645	2026-06-24 19:41:44.63565
2	Super Admin	Full control over all system modules, configurations, users, and roles.	\N	t	t	\N	\N
3	Hotel Manager	Manages hotel accommodation, conferences, CRM, and financial reports.	\N	t	f	\N	\N
4	Restaurant Manager	Manages restaurant operations, menus, kitchen staff, and reports.	\N	t	f	\N	\N
5	Receptionist	Front desk staff managing guest check-ins, reservations, and general CRM view.	\N	t	f	\N	\N
6	Kitchen Staff	Kitchen operators managing orders, preparations, and food status.	\N	t	f	\N	\N
7	Waiter	Front-of-house staff taking restaurant orders and tracking billing.	\N	t	f	\N	\N
8	Cashier	Billing staff handling restaurant order payments, cash registers, and refunds.	\N	t	f	\N	\N
9	Test Role 6cd132	A temporary role for testing integration.	\N	t	f	2026-06-24 20:27:23.826741	2026-06-24 20:27:23.826744
\.


--
-- Data for Name: room_categories; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.room_categories (room_category_id, category_name, description, base_rate_usd, is_active, created_at) FROM stdin;
1	Deluxe Suite	Luxurious deluxe suite with ocean view	150.00	t	2026-06-24 21:07:28.217633
\.


--
-- Data for Name: room_photos; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.room_photos (photo_id, room_id, photo_url, caption, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: rooms; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.rooms (room_id, room_category_id, room_number, floor, room_status, max_occupancy, description, amenities, is_active, created_at, updated_at) FROM stdin;
1	1	101	1st Floor	Available	2	King size bed, deluxe room	WiFi, AC, TV, Mini-bar	t	2026-06-24 21:07:28.292858	2026-06-24 21:08:01.769902
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.user_roles (user_role_id, user_id, role_id, assigned_at, assigned_by, expires_at) FROM stdin;
1	13	1	2026-06-24 19:42:29.338275	\N	\N
2	16	1	2026-06-24 19:42:53.329961	\N	\N
3	19	1	2026-06-24 19:43:27.235129	\N	\N
4	23	1	2026-06-24 19:44:44.369809	\N	\N
6	26	1	2026-06-24 20:00:59.662165	\N	\N
7	28	1	2026-06-24 20:01:14.155201	\N	\N
8	1	2	2026-06-24 20:07:21.506769	\N	\N
\.


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.user_sessions (session_id, user_id, refresh_token, device_info, ip_address, user_agent, is_active, created_at, expires_at, revoked_at) FROM stdin;
1	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaGlraXJpemFoZW5yeTVAZ21haWwuY29tIiwiZXhwIjoxNzgyNzg3NDE3LCJ0eXBlIjoicmVmcmVzaCJ9.ue4YdNQPe9Rfz3NHgBukMNxpcmNQ4cPvu_v9A55IuWc	\N	\N	\N	t	2026-06-23 02:43:37.174755	2026-06-30 02:43:37.164133	\N
2	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaGlraXJpemFoZW5yeTVAZ21haWwuY29tIiwiZXhwIjoxNzgyNzg3ODQ0LCJ0eXBlIjoicmVmcmVzaCJ9.3BlgeLfj4bGTaNBY8YaHxo5VNTBx9LG8cgT4iFZUM1I	\N	\N	\N	t	2026-06-23 02:50:44.488943	2026-06-30 02:50:44.479241	\N
3	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaGlraXJpemFoZW5yeTVAZ21haWwuY29tIiwiZXhwIjoxNzgyNzkwMDI0LCJ0eXBlIjoicmVmcmVzaCJ9.9P_4YcFfglkLE-kfJijWvMs4QNOl3RtWa7R7LTo5es0	\N	\N	\N	t	2026-06-23 03:27:04.926916	2026-06-30 03:27:04.917382	\N
4	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaGlraXJpemFoZW5yeTVAZ21haWwuY29tIiwiZXhwIjoxNzgyNzkwNzYxLCJ0eXBlIjoicmVmcmVzaCJ9.Dtozr9M-pDDrg-6I5bUYqMxEdsSYImFrDZvKjexr6aY	\N	\N	\N	t	2026-06-23 03:39:21.931626	2026-06-30 03:39:21.922261	\N
5	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5IiwiZW1haWwiOiJ0ZXN0XzQyMThlZjQxQGdtYWlsLmNvbSIsImV4cCI6MTc4MjkzMzg1NiwidHlwZSI6InJlZnJlc2gifQ.KhVRCfUcGmj9fIhT6V9B5u_pUR0oUsI9rLa7mBhVUFk	\N	\N	\N	t	2026-06-24 19:24:16.504188	2026-07-01 19:24:16.502029	\N
6	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMCIsImVtYWlsIjoidGVzdF80YTY4NmI0Y0BnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ4NzksInR5cGUiOiJyZWZyZXNoIn0.LSwo-zAZtTEgxTwM7tBQqMUHuQHLIEJCMFfK92I3Z5E	\N	\N	\N	t	2026-06-24 19:41:19.617744	2026-07-01 19:41:19.616568	\N
7	11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsImVtYWlsIjoidGVzdF8zNTY1MWQwNUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5MDQsInR5cGUiOiJyZWZyZXNoIn0.zC2Xh1QVl_dNxp6MtEQVIVdbkRkVrDUrzDgs6W6S-iU	\N	\N	\N	t	2026-06-24 19:41:44.190347	2026-07-01 19:41:44.190101	\N
9	11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsImVtYWlsIjoidGVzdF8zNTY1MWQwNUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5MTUsInR5cGUiOiJyZWZyZXNoIn0.KJveUx5exawbfFCXvu4QPP0dZLsiPrIYVjTZ-AYa2oQ	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 19:41:55.375439	2026-07-01 19:41:55.372683	\N
10	11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsImVtYWlsIjoidGVzdF8zNTY1MWQwNUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5MjksInR5cGUiOiJyZWZyZXNoIn0.s7yJ6VqQYQyaYADO7-3N80h0TPjJKsmzM7LisC6gooI	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 19:42:09.219299	2026-07-01 19:42:09.216286	\N
11	12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMiIsImVtYWlsIjoidGVzdF9iNDNjZWEzOEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NDgsInR5cGUiOiJyZWZyZXNoIn0.iWFPpxJJxtLwTpAw8q-1OsKZdkHloz9DuNqfrH8gHeI	\N	\N	\N	t	2026-06-24 19:42:28.692447	2026-07-01 19:42:28.692165	\N
12	12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMiIsImVtYWlsIjoidGVzdF9iNDNjZWEzOEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NDksInR5cGUiOiJyZWZyZXNoIn0.z3bfGbLg_ifWdcjw5wvDXk6VTCBn_dZVbnWOZ4PXYW8	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 19:42:29.199887	2026-07-01 19:42:29.196629	\N
13	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMyIsImVtYWlsIjoidGVzdF9jZjUxYjk5YUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NDksInR5cGUiOiJyZWZyZXNoIn0.A_OjmvJ8q0PM0wXv_p89TTciADU0F97yn-DP-IdN0Po	\N	\N	\N	t	2026-06-24 19:42:29.360152	2026-07-01 19:42:29.359876	\N
14	14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNCIsImVtYWlsIjoidGVzdF9mMzdlZGM5N0BnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NjEsInR5cGUiOiJyZWZyZXNoIn0.aXZWEw0wdBGbDETMTw7MSZLydmg_Tk_LbQZadPq4vKg	\N	\N	\N	t	2026-06-24 19:42:41.436439	2026-07-01 19:42:41.436179	\N
16	15	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNSIsImVtYWlsIjoidGVzdF9jNGVmYmYxZEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NzIsInR5cGUiOiJyZWZyZXNoIn0.G7ArkDy2M4Pnpkt6_3IWrjlrzKN0feW9l9FwwCzb0A0	\N	\N	\N	t	2026-06-24 19:42:52.653877	2026-07-01 19:42:52.653633	\N
17	15	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNSIsImVtYWlsIjoidGVzdF9jNGVmYmYxZEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NzMsInR5cGUiOiJyZWZyZXNoIn0.oYLKAhLENQ0JMrXIcGFdDXF3YySNFRP0cbVkoCOxwtE	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 19:42:53.169096	2026-07-01 19:42:53.166896	\N
18	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNiIsImVtYWlsIjoidGVzdF8wNDEwOTc2Y0BnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5NzMsInR5cGUiOiJyZWZyZXNoIn0.YXgr3kxE1UPEcE_gG7F7RBYE0ZCn5AukAp7BF-Z71Zo	\N	\N	\N	t	2026-06-24 19:42:53.353152	2026-07-01 19:42:53.352879	\N
19	17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxNyIsImVtYWlsIjoidGVzdF9lNTY1ZmJlNkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzQ5ODUsInR5cGUiOiJyZWZyZXNoIn0.ZtfJw6I51iip7p5Tz8Qsrf3P2qQFlQenmGWWR7GGlKI	\N	\N	\N	t	2026-06-24 19:43:05.230143	2026-07-01 19:43:05.229861	\N
21	18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOCIsImVtYWlsIjoidGVzdF84N2Y3NjQ3ZUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwMDYsInR5cGUiOiJyZWZyZXNoIn0.GiXRPwL54xZ-gAdPqvB78uW1BAxAwRGVH_wAxq4wY6g	\N	\N	\N	t	2026-06-24 19:43:26.595355	2026-07-01 19:43:26.594758	\N
22	18	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOCIsImVtYWlsIjoidGVzdF84N2Y3NjQ3ZUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwMDcsInR5cGUiOiJyZWZyZXNoIn0.XBEW593QvnIZl_zroDNYH4UvjAo806g0eXsQ35qKGQw	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 19:43:27.111677	2026-07-01 19:43:27.109605	\N
23	19	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxOSIsImVtYWlsIjoidGVzdF81MDg2MzIyNEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwMDcsInR5cGUiOiJyZWZyZXNoIn0._UYv3NDKszVb-iL5o-0HyzlCt7HLHcY9aMfZd6-j7Ns	\N	\N	\N	t	2026-06-24 19:43:27.262439	2026-07-01 19:43:27.262147	\N
24	20	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMCIsImVtYWlsIjoidGVzdF85MDRjNTA1NkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwMzIsInR5cGUiOiJyZWZyZXNoIn0.S9HxkLartzEXjotaMy4dZYtj4AOaG8mlbVaQViOa6D8	\N	\N	\N	t	2026-06-24 19:43:52.143729	2026-07-01 19:43:52.143477	\N
26	21	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMSIsImVtYWlsIjoidGVzdF8xMDZkZjNmMkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwNTcsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiZjI4YWIyZmQtNjM4Ni00NTY3LTkxNDEtN2ExYmE0MmNkZTIxIn0.k0QSdKlsT8ghreZHihww1bWHIhwfOBqVXizXPC_KRbk	\N	\N	\N	t	2026-06-24 19:44:17.629238	2026-07-01 19:44:17.628401	\N
27	22	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMiIsImVtYWlsIjoidGVzdF8yNmFkNmIxMEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwODMsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNjVlZWQ4NGQtZGJhNC00MzMzLTg4ZGMtZTY3NTFmZmVhYTAwIn0.Hhlnp8EydKsnuKPYNh0VnVa8tWfyPtbhIj40mMwyYPA	\N	\N	\N	t	2026-06-24 19:44:43.716813	2026-07-01 19:44:43.715857	\N
28	22	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMiIsImVtYWlsIjoidGVzdF8yNmFkNmIxMEBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwODQsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiODQwN2UxN2MtN2I4Yi00MzBjLTk5N2YtNWNjN2EwZjE4NDA1In0.z9H3CI48y0eDHGlfGR3blLqSkOaMVQkeCRs9yPnuEDc	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 19:44:44.208946	2026-07-01 19:44:44.203929	\N
29	23	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyMyIsImVtYWlsIjoidGVzdF9lNzc3NzM5M0BnbWFpbC5jb20iLCJleHAiOjE3ODI5MzUwODQsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNjg4YmE1ZTAtYTA4OC00ZmE2LTg0MTYtZjJhNzM0NzcxNDFkIn0.EZV7gZDB25C3_5zW5qn8WVOD34TzdSnOkK82U8FH180	\N	\N	\N	t	2026-06-24 19:44:44.400827	2026-07-01 19:44:44.400575	\N
30	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaGlraXJpemFoZW5yeTVAZ21haWwuY29tIiwiZXhwIjoxNzgyOTM1MTg0LCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6IjZlMDAyNGM2LTY0MDMtNDM3Ny05NmJhLWY5NGYxZTI4MGNiNiJ9.21hviVfNsaVHXc2USpauT-KKFM2ozph4VW6iYHWUZLo	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	2026-06-24 19:46:24.084121	2026-07-01 19:46:24.079469	\N
31	25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNSIsImVtYWlsIjoidGVzdF84M2RjZWUwNkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzYwNTksInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOWU3YjhkMjYtNTM1ZS00YmRhLWIwMWEtM2I5YjdlMGJjZmM1In0.YU_Sy008lzEka0aAh8g7gDBP8O96vedFD1-rEFLYKCA	\N	\N	\N	t	2026-06-24 20:00:59.036489	2026-07-01 20:00:59.035678	\N
32	25	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNSIsImVtYWlsIjoidGVzdF84M2RjZWUwNkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzYwNTksInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOWRmMTNjZjctM2FkNi00ZmViLTgxZDAtZWE2MDUzMjZiNWY3In0.GUjpDIfLewIdlGwYEkN6NQhqO7qQqWnlm94P2bZozWU	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 20:00:59.504637	2026-07-01 20:00:59.501204	\N
33	26	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNiIsImVtYWlsIjoidGVzdF9kZTRlNmVmMUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzYwNTksInR5cGUiOiJyZWZyZXNoIiwianRpIjoiOGYzZjJjZjMtMmEzNy00Yzc4LTlhN2YtYzlmZTViZWFmMzZjIn0.Qw9shvbrCNT31tufw29LgtjJjj8G4UuU2-jxbGv2vJs	\N	\N	\N	t	2026-06-24 20:00:59.687031	2026-07-01 20:00:59.68679	\N
34	27	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNyIsImVtYWlsIjoidGVzdF8wNDM3YmI0YkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzYwNzMsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiNmQyMjMyZDctN2E5Mi00ZjFiLWEwN2MtM2JmNzk2NWQ0ZDczIn0.AaaJHAVy69Lr1NUwinqExa96NBRzMnVT1bxN3fkjtpg	\N	\N	\N	t	2026-06-24 20:01:13.480905	2026-07-01 20:01:13.480652	\N
35	27	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNyIsImVtYWlsIjoidGVzdF8wNDM3YmI0YkBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzYwNzMsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiYzg1MTZhZWItMGM1ZC00NjM5LWJkMzktNGI2Y2FkZDI0ZGQ3In0.GKdaa9vIqVs0MWKNFbN_A4RxwVfpmAWm2tupKrk8FYY	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 20:01:13.990541	2026-07-01 20:01:13.988193	\N
36	28	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyOCIsImVtYWlsIjoidGVzdF8wNmQyNTBlZUBnbWFpbC5jb20iLCJleHAiOjE3ODI5MzYwNzQsInR5cGUiOiJyZWZyZXNoIiwianRpIjoiYjllZTZmNDItNzc3Mi00YWI0LWI2MzItNzhjZjFkMDk1YWFiIn0.rDscijpnd9NQJC1xZvX87tNYoFa4ZwyTDB6mIbBOzJc	\N	\N	\N	t	2026-06-24 20:01:14.178368	2026-07-01 20:01:14.178113	\N
37	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZW1haWwiOiJhaGlraXJpemFoZW5yeTVAZ21haWwuY29tIiwiZXhwIjoxNzgyOTM2MjAzLCJ0eXBlIjoicmVmcmVzaCIsImp0aSI6ImE0NDAxMzkwLWFlOTItNDg4NC1iOWNlLWE3YzJlMjk2ZDA5MSJ9.S_9OxfM_naNy7OrSp3lNKS7o-45oVSdT6IFMgbnaWDM	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	2026-06-24 20:03:23.175564	2026-07-01 20:03:23.17102	\N
38	31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMSIsImVtYWlsIjoiYWhpa2lyaXphaGVucnk1QGdtYWlsLmNvbSIsImV4cCI6MTc4MjkzNzk4NSwidHlwZSI6InJlZnJlc2giLCJqdGkiOiJhY2Y5ZmRkMS02Y2NlLTQxZjYtOGJiZS03YTk4ZTQxNmQxM2QifQ.KgmaQnxrS9wzDXe6alC95G_NL2tZvcFjy4gZ27lJqb8	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 20:33:05.04984	2026-07-01 20:33:05.045782	\N
39	31	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzMSIsImVtYWlsIjoiYWhpa2lyaXphaGVucnk1QGdtYWlsLmNvbSIsImV4cCI6MTc4MjkzODMyMSwidHlwZSI6InJlZnJlc2giLCJqdGkiOiI2ZDBkZGZlNC03NTg4LTQxZDQtOWE3My1jYmI5NzVjYjE4ZWUifQ.4GOebdSpI4c6eVqFo6Hz3LrAzFUguqZt2SGMfPh9U3o	\N	127.0.0.1	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36	t	2026-06-24 20:38:41.487734	2026-07-01 20:38:41.484385	\N
40	35	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzNSIsImVtYWlsIjoiY3VzdF9yZXNldF81YWQzNTViMkBleGFtcGxlLmNvbSIsImV4cCI6MTc4MjkzOTcyNywidHlwZSI6InJlZnJlc2giLCJqdGkiOiJjZjIwMzhjNy0wYWVkLTQyYjAtYWJjZS01NmM1OGFiZmQ3NzMifQ.99CuXWj2PbpwSt7NzH3vd0jdfu8k_wvirNFry-ssdnU	\N	127.0.0.1	python-httpx/0.25.2	t	2026-06-24 21:02:07.725157	2026-07-01 21:02:07.717623	\N
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: seyeya_user
--

COPY public.users (user_id, full_name, email, phone_number, password_hash, is_staff, is_active, last_login_at) FROM stdin;
2	Henry	ahikirizahenry@gmail.com	0771892263	$pbkdf2-sha256$29000$sFYKYcyZs7aWshYiBCDkfA$xXW4CZy7fMOQmNdvzNC1pLzZ5mGzY0dydOdGWw5UW18	f	t	\N
30	Keti Test 264d42	keti_791f11@gmail.com	+256700e71511	$pbkdf2-sha256$29000$lpLS.p.zFuKcc.4dg1CqtQ$BCwXuS.QNhmutRkJwKc/V6bsIqCCyEGWeP658oKe05s	f	t	\N
22	Heinrich Test 1	test_26ad6b10@gmail.com	+256777000111	$pbkdf2-sha256$29000$DoEQ4lwr5fz//58TwjgHQA$TG2T2QX2UJou67L7GCru8iHF29vHyzynkb2b.HO1iHQ	t	t	2026-06-24 19:44:44.203728
3	kiza	kiza@gmail.com	07787777	$pbkdf2-sha256$29000$ljJGCAHg3LsX4lyrNWaMsQ$J10eWg/IoiakP6eD7c2oAj8DWt08VyfPKGXiDIE62zY	f	t	\N
4	Top	top@example.com	0771892263	$pbkdf2-sha256$29000$fg8BIESIMaZUSqlVyhnjHA$WljInY9UOSTYpUTAnCqiFZu3qbN8xUzrS6XjpoBveHg	f	t	\N
5	Topi	topi@example.com	0771892263	$pbkdf2-sha256$29000$rzWGcA7BeI8xJkTIeY9xjg$qwjRrnGO/f69Zv1RiiEGyXpUZaLPdjvgxwmrNRMXLDA	f	t	\N
6	keti	keti@gmail.com	078877778	$pbkdf2-sha256$29000$8N4bo7TWute6t7a29n6vdQ$U.Z8sN78eopWwSObFt/vNh1CJMIOKSmhGc2UyrQnqCo	f	t	\N
7	Heinrich Test	test_df44dc1a@gmail.com	+256777000111	$pbkdf2-sha256$29000$UEqJ8R5DyHnPWWttzfl/zw$INH.6uS3ZuIv522XKAHVzX8jiIdNiudQohgRKkbAzQI	f	t	\N
8	Heinrich Test	test_ae9ec0bd@gmail.com	+256777000111	$pbkdf2-sha256$29000$EyJkDEEoxRiD8P5/z7lXCg$g7XCxDqUpXy4PqyJ2QPGxp9uA5/.PX2xrXC7qZO83qc	f	t	\N
9	Heinrich Test	test_4218ef41@gmail.com	+256777000111	$pbkdf2-sha256$29000$HgMA4Jzz3psTwjhHqHWO0Q$kgpb80KAcTC.trJehOBhMY4vNnBnT8PoihTc4m3GOwQ	f	t	\N
10	Heinrich Test 1	test_4a686b4c@gmail.com	+256777000111	$pbkdf2-sha256$29000$L4VwznlvjbHWOgfgHIMwpg$LCGkNzK0tOcwgo7wOOfmE2tUKQIG8Y4IrNu6IJekBgg	f	t	\N
23	Heinrich Test 2	test_e7777393@gmail.com	+256777000222	$pbkdf2-sha256$29000$oFRqzVmL0fo/J0QIQSiFsA$uq2acajV9bypeFOG/6S9kFioVAWtW9nUJI0o8QPxwhY	f	t	\N
38	Booking Flow Customer	book_test_bf96102d@gmail.com	+2567003d3595	$pbkdf2-sha256$29000$nrP2Psd4r9VaC.HcW2uN8Q$wSxkjBEiF6PMT9mfaJNw1MnwKdnjsBpiejrE.7SRdIU	f	t	\N
24	Henry	henry.ahikiriza@travelport.co.ug	0771892264	$pbkdf2-sha256$29000$q5VSytl7Tykl5Lz3nrMWgg$h3IdNkExyUkF0mhMOUG79lAxY62EVwWDmEjX19B0VdE	f	t	\N
11	Heinrich Test 1	test_35651d05@gmail.com	+256777000111	$pbkdf2-sha256$29000$3JuzNoaQ0hqD0DpH6F1rzQ$tKOkYutrcPqUUr9d1Cv2NHLZIC37Ef8dyEc6VE0mAZE	t	t	2026-06-24 19:42:09.216127
12	Heinrich Test 1	test_b43cea38@gmail.com	+256777000111	$pbkdf2-sha256$29000$ttYaQ4iREkJoLSWk9D4HgA$gtQRlmATmik.3dhZJt3mKXf80dTKVIWEdSw2KI8Nlvo	t	t	2026-06-24 19:42:29.196466
13	Heinrich Test 2	test_cf51b99a@gmail.com	+256777000222	$pbkdf2-sha256$29000$BYDQ2juHUCpljJESwhhjrA$.VoTms8Rf7Pj2E4YXioOqg9UwB6eRKzhjt3lUsPdFzc	f	t	\N
14	Heinrich Test 1	test_f37edc97@gmail.com	+256777000111	$pbkdf2-sha256$29000$SInRWotxDiHEmPP.v9faGw$UZYNpF/p4RFopAP0ZE3dQifMkx0UrJKV18WjkrwLmJk	t	t	\N
35	Reset Test Customer	cust_reset_5ad355b2@example.com	+2567006f7581	$pbkdf2-sha256$29000$4hxD6P3fO.f8fw8BgJBSyg$UQBAKHJc0/s1Tm1y/WfYPrsuiCQSHa5oqtK/WHhAho8	f	t	2026-06-24 21:02:07.717242
25	Heinrich Test 1	test_83dcee06@gmail.com	+256777000111	$pbkdf2-sha256$29000$PWcsBUBIKSUkhHBuDUEoJQ$k7ENJbMdVU4mBpclt6muogpA4wkwwYv9DHp4yK.M0T4	t	t	2026-06-24 20:00:59.500972
15	Heinrich Test 1	test_c4efbf1d@gmail.com	+256777000111	$pbkdf2-sha256$29000$r/UeA4Aw5ry3NoawViolxA$z0MGij3xA8qh/fd9Vuqlh.tVDHFP5gW3JOs5n3Mxou4	t	t	2026-06-24 19:42:53.166751
16	Heinrich Test 2	test_0410976c@gmail.com	+256777000222	$pbkdf2-sha256$29000$QYgRwhhDyJnznhPiPIcQAg$k23N6qQjOJ6U/IGV7Qpws480ASzoxMxeJ9ioxU/Kdow	f	t	\N
17	Heinrich Test 1	test_e565fbe6@gmail.com	+256777000111	$pbkdf2-sha256$29000$LkXIee9dS8nZu1eqFeK8Nw$6cdMqocYWvapwHPjN3/XYVgdjJTBBWw09VFYYUumUNg	t	t	\N
26	Heinrich Test 2	test_de4e6ef1@gmail.com	+256777000222	$pbkdf2-sha256$29000$c.6dM8a4dw4hZCwFQCglhA$11d3lNw85w1QMERXi0yeIrmSpwID/7D2hihcTMg1DW4	f	t	\N
18	Heinrich Test 1	test_87f7647e@gmail.com	+256777000111	$pbkdf2-sha256$29000$bY1xLkWIMabUmvP.n9M6pw$dxZr7K7jDDVkqPECS137Hgtn4XC/VnlyrGvk0yxE.78	t	t	2026-06-24 19:43:27.109457
19	Heinrich Test 2	test_50863224@gmail.com	+256777000222	$pbkdf2-sha256$29000$bQ3hnPPeW4vR.v9f6z2ntA$85WZ7y0mpUhEp330I9kol3xKDjrk9aeb06RPoPzGSXA	f	t	\N
20	Heinrich Test 1	test_904c5056@gmail.com	+256777000111	$pbkdf2-sha256$29000$hJByjtEaw7jXei.l9N57jw$U0foR7SFDaC89Cpat4mBnyy.mWKH/Qmbe6maZMNq.MY	t	t	\N
36	Booking Flow Customer	book_test_fb583363@gmail.com	+256700a83da1	$pbkdf2-sha256$29000$lDJmrHXOubf2nvM.x9g7xw$4ka3/gRy46fbsqQ.T9zVBagvWxraYrEk8grpZBdvZR8	f	t	\N
27	Heinrich Test 1	test_0437bb4b@gmail.com	+256777000111	$pbkdf2-sha256$29000$ICQEwPh/DwFA6B0DAGBMSQ$sYLmykP5gxlvkGpim01D1rJvaMEPVrX2MUOQZl/S6ws	t	t	2026-06-24 20:01:13.98796
28	Heinrich Test 2	test_06d250ee@gmail.com	+256777000222	$pbkdf2-sha256$29000$vTcmROjdG4PQuhei9J5Tig$uI1Q4vqghUhUiBpOGWFm5iKbT7/G5HQMZX0QZx.E.2g	f	t	\N
37	Booking Flow Customer	book_test_dc56dc03@gmail.com	+256700dbf53a	$pbkdf2-sha256$29000$Q2hN6R1DaI2x9r7XurfW2g$XT/ZiWGcqP/wZemuRIl11DpgGUtDN9XPH7sIYRd4IgU	f	t	\N
31	keti	ahikirizahenry5@gmail.com	077677333	$pbkdf2-sha256$29000$lNLaO2cspdT6v3fO.d8bww$n6j2LMhYT78P8f3BLjjL5HRRsg.EvyDObBcrIdD3BGk	f	t	2026-06-24 20:38:41.483294
21	Heinrich Test 1	test_106df3f2@gmail.com	+256777000111	$pbkdf2-sha256$29000$y9lbq5WS0vo/Z0xJibHWWg$CMMguNa75i9eCkmgj.NzCH4ouGJZvzwtCOpYdcxODE8	f	f	\N
1	string	user@example.com	078999999	$pbkdf2-sha256$29000$VQrhXIuxtjbmXIsxphTCWA$PLuUTGgmEjFdu28Bmr1k0CoapQEQ6LJ1bUy.qXkm3TY	t	t	2026-06-24 20:03:23.170002
29	Keti Test 9ba6c4	keti_213d7b@gmail.com	+2567009f01e9	$pbkdf2-sha256$29000$jTEmJEToHeMcw5hTKiVE6A$GufLnvf1bzIASFgqbnHYNJFonaZZn3iNNez4VCxaMrA	f	t	\N
32	CRM Test Customer	crm_test_41cd09ac@gmail.com	+256700794754	$pbkdf2-sha256$29000$GuM8xzhnTMlZa80Zw/j//w$pcN4CBby0/MTfuIH8A83GkkNgoKYfr46bsx1QvMkroU	f	t	\N
33	CRM Test Customer	crm_test_d5b59b61@gmail.com	+25670004176e	$pbkdf2-sha256$29000$3XvvnZPy3junNKZ0zlmLkQ$DldEaQngjmfoi2BaMffiY95BNsn3EYT7nZj1pIqeCqw	f	t	\N
34	CRM Test Customer	crm_test_c9b3d24a@gmail.com	+256700c34b91	$pbkdf2-sha256$29000$qBWCcM45B8CY0zqHMIbw3g$agLovP4FtbCzvTO09QJGrOEJbN8mrxGM9u3xran9lQM	f	t	\N
\.


--
-- Name: accommodation_reservations_reservation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.accommodation_reservations_reservation_id_seq', 2, true);


--
-- Name: activity_logs_activity_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.activity_logs_activity_id_seq', 1, false);


--
-- Name: audit_logs_audit_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.audit_logs_audit_id_seq', 1, false);


--
-- Name: conference_halls_hall_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.conference_halls_hall_id_seq', 1, true);


--
-- Name: conference_meal_bookings_meal_booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.conference_meal_bookings_meal_booking_id_seq', 1, false);


--
-- Name: conference_meal_packages_package_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.conference_meal_packages_package_id_seq', 1, false);


--
-- Name: conference_reservations_conference_res_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.conference_reservations_conference_res_id_seq', 1, true);


--
-- Name: conference_resource_bookings_resource_booking_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.conference_resource_bookings_resource_booking_id_seq', 1, false);


--
-- Name: conference_resources_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.conference_resources_resource_id_seq', 1, false);


--
-- Name: customer_reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.customer_reviews_review_id_seq', 1, true);


--
-- Name: customers_customer_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.customers_customer_id_seq', 10, true);


--
-- Name: device_tokens_device_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.device_tokens_device_token_id_seq', 1, false);


--
-- Name: guest_checkin_details_checkin_detail_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.guest_checkin_details_checkin_detail_id_seq', 1, false);


--
-- Name: hall_photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.hall_photos_photo_id_seq', 1, false);


--
-- Name: login_logs_login_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.login_logs_login_log_id_seq', 24, true);


--
-- Name: menu_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.menu_categories_category_id_seq', 7, true);


--
-- Name: menu_extras_extra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.menu_extras_extra_id_seq', 6, true);


--
-- Name: menu_items_menu_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.menu_items_menu_item_id_seq', 11, true);


--
-- Name: notification_templates_template_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.notification_templates_template_id_seq', 1, false);


--
-- Name: notifications_notification_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.notifications_notification_id_seq', 1, false);


--
-- Name: order_item_extras_order_item_extra_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.order_item_extras_order_item_extra_id_seq', 1, false);


--
-- Name: order_items_order_item_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.order_items_order_item_id_seq', 3, true);


--
-- Name: order_status_history_status_hist_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.order_status_history_status_hist_id_seq', 1, false);


--
-- Name: password_reset_tokens_token_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.password_reset_tokens_token_id_seq', 20, true);


--
-- Name: payment_refunds_refund_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.payment_refunds_refund_id_seq', 1, false);


--
-- Name: payments_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.payments_payment_id_seq', 3, true);


--
-- Name: permission_groups_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.permission_groups_group_id_seq', 8, true);


--
-- Name: permissions_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.permissions_permission_id_seq', 23, true);


--
-- Name: restaurant_orders_order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.restaurant_orders_order_id_seq', 5, true);


--
-- Name: role_permissions_role_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.role_permissions_role_permission_id_seq', 76, true);


--
-- Name: roles_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.roles_role_id_seq', 10, true);


--
-- Name: room_categories_room_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.room_categories_room_category_id_seq', 1, true);


--
-- Name: room_photos_photo_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.room_photos_photo_id_seq', 1, false);


--
-- Name: rooms_room_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.rooms_room_id_seq', 1, true);


--
-- Name: user_roles_user_role_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.user_roles_user_role_id_seq', 9, true);


--
-- Name: user_sessions_session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.user_sessions_session_id_seq', 40, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: seyeya_user
--

SELECT pg_catalog.setval('public.users_user_id_seq', 38, true);


--
-- Name: accommodation_reservations accommodation_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations
    ADD CONSTRAINT accommodation_reservations_pkey PRIMARY KEY (reservation_id);


--
-- Name: accommodation_reservations accommodation_reservations_reservation_code_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations
    ADD CONSTRAINT accommodation_reservations_reservation_code_key UNIQUE (reservation_code);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (activity_id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (audit_id);


--
-- Name: conference_halls conference_halls_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_halls
    ADD CONSTRAINT conference_halls_pkey PRIMARY KEY (hall_id);


--
-- Name: conference_meal_bookings conference_meal_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_meal_bookings
    ADD CONSTRAINT conference_meal_bookings_pkey PRIMARY KEY (meal_booking_id);


--
-- Name: conference_meal_packages conference_meal_packages_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_meal_packages
    ADD CONSTRAINT conference_meal_packages_pkey PRIMARY KEY (package_id);


--
-- Name: conference_reservations conference_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_reservations
    ADD CONSTRAINT conference_reservations_pkey PRIMARY KEY (conference_res_id);


--
-- Name: conference_reservations conference_reservations_reservation_code_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_reservations
    ADD CONSTRAINT conference_reservations_reservation_code_key UNIQUE (reservation_code);


--
-- Name: conference_resource_bookings conference_resource_bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_resource_bookings
    ADD CONSTRAINT conference_resource_bookings_pkey PRIMARY KEY (resource_booking_id);


--
-- Name: conference_resources conference_resources_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_resources
    ADD CONSTRAINT conference_resources_pkey PRIMARY KEY (resource_id);


--
-- Name: customer_reviews customer_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customer_reviews
    ADD CONSTRAINT customer_reviews_pkey PRIMARY KEY (review_id);


--
-- Name: customers customers_customer_code_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (customer_id);


--
-- Name: device_tokens device_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_pkey PRIMARY KEY (device_token_id);


--
-- Name: guest_checkin_details guest_checkin_details_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.guest_checkin_details
    ADD CONSTRAINT guest_checkin_details_pkey PRIMARY KEY (checkin_detail_id);


--
-- Name: hall_photos hall_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.hall_photos
    ADD CONSTRAINT hall_photos_pkey PRIMARY KEY (photo_id);


--
-- Name: login_logs login_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_pkey PRIMARY KEY (login_log_id);


--
-- Name: menu_categories menu_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_categories
    ADD CONSTRAINT menu_categories_pkey PRIMARY KEY (category_id);


--
-- Name: menu_extras menu_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_extras
    ADD CONSTRAINT menu_extras_pkey PRIMARY KEY (extra_id);


--
-- Name: menu_items menu_items_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_pkey PRIMARY KEY (menu_item_id);


--
-- Name: notification_templates notification_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (template_id);


--
-- Name: notification_templates notification_templates_template_name_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_template_name_key UNIQUE (template_name);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (notification_id);


--
-- Name: order_item_extras order_item_extras_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_item_extras
    ADD CONSTRAINT order_item_extras_pkey PRIMARY KEY (order_item_extra_id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (order_item_id);


--
-- Name: order_status_history order_status_history_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_pkey PRIMARY KEY (status_hist_id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (token_id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: payment_refunds payment_refunds_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payment_refunds
    ADD CONSTRAINT payment_refunds_pkey PRIMARY KEY (refund_id);


--
-- Name: payments payments_payment_reference_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_payment_reference_key UNIQUE (payment_reference);


--
-- Name: payments payments_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (payment_id);


--
-- Name: permission_groups permission_groups_group_name_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT permission_groups_group_name_key UNIQUE (group_name);


--
-- Name: permission_groups permission_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permission_groups
    ADD CONSTRAINT permission_groups_pkey PRIMARY KEY (group_id);


--
-- Name: permissions permissions_permission_key_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_permission_key_key UNIQUE (permission_key);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (permission_id);


--
-- Name: restaurant_orders restaurant_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.restaurant_orders
    ADD CONSTRAINT restaurant_orders_order_number_key UNIQUE (order_number);


--
-- Name: restaurant_orders restaurant_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.restaurant_orders
    ADD CONSTRAINT restaurant_orders_pkey PRIMARY KEY (order_id);


--
-- Name: restaurant_orders restaurant_orders_tracking_number_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.restaurant_orders
    ADD CONSTRAINT restaurant_orders_tracking_number_key UNIQUE (tracking_number);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);


--
-- Name: roles roles_role_name_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_role_name_key UNIQUE (role_name);


--
-- Name: room_categories room_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.room_categories
    ADD CONSTRAINT room_categories_pkey PRIMARY KEY (room_category_id);


--
-- Name: room_photos room_photos_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.room_photos
    ADD CONSTRAINT room_photos_pkey PRIMARY KEY (photo_id);


--
-- Name: rooms rooms_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_pkey PRIMARY KEY (room_id);


--
-- Name: rooms rooms_room_number_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_number_key UNIQUE (room_number);


--
-- Name: role_permissions uq_role_permission; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT uq_role_permission UNIQUE (role_id, permission_id);


--
-- Name: device_tokens uq_user_device_token; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT uq_user_device_token UNIQUE (user_id, token);


--
-- Name: user_roles uq_user_role; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT uq_user_role UNIQUE (user_id, role_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_role_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (session_id);


--
-- Name: user_sessions user_sessions_refresh_token_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_key UNIQUE (refresh_token);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: ix_accommodation_reservations_check_in_date; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_accommodation_reservations_check_in_date ON public.accommodation_reservations USING btree (check_in_date);


--
-- Name: ix_accommodation_reservations_check_out_date; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_accommodation_reservations_check_out_date ON public.accommodation_reservations USING btree (check_out_date);


--
-- Name: ix_accommodation_reservations_customer_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_accommodation_reservations_customer_id ON public.accommodation_reservations USING btree (customer_id);


--
-- Name: ix_accommodation_reservations_room_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_accommodation_reservations_room_id ON public.accommodation_reservations USING btree (room_id);


--
-- Name: ix_accommodation_reservations_status; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_accommodation_reservations_status ON public.accommodation_reservations USING btree (reservation_status);


--
-- Name: ix_audit_logs_changed_at; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_audit_logs_changed_at ON public.audit_logs USING btree (changed_at);


--
-- Name: ix_audit_logs_table_name; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_audit_logs_table_name ON public.audit_logs USING btree (table_name, record_id);


--
-- Name: ix_conference_reservations_customer_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_conference_reservations_customer_id ON public.conference_reservations USING btree (customer_id);


--
-- Name: ix_conference_reservations_event_date; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_conference_reservations_event_date ON public.conference_reservations USING btree (event_date);


--
-- Name: ix_conference_reservations_hall_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_conference_reservations_hall_id ON public.conference_reservations USING btree (hall_id);


--
-- Name: ix_customers_email; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_customers_email ON public.customers USING btree (email);


--
-- Name: ix_customers_nin; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_customers_nin ON public.customers USING btree (nin);


--
-- Name: ix_customers_passport_number; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_customers_passport_number ON public.customers USING btree (passport_number);


--
-- Name: ix_customers_phone_number; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_customers_phone_number ON public.customers USING btree (phone_number);


--
-- Name: ix_login_logs_attempted_at; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_login_logs_attempted_at ON public.login_logs USING btree (attempted_at);


--
-- Name: ix_login_logs_user_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_login_logs_user_id ON public.login_logs USING btree (user_id);


--
-- Name: ix_payments_customer_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_payments_customer_id ON public.payments USING btree (customer_id);


--
-- Name: ix_payments_payment_date; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_payments_payment_date ON public.payments USING btree (payment_date);


--
-- Name: ix_payments_payment_status; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_payments_payment_status ON public.payments USING btree (payment_status);


--
-- Name: ix_payments_reference_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_payments_reference_id ON public.payments USING btree (reference_id);


--
-- Name: ix_restaurant_orders_created_at; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_restaurant_orders_created_at ON public.restaurant_orders USING btree (created_at);


--
-- Name: ix_restaurant_orders_customer_id; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_restaurant_orders_customer_id ON public.restaurant_orders USING btree (customer_id);


--
-- Name: ix_restaurant_orders_order_status; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_restaurant_orders_order_status ON public.restaurant_orders USING btree (order_status);


--
-- Name: ix_users_email; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_users_email ON public.users USING btree (email);


--
-- Name: ix_users_phone_number; Type: INDEX; Schema: public; Owner: seyeya_user
--

CREATE INDEX ix_users_phone_number ON public.users USING btree (phone_number);


--
-- Name: accommodation_reservations accommodation_reservations_checked_in_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations
    ADD CONSTRAINT accommodation_reservations_checked_in_by_fkey FOREIGN KEY (checked_in_by) REFERENCES public.users(user_id);


--
-- Name: accommodation_reservations accommodation_reservations_checked_out_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations
    ADD CONSTRAINT accommodation_reservations_checked_out_by_fkey FOREIGN KEY (checked_out_by) REFERENCES public.users(user_id);


--
-- Name: accommodation_reservations accommodation_reservations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations
    ADD CONSTRAINT accommodation_reservations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: accommodation_reservations accommodation_reservations_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.accommodation_reservations
    ADD CONSTRAINT accommodation_reservations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id);


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: audit_logs audit_logs_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(user_id);


--
-- Name: conference_meal_bookings conference_meal_bookings_conference_res_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_meal_bookings
    ADD CONSTRAINT conference_meal_bookings_conference_res_id_fkey FOREIGN KEY (conference_res_id) REFERENCES public.conference_reservations(conference_res_id) ON DELETE CASCADE;


--
-- Name: conference_meal_bookings conference_meal_bookings_package_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_meal_bookings
    ADD CONSTRAINT conference_meal_bookings_package_id_fkey FOREIGN KEY (package_id) REFERENCES public.conference_meal_packages(package_id);


--
-- Name: conference_reservations conference_reservations_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_reservations
    ADD CONSTRAINT conference_reservations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: conference_reservations conference_reservations_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_reservations
    ADD CONSTRAINT conference_reservations_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.conference_halls(hall_id);


--
-- Name: conference_resource_bookings conference_resource_bookings_conference_res_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_resource_bookings
    ADD CONSTRAINT conference_resource_bookings_conference_res_id_fkey FOREIGN KEY (conference_res_id) REFERENCES public.conference_reservations(conference_res_id) ON DELETE CASCADE;


--
-- Name: conference_resource_bookings conference_resource_bookings_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.conference_resource_bookings
    ADD CONSTRAINT conference_resource_bookings_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.conference_resources(resource_id);


--
-- Name: customer_reviews customer_reviews_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customer_reviews
    ADD CONSTRAINT customer_reviews_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: customer_reviews customer_reviews_replied_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customer_reviews
    ADD CONSTRAINT customer_reviews_replied_by_fkey FOREIGN KEY (replied_by) REFERENCES public.users(user_id);


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: device_tokens device_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.device_tokens
    ADD CONSTRAINT device_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: guest_checkin_details guest_checkin_details_reservation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.guest_checkin_details
    ADD CONSTRAINT guest_checkin_details_reservation_id_fkey FOREIGN KEY (reservation_id) REFERENCES public.accommodation_reservations(reservation_id);


--
-- Name: hall_photos hall_photos_hall_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.hall_photos
    ADD CONSTRAINT hall_photos_hall_id_fkey FOREIGN KEY (hall_id) REFERENCES public.conference_halls(hall_id) ON DELETE CASCADE;


--
-- Name: login_logs login_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.login_logs
    ADD CONSTRAINT login_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: menu_extras menu_extras_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_extras
    ADD CONSTRAINT menu_extras_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id);


--
-- Name: menu_items menu_items_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.menu_items
    ADD CONSTRAINT menu_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.menu_categories(category_id);


--
-- Name: notifications notifications_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: notifications notifications_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.notification_templates(template_id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: order_item_extras order_item_extras_extra_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_item_extras
    ADD CONSTRAINT order_item_extras_extra_id_fkey FOREIGN KEY (extra_id) REFERENCES public.menu_extras(extra_id);


--
-- Name: order_item_extras order_item_extras_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_item_extras
    ADD CONSTRAINT order_item_extras_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(order_item_id) ON DELETE CASCADE;


--
-- Name: order_items order_items_menu_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_menu_item_id_fkey FOREIGN KEY (menu_item_id) REFERENCES public.menu_items(menu_item_id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(order_id) ON DELETE CASCADE;


--
-- Name: order_status_history order_status_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(user_id);


--
-- Name: order_status_history order_status_history_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.order_status_history
    ADD CONSTRAINT order_status_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.restaurant_orders(order_id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- Name: payment_refunds payment_refunds_payment_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payment_refunds
    ADD CONSTRAINT payment_refunds_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(payment_id);


--
-- Name: payment_refunds payment_refunds_processed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payment_refunds
    ADD CONSTRAINT payment_refunds_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES public.users(user_id);


--
-- Name: payments payments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: payments payments_verified_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(user_id);


--
-- Name: permissions permissions_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.permission_groups(group_id) ON DELETE CASCADE;


--
-- Name: restaurant_orders restaurant_orders_assigned_waiter_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.restaurant_orders
    ADD CONSTRAINT restaurant_orders_assigned_waiter_fkey FOREIGN KEY (assigned_waiter) REFERENCES public.users(user_id);


--
-- Name: restaurant_orders restaurant_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.restaurant_orders
    ADD CONSTRAINT restaurant_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(customer_id);


--
-- Name: role_permissions role_permissions_granted_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(user_id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(permission_id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: roles roles_parent_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_parent_role_id_fkey FOREIGN KEY (parent_role_id) REFERENCES public.roles(role_id);


--
-- Name: room_photos room_photos_room_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.room_photos
    ADD CONSTRAINT room_photos_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(room_id) ON DELETE CASCADE;


--
-- Name: rooms rooms_room_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.rooms
    ADD CONSTRAINT rooms_room_category_id_fkey FOREIGN KEY (room_category_id) REFERENCES public.room_categories(room_category_id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(role_id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: seyeya_user
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);


--
-- PostgreSQL database dump complete
--

\unrestrict 8qSWHfMhGDDyRcZEJTujCcbmKauMaNgWxnvFonLUS36a7ubTJddXMwbBlZao3oB

