-- Seed Reliable RSS Sources
INSERT INTO sources (
        id,
        name,
        type,
        url,
        sector_id,
        country_code,
        is_active,
        last_fetched_at
    )
VALUES (
        's-01',
        'African Business',
        'rss',
        'https://african.business/feed/',
        NULL,
        NULL,
        1,
        NULL
    ),
    (
        's-02',
        'The Africa Report',
        'rss',
        'https://www.theafricareport.com/feed/',
        NULL,
        NULL,
        1,
        NULL
    ),
    (
        's-03',
        'AllAfrica Headlines',
        'rss',
        'https://allafrica.com/tools/headlines/rdf/latest/headlines.rdf',
        NULL,
        NULL,
        1,
        NULL
    ),
    (
        's-04',
        'Reuters Africa',
        'rss',
        'https://www.reuters.com/world/africa/rss',
        NULL,
        NULL,
        1,
        NULL
    ),
    (
        's-05',
        'BBC Africa',
        'rss',
        'https://feeds.bbci.co.uk/news/world/africa/rss.xml',
        NULL,
        NULL,
        1,
        NULL
    ),
    (
        's-06',
        'Ventures Africa',
        'rss',
        'https://venturesafrica.com/feed/',
        'finance',
        NULL,
        1,
        NULL
    ),
    (
        's-07',
        'How We Made It In Africa',
        'rss',
        'https://www.howwemadeitinafrica.com/feed/',
        'finance',
        NULL,
        1,
        NULL
    ),
    (
        's-08',
        'Africa Business Insider',
        'rss',
        'https://africa.businessinsider.com/feed',
        'finance',
        NULL,
        1,
        NULL
    ),
    (
        's-09',
        'TechCabal',
        'rss',
        'https://techcabal.com/feed/',
        'technology',
        NULL,
        1,
        NULL
    ),
    (
        's-10',
        'Disrupt Africa',
        'rss',
        'https://disrupt-africa.com/feed/',
        'technology',
        NULL,
        1,
        NULL
    ),
    (
        's-11',
        'TechPoint Africa',
        'rss',
        'https://techpoint.africa/feed/',
        'technology',
        'NG',
        1,
        NULL
    ),
    (
        's-12',
        'ESI Africa (Energy)',
        'rss',
        'https://www.esi-africa.com/feed/',
        'energy',
        NULL,
        1,
        NULL
    ),
    (
        's-13',
        'Mining Review Africa',
        'rss',
        'https://www.miningreview.com/feed/',
        'energy',
        NULL,
        1,
        NULL
    ),
    (
        's-14',
        'African Farming',
        'rss',
        'https://www.africanfarming.net/feed/',
        'agriculture',
        NULL,
        1,
        NULL
    ),
    (
        's-15',
        'Tourism Update',
        'rss',
        'https://www.tourismupdate.co.za/feed/',
        'tourism',
        'ZA',
        1,
        NULL
    ),
    (
        's-16',
        'BusinessDay Nigeria',
        'rss',
        'https://businessday.ng/feed/',
        NULL,
        'NG',
        1,
        NULL
    ),
    (
        's-17',
        'Business Daily Kenya',
        'rss',
        'https://www.businessdailyafrica.com/rss',
        NULL,
        'KE',
        1,
        NULL
    ),
    (
        's-18',
        'Fin24 South Africa',
        'rss',
        'https://www.news24.com/fin24/rss',
        'finance',
        'ZA',
        1,
        NULL
    ),
    (
        's-19',
        'Egypt Independent',
        'rss',
        'https://www.egyptindependent.com/feed/',
        NULL,
        'EG',
        1,
        NULL
    ),
    (
        's-20',
        'Ghana Business News',
        'rss',
        'https://www.ghanabusinessnews.com/feed/',
        NULL,
        'GH',
        1,
        NULL
    ),
    (
        's-21',
        'The New Times Rwanda',
        'rss',
        'https://www.newtimes.co.rw/rss',
        NULL,
        'RW',
        1,
        NULL
    ),
    (
        's-22',
        'Morocco World News',
        'rss',
        'https://www.moroccoworldnews.com/feed/',
        NULL,
        'MA',
        1,
        NULL
    );