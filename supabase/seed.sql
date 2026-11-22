do $$
begin
  if not exists (
    select 1 from public.profiles
    where role = 'admin' and is_active
  ) then
    raise exception 'Activate an administrator before running the optional service seed.';
  end if;
end;
$$;

insert into public.catalog_items (
  slug, name, category, description, is_physical, created_by
)
select seed.slug, seed.name, seed.category, seed.description, seed.is_physical, profile.id
from (values
  ('brand-identity', 'Logo & brand identity', 'Branding', 'Logo design and practical brand identity assets.', false),
  ('social-media-graphics', 'Social media graphics', 'Digital design', 'Campaign and recurring social media creative.', false),
  ('certificates-lanyards', 'Certificates & lanyards', 'Print layout', 'Print-ready certificate and lanyard artwork.', true),
  ('jersey-apparel-layout', 'Jersey & apparel layout', 'Apparel', 'Sportswear graphics and production-ready layouts.', true),
  ('print-ready-vector', 'Print-ready vector layout', 'Production design', 'Vector artwork prepared for external print production.', true),
  ('event-collateral', 'Event collateral', 'Print layout', 'Posters, banners, programs, and event materials.', true)
) as seed(slug, name, category, description, is_physical)
cross join lateral (
  select id from public.profiles
  where role = 'admin' and is_active
  order by created_at
  limit 1
) as profile
on conflict (slug) do nothing;
