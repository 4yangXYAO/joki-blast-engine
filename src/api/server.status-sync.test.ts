import { EventEmitter } from 'events'
import { wireCampaignStatusSync } from './server'

describe('wireCampaignStatusSync', () => {
  it('marks facebook cookie post as submitted on completed', () => {
    const queue = new EventEmitter()
    const repo = {
      getPostByJobId: vi.fn().mockReturnValue({ campaign_id: 'cmp_1', platform: 'facebook' }),
      // ✅ FIX #7: Mock new atomic method
      atomicMarkPostAndUpdateCampaign: vi
        .fn()
        .mockReturnValue({ post: { campaign_id: 'cmp_1' }, campaignUpdated: true }),
    }

    wireCampaignStatusSync(queue as any, repo as any)
    queue.emit('completed', 'job_1')

    expect(repo.atomicMarkPostAndUpdateCampaign).toHaveBeenCalledWith('job_1', 'submitted')
  })

  it('marks non-facebook post as posted on completed', () => {
    const queue = new EventEmitter()
    const repo = {
      getPostByJobId: vi.fn().mockReturnValue({ campaign_id: 'cmp_2', platform: 'threads' }),
      // ✅ FIX #7: Mock new atomic method
      atomicMarkPostAndUpdateCampaign: vi
        .fn()
        .mockReturnValue({ post: { campaign_id: 'cmp_2' }, campaignUpdated: true }),
    }

    wireCampaignStatusSync(queue as any, repo as any)
    queue.emit('completed', 'job_2')

    expect(repo.atomicMarkPostAndUpdateCampaign).toHaveBeenCalledWith('job_2', 'posted')
  })

  it('marks post as failed on failed event', () => {
    const queue = new EventEmitter()
    const repo = {
      getPostByJobId: vi.fn(),
      // ✅ FIX #7: Mock new atomic method
      atomicMarkPostAndUpdateCampaign: vi
        .fn()
        .mockReturnValue({ post: { campaign_id: 'cmp_3' }, campaignUpdated: true }),
    }

    wireCampaignStatusSync(queue as any, repo as any)
    queue.emit('failed', 'job_3')

    expect(repo.atomicMarkPostAndUpdateCampaign).toHaveBeenCalledWith('job_3', 'failed')
  })
})
