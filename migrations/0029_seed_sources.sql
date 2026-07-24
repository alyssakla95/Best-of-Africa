-- Seed the sources table with default RSS feeds for African news.
-- Uses ON CONFLICT DO NOTHING so it's safe to re-run.

INSERT INTO sources (id, name, type, url, sector_id, country_code, is_active, fetch_interval_minutes) VALUES
-- General African News
('s-african-business',    'African Business',          'rss', 'https://african.business/feed/',                               NULL,          NULL, 1, 60),
('s-africa-report',       'The Africa Report',         'rss', 'https://www.theafricareport.com/feed/',                         NULL,          NULL, 1, 60),
('s-allafrica',           'AllAfrica',                 'rss', 'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf', NULL,          NULL, 1, 60),
('s-cnbc-africa',         'CNBC Africa',               'rss', 'https://www.cnbcafrica.com/feed/',                              'finance',     NULL, 1, 60),
('s-bbc-africa',          'BBC Africa',                'rss', 'https://feeds.bbci.co.uk/news/world/africa/rss.xml',            NULL,          NULL, 1, 60),
('s-african-arguments',   'African Arguments',         'rss', 'https://africanarguments.org/feed/',                            NULL,          NULL, 1, 60),
('s-africanews',          'Africa News',               'rss', 'https://www.africanews.com/rss',                                NULL,          NULL, 1, 60),
('s-the-continent',       'The Continent',             'rss', 'https://www.thecontinent.org/feed/',                            NULL,          NULL, 1, 60),
('s-conversation-africa', 'The Conversation Africa',   'rss', 'https://theconversation.com/africa/articles.atom',              NULL,          NULL, 1, 60),
('s-quartz-africa',       'Quartz Africa',             'rss', 'https://qz.com/africa/rss',                                    NULL,          NULL, 1, 60),
-- Business & Investment
('s-ventures-africa',     'Ventures Africa',           'rss', 'https://venturesafrica.com/feed/',                              'finance',     NULL, 1, 60),
('s-howwemadeit',         'How We Made It In Africa',  'rss', 'https://www.howwemadeitinafrica.com/feed/',                     'finance',     NULL, 1, 60),
('s-afrik21',             'Afrik21',                   'rss', 'https://www.afrik21.africa/en/feed/',                           'energy',      NULL, 1, 60),
-- Technology & Startups
('s-techcabal',           'TechCabal',                 'rss', 'https://techcabal.com/feed/',                                   'technology',  NULL, 1, 60),
('s-disrupt-africa',      'Disrupt Africa',            'rss', 'https://disrupt-africa.com/feed/',                              'technology',  NULL, 1, 60),
('s-techpoint-africa',    'TechPoint Africa',          'rss', 'https://techpoint.africa/feed/',                                'technology',  'NG', 1, 60),
('s-itnews-africa',       'IT News Africa',            'rss', 'https://www.itnewsafrica.com/feed/',                           'technology',  NULL, 1, 60),
-- Energy & Mining
('s-esi-africa',          'ESI Africa',                'rss', 'https://www.esi-africa.com/feed/',                              'energy',      NULL, 1, 60),
('s-mining-review',       'Mining Review Africa',      'rss', 'https://www.miningreview.com/feed/',                           'energy',      NULL, 1, 60),
-- Agriculture
('s-african-farming',     'African Farming',           'rss', 'https://www.africanfarming.net/feed/',                          'agriculture', NULL, 1, 60),
-- Tourism
('s-tourism-update',      'Tourism Update',            'rss', 'https://www.tourismupdate.co.za/feed/',                        'tourism',     'ZA', 1, 60),
('s-voyagesafriq',        'VoyagesAfriq',              'rss', 'https://voyagesafriq.com/feed/',                               'tourism',     NULL, 1, 60),
-- Country-specific
('s-businessday-ng',      'BusinessDay Nigeria',       'rss', 'https://businessday.ng/feed/',                                 NULL,          'NG', 1, 60),
('s-nairametrics',        'Nairametrics',              'rss', 'https://nairametrics.com/feed/',                                'finance',     'NG', 1, 60),
('s-business-daily-ke',   'Business Daily Africa',     'rss', 'https://www.businessdailyafrica.com/rss',                      NULL,          'KE', 1, 60),
('s-fin24',               'Fin24',                     'rss', 'https://www.news24.com/fin24/rss',                             'finance',     'ZA', 1, 60),
('s-daily-maverick',      'Daily Maverick',            'rss', 'https://www.dailymaverick.co.za/dmrss/',                       NULL,          'ZA', 1, 60),
('s-moneyweb',            'Moneyweb',                  'rss', 'https://www.moneyweb.co.za/feed/',                             'finance',     'ZA', 1, 60),
('s-egypt-independent',   'Egypt Independent',         'rss', 'https://www.egyptindependent.com/feed/',                       NULL,          'EG', 1, 60),
('s-ghana-business',      'Ghana Business News',       'rss', 'https://www.ghanabusinessnews.com/feed/',                     NULL,          'GH', 1, 60),
('s-newtimes-rw',         'The New Times Rwanda',      'rss', 'https://www.newtimes.co.rw/rss',                              NULL,          'RW', 1, 60),
('s-morocco-world',       'Morocco World News',        'rss', 'https://www.moroccoworldnews.com/feed/',                      NULL,          'MA', 1, 60)
ON CONFLICT(id) DO NOTHING;
