-- =====================================================================
-- PRODUCT DETAILS MIGRATION (idempotente)
-- Agrega materials, dimensions y care_instructions a products, y
-- reemplaza el seed de catálogo (ropa urbana) por decoración artesanal.
-- Seguro de ejecutar en una base que ya corrió schema.sql previamente.
-- =====================================================================

alter table public.products add column if not exists materials text;
alter table public.products add column if not exists dimensions text;
alter table public.products add column if not exists care_instructions text;

-- Limpieza del seed anterior (ropa urbana / streetwear)
delete from public.products where slug in (
  'camiseta-rd-flow', 'jogger-streetwear-negro', 'sudadera-capucha-roja',
  'top-corto-perreo', 'leggings-deportivos', 'gorra-snapback-rd'
);
delete from public.categories where slug in ('hombre', 'mujer', 'accesorios');

-- Nuevas categorías
insert into public.categories (name, slug, image_url) values
  ('Macramé',              'macrame',              'https://images.unsplash.com/photo-1633594308237-3dcfa56b4e69?q=80&w=2071'),
  ('Cuadros texturizados', 'cuadros-texturizados', 'https://images.unsplash.com/photo-1608158680747-943c02770c5e?q=80&w=2070'),
  ('Esculturas en yeso',   'esculturas-yeso',      'https://images.unsplash.com/photo-1447758902204-48010b87c24d?q=80&w=2070'),
  ('Decoración de mesa',   'decoracion-mesa',      'https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=2070'),
  ('Piezas de pared',      'piezas-pared',         'https://images.unsplash.com/photo-1632761644913-0da6105863cb?q=80&w=2070')
on conflict (slug) do nothing;

-- Cupón FLOW10 -> HOGAR10
delete from public.coupons where code = 'FLOW10';
insert into public.coupons (code, description, type, discount_value, min_purchase, max_uses, valid_until)
values ('HOGAR10', '10% extra al decorar tu hogar', 'percentage', 10, 0, null, now() + interval '30 days')
on conflict (code) do nothing;

-- Nuevo catálogo de piezas artesanales
with cat as (select id, slug from public.categories where slug in ('macrame','cuadros-texturizados','esculturas-yeso','decoracion-mesa','piezas-pared'))
insert into public.products (category_id, slug, name, description, price, discount_price, stock, images, is_featured, rating, sales_count, materials, dimensions, care_instructions)
select (select id from cat where slug = p.cat_slug), p.slug, p.name, p.description, p.price, p.discount_price, p.stock, p.images, p.is_featured, p.rating, p.sales_count, p.materials, p.dimensions, p.care_instructions
from (values
  ('macrame',              'tapiz-macrame-brisa',
    'Tapiz de macramé "Brisa"',
    'Tapiz tejido a mano con nudos tradicionales de macramé. Una pieza ligera y aireada que aporta calidez y textura natural a cualquier pared.',
    2400, 1900, 14,
    array['https://images.unsplash.com/photo-1619808799783-db68de98fbe0?q=80&w=1200'],
    true, 4.9, 86,
    'Algodón 100% sin teñir, varilla de madera de pino',
    '90 x 60 cm',
    'Sacudir el polvo con brocha seca. Evitar humedad y luz solar directa.'),
  ('cuadros-texturizados', 'cuadro-texturizado-arena',
    'Cuadro texturizado "Arena"',
    'Cuadro con textura tipo estuco aplicada a mano, inspirado en las dunas y la arena del Caribe. Tonos cálidos que se integran a espacios modernos.',
    3200, null, 9,
    array['https://images.unsplash.com/photo-1614516960150-3edb5b923887?q=80&w=1200'],
    true, 4.8, 52,
    'Pasta de estuco sobre lienzo, marco de madera',
    '70 x 100 cm',
    'Limpiar con paño suave y seco. No frotar la textura ni usar productos líquidos.'),
  ('esculturas-yeso',      'escultura-yeso-luna',
    'Escultura en yeso "Luna"',
    'Escultura de mesa tallada y pulida a mano en yeso cerámico. Forma orgánica inspirada en las fases lunares, acabado mate.',
    1800, 1450, 11,
    array['https://images.unsplash.com/photo-1551047163-78c1a36ad573?q=80&w=1200'],
    true, 4.9, 64,
    'Yeso cerámico, base de fibra natural',
    '18 x 24 cm aprox.',
    'Limpiar con paño seco o ligeramente húmedo. No sumergir en agua.'),
  ('decoracion-mesa',      'centro-de-mesa-artesanal',
    'Centro de mesa artesanal',
    'Centro de mesa en fibras naturales trenzadas a mano, ideal para frutero o como pieza decorativa independiente.',
    1450, null, 20,
    array['https://images.unsplash.com/photo-1631125915597-adf46a94e436?q=80&w=1200'],
    false, 4.6, 38,
    'Fibras naturales (bejuco), base de madera',
    '30 cm de diámetro x 8 cm alto',
    'Mantener alejado de la humedad constante. Sacudir con paño seco.'),
  ('decoracion-mesa',      'set-portavelas-yeso',
    'Set de portavelas en yeso',
    'Set de 3 portavelas de yeso moldeados a mano, en distintos tamaños, con acabado artesanal ligeramente texturizado.',
    1200, 950, 16,
    array['https://images.unsplash.com/photo-1631125915671-e632fadad927?q=80&w=1200'],
    true, 4.7, 71,
    'Yeso cerámico',
    'Set de 3: 6, 9 y 12 cm de alto',
    'Limpiar el exceso de cera con un paño seco. Evitar golpes en los bordes.'),
  ('piezas-pared',         'pieza-mural-fibras-naturales',
    'Pieza mural de fibras naturales',
    'Pieza mural tejida con fibras naturales y ramas secas, pensada para dar profundidad y textura a paredes vacías.',
    2750, 2200, 7,
    array['https://images.unsplash.com/photo-1654636437732-897b94921f78?q=80&w=1200'],
    false, 4.8, 29,
    'Fibras naturales, ramas secas, hilo de algodón',
    '80 x 50 cm',
    'Colgar lejos de fuentes de calor directo. Sacudir suavemente para quitar el polvo.')
) as p(cat_slug, slug, name, description, price, discount_price, stock, images, is_featured, rating, sales_count, materials, dimensions, care_instructions)
on conflict (slug) where slug is not null do nothing;
