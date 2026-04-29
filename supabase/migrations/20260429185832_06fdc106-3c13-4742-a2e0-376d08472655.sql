UPDATE site_settings
SET setting_value = jsonb_set(
  jsonb_set(
    setting_value,
    '{offices,0,mapsEmbed}',
    '"https://maps.google.com/maps?q=House+37+Block+C+Road+6+Banani+Dhaka+1213&t=&z=16&ie=UTF8&iwloc=&output=embed"'::jsonb
  ),
  '{offices,1,mapsEmbed}',
  '"https://maps.google.com/maps?q=Al-Baraka+Super+Market+Savar+Bazar+Bus+Stand+Savar+Dhaka+1340&t=&z=16&ie=UTF8&iwloc=&output=embed"'::jsonb
),
updated_at = now()
WHERE setting_key = 'contact_section';