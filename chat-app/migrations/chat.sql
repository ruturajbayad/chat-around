CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  tags text[] DEFAULT '{}'::text[],
  key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  active_user_count integer DEFAULT 0,
  last_active_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT groups_pkey PRIMARY KEY (id)
);

CREATE TABLE public.site_visits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visited_at timestamp with time zone DEFAULT now(),
  page text DEFAULT '/'::text,
  visitor_id uuid,
  CONSTRAINT site_visits_pkey PRIMARY KEY (id)
);