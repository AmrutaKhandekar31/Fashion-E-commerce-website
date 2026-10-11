CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  price numeric(10,2) NOT NULL,
  description text NOT NULL DEFAULT '',
  image text NOT NULL,
  colors text[] NOT NULL DEFAULT '{}',
  sizes text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  is_new boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products are public" ON public.products FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  height_cm int,
  weight_kg int,
  fit_preference text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.wishlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, DELETE ON public.wishlist_items TO authenticated;
GRANT ALL ON public.wishlist_items TO service_role;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own wishlist" ON public.wishlist_items FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.saved_outfits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  product_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.saved_outfits TO authenticated;
GRANT ALL ON public.saved_outfits TO service_role;
ALTER TABLE public.saved_outfits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own outfits" ON public.saved_outfits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'placed',
  shipping jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own orders select" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own orders insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name text NOT NULL,
  price numeric(10,2) NOT NULL,
  size text,
  quantity int NOT NULL DEFAULT 1
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own order items select" ON public.order_items FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));
CREATE POLICY "Own order items insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

INSERT INTO public.products (slug,name,category,price,description,image,colors,sizes,tags,is_new) VALUES
('linen-overshirt','Dune Linen Overshirt','tops',89,'Breathable washed linen with a relaxed boxy cut and horn buttons.','/images/products/linen-overshirt.jpg','{Sand,Ecru}','{XS,S,M,L,XL}','{relaxed,summer,layering}',true),
('terracotta-knit','Terracotta Rib Knit','tops',74,'Chunky ribbed knit in a warm terracotta tone, soft merino blend.','/images/products/terracotta-knit.jpg','{Terracotta}','{XS,S,M,L,XL}','{cozy,autumn}',false),
('graphic-tee','Sunset Graphic Tee','tops',38,'Heavyweight cotton tee with a faded sunset print.','/images/products/graphic-tee.jpg','{Bone,Clay}','{XS,S,M,L,XL}','{street,casual}',true),
('cargo-trousers','Canyon Wide Cargo','bottoms',96,'Wide-leg cargo trousers in garment-dyed twill with utility pockets.','/images/products/cargo-trousers.jpg','{Olive,Khaki}','{26,28,30,32,34}','{street,utility}',false),
('pleated-skirt','Mesa Pleated Midi','bottoms',82,'Fluid satin midi skirt with knife pleats that move with you.','/images/products/pleated-skirt.jpg','{Rose,Sand}','{XS,S,M,L}','{elegant,evening}',true),
('chelsea-boots','Clay Suede Chelsea','shoes',148,'Hand-finished suede chelsea boots with a chunky sole.','/images/products/chelsea-boots.jpg','{Tan}','{37,38,39,40,41,42,43,44}','{boots,autumn}',false),
('canvas-hightops','Sandstorm High-Tops','shoes',72,'Vintage-washed canvas high-tops with a cream rubber sole.','/images/products/canvas-hightops.jpg','{Cream}','{37,38,39,40,41,42,43,44}','{street,casual}',false),
('oversized-trench','Desert Oversized Trench','outerwear',189,'Water-resistant cotton trench with a dramatic oversized drape.','/images/products/oversized-trench.jpg','{Camel}','{XS,S,M,L,XL}','{classic,layering}',true),
('bomber-jacket','Rust Satin Bomber','outerwear',128,'Lustrous satin bomber in rust with ribbed trims.','/images/products/bomber-jacket.jpg','{Rust}','{XS,S,M,L,XL}','{street,evening}',false),
('slip-dress','Dusk Slip Dress','dresses',112,'Bias-cut silky slip dress in dusty rose with adjustable straps.','/images/products/slip-dress.jpg','{Dusty Rose}','{XS,S,M,L}','{evening,elegant}',true),
('leather-tote','Adobe Leather Tote','accessories',134,'Structured vegetable-tanned leather tote that ages beautifully.','/images/products/leather-tote.jpg','{Cognac}','{One Size}','{classic,everyday}',false),
('bucket-hat','Sahara Bucket Hat','accessories',34,'Washed cotton canvas bucket hat for sunny days.','/images/products/bucket-hat.jpg','{Sand}','{One Size}','{street,summer}',false);