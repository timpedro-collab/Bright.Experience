-- Update Informa's In-Booth Machine to the approved USD 45k–60k rate-card band.

update public.partner_pricing_pages
set config = jsonb_set(
  config,
  '{levers}',
  (
    select jsonb_agg(
      case
        when lever->>'key' = 'booth'
          then jsonb_set(
            lever,
            '{retail}',
            '{"min": 45000, "max": 60000, "suggested": 50000, "step": 1000}'::jsonb
          )
        else lever
      end
      order by ordinal
    )
    from jsonb_array_elements(config->'levers') with ordinality as item(lever, ordinal)
  )
)
where slug = 'informa-portfolio-e1820d252a4f';

-- Rollback: restore the booth retail object to min 25000, max 40000,
-- suggested 30000 and step 1000.
