-- =====================================================================
-- Contact Section Seed — smtradeint.com
-- Mirrors smelitehajj.com layout: 6 info cards (Call, Email, Visit,
-- Hours, Banani Office, Savar Office) + 2 office maps (Banani + Savar)
-- Run against the self-hosted PostgreSQL on port 5440.
--
-- Usage:
--   psql -h 127.0.0.1 -p 5440 -U <user> -d <db> -f database/migrations/2026-05-contact-section-seed.sql
-- =====================================================================

INSERT INTO public.site_settings (setting_key, setting_value, updated_at)
VALUES (
  'contact_section',
  '{
    "eyebrow": "GET IN TOUCH",
    "heading": "Contact Us",
    "heading_arabic": "اتصل بنا",
    "subheading": "Ready to start your sacred journey? Contact us today for personalized assistance with your Hajj or Umrah booking.",
    "form_title": "Send us a Message",
    "office_locations_title": "Our Office Locations",
    "info_cards": [
      {
        "title": "Call Us",
        "icon": "Phone",
        "lines": [
          { "label": "Hotline:", "value": "+8801867666888", "href": "tel:+8801867666888" },
          { "label": "Telephone:", "value": "+8802224446664", "href": "tel:+8802224446664" }
        ]
      },
      {
        "title": "Email Us",
        "icon": "Mail",
        "lines": [
          { "label": "", "value": "info@smtradeint.com", "href": "mailto:info@smtradeint.com" },
          { "label": "", "value": "support@smtradeint.com", "href": "mailto:support@smtradeint.com" }
        ]
      },
      {
        "title": "Visit Us",
        "icon": "MapPin",
        "lines": [
          { "label": "", "value": "B-25/4, Al-Baraka Super Market,", "href": "" },
          { "label": "", "value": "Savar Bazar Bus-Stand,", "href": "" },
          { "label": "", "value": "Savar, Dhaka-1340", "href": "" }
        ]
      },
      {
        "title": "Office Hours",
        "icon": "Clock",
        "lines": [
          { "label": "", "value": "Saturday to Thursday 7:00 AM to 5:00 PM", "href": "" },
          { "label": "", "value": "Friday: Holiday", "href": "" }
        ]
      },
      {
        "title": "Banani Office",
        "icon": "Building2",
        "lines": [
          { "label": "", "value": "House # 37, Block # C, Road # 6, Banani, Dhaka-1213.", "href": "" },
          { "label": "", "value": "+88 01867666888", "href": "tel:+8801867666888" },
          { "label": "", "value": "+88 01619959625", "href": "tel:+8801619959625" },
          { "label": "", "value": "info@smtradeint.com", "href": "mailto:info@smtradeint.com" }
        ]
      },
      {
        "title": "Savar Office",
        "icon": "Building2",
        "lines": [
          { "label": "", "value": "B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340.", "href": "" },
          { "label": "", "value": "+88 02224446664", "href": "tel:+8802224446664" },
          { "label": "", "value": "+88 01619959626", "href": "tel:+8801619959626" },
          { "label": "", "value": "support@smtradeint.com", "href": "mailto:support@smtradeint.com" }
        ]
      }
    ],
    "offices": [
      {
        "title": "Banani Office",
        "address": "House # 37, Block # C, Road # 6, Banani, Dhaka-1213",
        "phones": ["+88 01867666888", "+88 01619959625"],
        "email": "info@smtradeint.com",
        "mapsEmbed": "https://www.google.com/maps?q=Banani+Block+C+Road+6+Dhaka+1213&output=embed",
        "mapsLink": "https://www.google.com/maps/search/?api=1&query=Banani+Block+C+Road+6+Dhaka+1213"
      },
      {
        "title": "Savar Office",
        "address": "B-25/4, Al-Baraka Super Market, Savar Bazar Bus-Stand, Savar, Dhaka-1340",
        "phones": ["+88 02224446664", "+88 01619959626"],
        "email": "support@smtradeint.com",
        "mapsEmbed": "https://www.google.com/maps?q=Savar+Bazar+Bus+Stand+Dhaka+1340&output=embed",
        "mapsLink": "https://www.google.com/maps/search/?api=1&query=Savar+Bazar+Bus+Stand+Dhaka+1340"
      }
    ]
  }'::jsonb,
  now()
)
ON CONFLICT (setting_key) DO UPDATE
  SET setting_value = EXCLUDED.setting_value,
      updated_at = now();
