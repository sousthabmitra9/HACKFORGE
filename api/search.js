const norm = s =>
  (s || '').toLowerCase().replace(/[^a-z0-9+#. ]/g, ' ');

const words = s =>
  [...new Set(norm(s).split(/\s+/).filter(x => x.length > 2))];

const skills = [
  'javascript',
  'typescript',
  'python',
  'java',
  'react',
  'node',
  'node.js',
  'sql',
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'machine learning',
  'data analysis',
  'excel',
  'power bi',
  'tableau',
  'django',
  'flask',
  'html',
  'css',
  'git'
];

function profile(resume, p = {}) {
  return {
    skills: skills.filter(x =>
      norm(resume).includes(norm(x))
    ),
    terms: words(resume),
    titles: p.titles || '',
    location: p.location || '',
    remote: !!p.remote
  };
}

function salary(s = '') {
  return (
    s.match(
      /(?:\$|USD\s?)\s?\d{2,3}(?:,\d{3})?(?:\s?(?:-|–|to)\s?(?:\$|USD\s?)?\d{2,3}(?:,\d{3})?)?(?:\s?(?:\/|per )?(?:year|yr|hour))?/i
    ) || []
  )[0] || 'Not listed';
}

async function feed(url) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'JobSeekerAgent/0.1'
    }
  });

  if (!response.ok) {
    throw new Error(`Source returned ${response.status}`);
  }

  return response.json();
}

async function jobs(query) {
  const out = [];
  const warnings = [];

  const results = await Promise.allSettled([
    feed(
      `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}`
    ),

    feed(
      'https://www.arbeitnow.com/api/job-board-api'
    )
  ]);

  // Remotive
  if (results[0].status === 'fulfilled') {
    out.push(
      ...(results[0].value.jobs || []).map(x => ({
        company: x.company_name,
        title: x.title,
        location:
          x.candidate_required_location || 'Remote',
        salary:
          x.salary || salary(x.description),
        url: x.url,
        source: 'Remotive',
        description: x.description || '',
        posted: x.publication_date
      }))
    );
  } else {
    warnings.push('Remotive unavailable');
  }

  // Arbeitnow
  const terms = words(query);

  if (results[1].status === 'fulfilled') {
    out.push(
      ...(results[1].value.data || [])
        .filter(
          x =>
            !terms.length ||
            terms.some(t =>
              norm(
                `${x.title} ${x.description}`
              ).includes(t)
            )
        )
        .slice(0, 100)
        .map(x => ({
          company: x.company_name,
          title: x.title,
          location:
            x.location ||
            (x.remote ? 'Remote' : 'Not listed'),
          salary: salary(x.description),
          url: x.url,
          source: 'Arbeitnow',
          description: x.description || '',
          posted: x.created_at
        }))
    );
  } else {
    warnings.push('Arbeitnow unavailable');
  }

  return {
    out,
    warnings
  };
}

function rank(job, p) {
  const text = norm(
    `${job.title} ${job.description} ${job.location}`
  );

  const matched = p.skills.filter(x =>
    text.includes(norm(x))
  );

  const titles = words(p.titles).filter(x =>
    norm(job.title).includes(x)
  );

  const score =
    Math.min(55, matched.length * 14) +
    Math.min(25, titles.length * 10) +
    Math.min(
      20,
      p.terms.filter(x => text.includes(x)).length
    ) +
    (p.remote && /remote/i.test(job.location) ? 8 : 0) +
    (p.location &&
    norm(job.location).includes(norm(p.location))
      ? 8
      : 0);

  return {
    ...job,

    fit: Math.min(100, score),

    matched,

    reason: matched.length
      ? `Matches ${matched.join(', ')}${
          titles.length
            ? '; target title aligns.'
            : '.'
        }`
      : 'Keyword-level match; review the listed requirements.'
  };
}

async function readBody(req) {
  if (
    req.body &&
    typeof req.body === 'object'
  ) {
    return req.body;
  }

  if (typeof req.body === 'string') {
    return JSON.parse(req.body || '{}');
  }

  return await new Promise((resolve, reject) => {
    let body = '';

    req.on('data', chunk => {
      body += chunk;

      if (body.length > 1e6) {
        reject(
          new Error('Request too large')
        );
      }
    });

    req.on('end', () => {
      try {
        resolve(
          JSON.parse(body || '{}')
        );
      } catch {
        reject(
          new Error('Invalid request')
        );
      }
    });

    req.on('error', reject);
  });
}

module.exports = async function handler(
  req,
  res
) {
  if (req.method !== 'POST') {
    res
      .status(405)
      .json({
        error:
          'Method not allowed. Use POST.'
      });

    return;
  }

  try {
    const x = await readBody(req);

    if (!String(x.resume || '').trim()) {
      res
        .status(400)
        .json({
          error:
            'Paste a resume first.'
        });

      return;
    }

    const p = profile(
      x.resume,
      x.preferences || {}
    );

    const q =
      p.titles ||
      p.skills.slice(0, 3).join(' ') ||
      'software engineer';

    const {
      out,
      warnings
    } = await jobs(q);

    const seen = new Set();

    const list = out
      .filter(j => {
        const key = norm(
          `${j.company}|${j.title}|${j.location}`
        );

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return (
          !p.remote ||
          /remote/i.test(j.location)
        );
      })
      .map(j => rank(j, p))
      .sort(
        (a, b) => b.fit - a.fit
      )
      .slice(0, 100);

    res.status(200).json({
      profile: p,
      query: q,
      total: list.length,
      jobs: list,
      warnings
    });

  } catch (e) {
    console.error(e);

    res
      .status(502)
      .json({
        error:
          e.message ||
          'Job search failed.'
      });
  }
};
