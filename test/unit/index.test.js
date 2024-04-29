import { filterJobs } from '../../src';

describe('filterJobs', () => {

  it('should filter jobs based on title and description keywords', () => {
    const jobs = [
      { title: 'Software Engineer', description: 'This is a remote job opportunity.' },
      { title: 'Web Developer', description: 'This job allows you to work from home.' },
      { title: 'Product Manager', description: 'This is an on-site position.' },
      { title: 'Product Manager - Work From Home', description: 'This is an on-site position.' }
    ];

    const filteredJobs = filterJobs(jobs);

    expect(filteredJobs).toHaveLength(3);
    expect(filteredJobs[0]).toEqual({ title: 'Software Engineer', description: 'This is a remote job opportunity.' });
    expect(filteredJobs[1]).toEqual({ title: 'Web Developer', description: 'This job allows you to work from home.' });
    expect(filteredJobs[2]).toEqual({ title: 'Product Manager - Work From Home', description: 'This is an on-site position.' });
  });

  it('should return an empty array if no jobs match the keywords', () => {
    const jobs = [
      { title: 'Software Engineer', description: 'This is an on-site position.' },
      { title: 'Web Developer', description: 'This is an on-site position.' },
      { title: 'Product Manager', description: 'This is an on-site position.' }
    ];

    const filteredJobs = filterJobs(jobs);

    expect(filteredJobs).toHaveLength(0);
  });
});