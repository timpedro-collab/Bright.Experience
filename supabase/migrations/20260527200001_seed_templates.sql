-- Seed three starter event templates with realistic milestones, tasks,
-- asset slots, and QA items. Idempotent — uses ON CONFLICT DO NOTHING.

INSERT INTO event_templates (
  id, name, description, event_type, package_type,
  milestones_json, tasks_json, assets_json, qa_items_json,
  is_active
) VALUES

-- ── Standard Activation ────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000101',
  'Standard Activation',
  'Turnkey single-day activation with one machine and standard game.',
  'activation',
  'standard',
  '[
    {"name":"Event Confirmed","stage":"confirmed","status":"pending","sort_order":0,"customer_visible":true},
    {"name":"Briefing Complete","stage":"kickoff_complete","status":"pending","sort_order":1,"customer_visible":true},
    {"name":"Assets Approved","stage":"creative_assets","status":"pending","sort_order":2,"customer_visible":true},
    {"name":"Logistics Confirmed","stage":"logistics_confirmed","status":"pending","sort_order":3,"customer_visible":true},
    {"name":"Go Live","stage":"event_live","status":"pending","sort_order":4,"customer_visible":true},
    {"name":"Report Published","stage":"reporting","status":"pending","sort_order":5,"customer_visible":true}
  ]'::jsonb,
  '[
    {"title":"Complete event briefing","task_type":"customer_action","category":"admin","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":0,"assigned_role":"events_lead","target_path":"briefing"},
    {"title":"Upload brand guidelines","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":1,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Upload hero image","task_type":"customer_action","category":"creative","status":"pending","priority":"medium","is_blocking":false,"customer_visible":true,"sort_order":2,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Approve game mechanics","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":3,"assigned_role":"events_lead","target_path":"approvals"},
    {"title":"Confirm delivery logistics","task_type":"internal_action","category":"logistics","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":4,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Run QA checklist","task_type":"internal_action","category":"qa","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":5,"assigned_role":"qa_lead","target_path":"qa"},
    {"title":"Generate post-event report","task_type":"internal_action","category":"reporting","status":"pending","priority":"medium","is_blocking":false,"customer_visible":false,"sort_order":6,"assigned_role":"events_lead","target_path":"reports"}
  ]'::jsonb,
  '[
    {"name":"Brand guidelines","asset_type":"document","required_format":"PDF","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Hero image","asset_type":"image","required_format":"PNG/JPG","required_dimensions":"1920x1080","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Game screen design","asset_type":"image","required_format":"PNG","required_dimensions":"1080x1920","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0}
  ]'::jsonb,
  '[
    {"category":"machine","title":"Machine powers on and boots correctly","status":"pending","sort_order":0},
    {"category":"game_logic","title":"Game loads with correct branding","status":"pending","sort_order":1},
    {"category":"game_logic","title":"Prize mechanic triggers at configured rate","status":"pending","sort_order":2},
    {"category":"ux_ui","title":"Attract screen displays correct creative","status":"pending","sort_order":3},
    {"category":"webform","title":"Lead capture form submits successfully","status":"pending","sort_order":4},
    {"category":"webform","title":"GDPR consent checkbox present and functional","status":"pending","sort_order":5}
  ]'::jsonb,
  true
),

-- ── Premium Activation ─────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000102',
  'Premium Activation',
  'Multi-day premium activation with custom game build and on-site support.',
  'activation',
  'premium',
  '[
    {"name":"Event Confirmed","stage":"confirmed","status":"pending","sort_order":0,"customer_visible":true},
    {"name":"Briefing Complete","stage":"kickoff_complete","status":"pending","sort_order":1,"customer_visible":true},
    {"name":"Assets Approved","stage":"creative_assets","status":"pending","sort_order":2,"customer_visible":true},
    {"name":"Build Signed Off","stage":"approvals","status":"pending","sort_order":3,"customer_visible":true},
    {"name":"Logistics Confirmed","stage":"logistics_confirmed","status":"pending","sort_order":4,"customer_visible":true},
    {"name":"Go Live","stage":"event_live","status":"pending","sort_order":5,"customer_visible":true},
    {"name":"Report Published","stage":"reporting","status":"pending","sort_order":6,"customer_visible":true}
  ]'::jsonb,
  '[
    {"title":"Complete event briefing","task_type":"customer_action","category":"admin","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":0,"assigned_role":"events_lead","target_path":"briefing"},
    {"title":"Upload brand guidelines","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":1,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Upload hero image","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":2,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Upload game screen designs","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":3,"assigned_role":"creative_lead","target_path":"studio"},
    {"title":"Upload video assets","task_type":"customer_action","category":"creative","status":"pending","priority":"medium","is_blocking":false,"customer_visible":true,"sort_order":4,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Approve game mechanics","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":5,"assigned_role":"events_lead","target_path":"approvals"},
    {"title":"Review and approve build proof","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":6,"assigned_role":"events_lead","target_path":"approvals"},
    {"title":"Confirm delivery logistics","task_type":"internal_action","category":"logistics","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":7,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Arrange on-site technician","task_type":"internal_action","category":"operations","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":8,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Run QA checklist","task_type":"internal_action","category":"qa","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":9,"assigned_role":"qa_lead","target_path":"qa"},
    {"title":"Generate post-event report","task_type":"internal_action","category":"reporting","status":"pending","priority":"medium","is_blocking":false,"customer_visible":false,"sort_order":10,"assigned_role":"events_lead","target_path":"reports"}
  ]'::jsonb,
  '[
    {"name":"Brand guidelines","asset_type":"document","required_format":"PDF","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Hero image","asset_type":"image","required_format":"PNG/JPG","required_dimensions":"1920x1080","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Game screen designs","asset_type":"image","required_format":"PSD/AI","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Video loop (attract screen)","asset_type":"video","required_format":"MP4","required_dimensions":"1080x1920","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Prize creative","asset_type":"image","required_format":"PNG","required_dimensions":"800x600","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0}
  ]'::jsonb,
  '[
    {"category":"machine","title":"Machine powers on and boots correctly","status":"pending","sort_order":0},
    {"category":"machine","title":"Touchscreen calibration verified","status":"pending","sort_order":1},
    {"category":"game_logic","title":"Game loads with correct branding","status":"pending","sort_order":2},
    {"category":"game_logic","title":"All game levels / stages playable","status":"pending","sort_order":3},
    {"category":"game_logic","title":"Prize mechanic triggers at configured rate","status":"pending","sort_order":4},
    {"category":"ux_ui","title":"Attract screen displays correct creative","status":"pending","sort_order":5},
    {"category":"ux_ui","title":"End screen shows share / CTA correctly","status":"pending","sort_order":6},
    {"category":"webform","title":"Lead capture form submits successfully","status":"pending","sort_order":7},
    {"category":"webform","title":"GDPR consent checkbox present and functional","status":"pending","sort_order":8},
    {"category":"wrap","title":"Machine wrap matches approved artwork","status":"pending","sort_order":9}
  ]'::jsonb,
  true
),

-- ── Sampling Campaign ──────────────────────────────────────
(
  '00000000-0000-0000-0000-000000000103',
  'Sampling Campaign',
  'Product sampling via vending machine with branded game and lead capture.',
  'sampling',
  'standard',
  '[
    {"name":"Event Confirmed","stage":"confirmed","status":"pending","sort_order":0,"customer_visible":true},
    {"name":"Briefing Complete","stage":"kickoff_complete","status":"pending","sort_order":1,"customer_visible":true},
    {"name":"Assets Approved","stage":"creative_assets","status":"pending","sort_order":2,"customer_visible":true},
    {"name":"Product Loaded","stage":"build_configuration","status":"pending","sort_order":3,"customer_visible":true},
    {"name":"Logistics Confirmed","stage":"logistics_confirmed","status":"pending","sort_order":4,"customer_visible":true},
    {"name":"Go Live","stage":"event_live","status":"pending","sort_order":5,"customer_visible":true},
    {"name":"Report Published","stage":"reporting","status":"pending","sort_order":6,"customer_visible":true}
  ]'::jsonb,
  '[
    {"title":"Complete event briefing","task_type":"customer_action","category":"admin","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":0,"assigned_role":"events_lead","target_path":"briefing"},
    {"title":"Upload brand guidelines","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":1,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Upload hero image","task_type":"customer_action","category":"creative","status":"pending","priority":"medium","is_blocking":false,"customer_visible":true,"sort_order":2,"assigned_role":"creative_lead","target_path":"assets"},
    {"title":"Provide product samples specifications","task_type":"customer_action","category":"operations","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":3,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Ship product samples to warehouse","task_type":"customer_action","category":"logistics","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":4,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Approve game mechanics","task_type":"customer_action","category":"creative","status":"pending","priority":"high","is_blocking":true,"customer_visible":true,"sort_order":5,"assigned_role":"events_lead","target_path":"approvals"},
    {"title":"Load product into machine","task_type":"internal_action","category":"operations","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":6,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Confirm delivery logistics","task_type":"internal_action","category":"logistics","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":7,"assigned_role":"operations_lead","target_path":"logistics"},
    {"title":"Run QA checklist","task_type":"internal_action","category":"qa","status":"pending","priority":"high","is_blocking":true,"customer_visible":false,"sort_order":8,"assigned_role":"qa_lead","target_path":"qa"},
    {"title":"Generate post-event report","task_type":"internal_action","category":"reporting","status":"pending","priority":"medium","is_blocking":false,"customer_visible":false,"sort_order":9,"assigned_role":"events_lead","target_path":"reports"}
  ]'::jsonb,
  '[
    {"name":"Brand guidelines","asset_type":"document","required_format":"PDF","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Hero image","asset_type":"image","required_format":"PNG/JPG","required_dimensions":"1920x1080","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Game screen design","asset_type":"image","required_format":"PNG","required_dimensions":"1080x1920","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0},
    {"name":"Product sample photo","asset_type":"image","required_format":"PNG/JPG","status":"required","customer_visible":true,"version":1,"review_status":"pending_review","revision_count":0}
  ]'::jsonb,
  '[
    {"category":"machine","title":"Machine powers on and boots correctly","status":"pending","sort_order":0},
    {"category":"machine","title":"Vend mechanism dispenses correctly","status":"pending","sort_order":1},
    {"category":"product","title":"Product fits vend slot dimensions","status":"pending","sort_order":2},
    {"category":"product","title":"Product temperature requirements met","status":"pending","sort_order":3},
    {"category":"game_logic","title":"Game loads with correct branding","status":"pending","sort_order":4},
    {"category":"game_logic","title":"Win triggers vend correctly","status":"pending","sort_order":5},
    {"category":"ux_ui","title":"Attract screen displays correct creative","status":"pending","sort_order":6},
    {"category":"webform","title":"Lead capture form submits successfully","status":"pending","sort_order":7},
    {"category":"webform","title":"GDPR consent checkbox present and functional","status":"pending","sort_order":8}
  ]'::jsonb,
  true
)
ON CONFLICT (id) DO NOTHING;
