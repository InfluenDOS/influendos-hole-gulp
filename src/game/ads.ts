/**
 * Mock rewarded placement. Resolves true after the countdown is claimed.
 * Replace this function when a real ad SDK is wired up; callers only need the boolean.
 */
export function openRewardedSlot(parent: HTMLElement, rewardLabel: string): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false
    const root = document.createElement('div')
    root.className = 'modal-layer'
    root.innerHTML = `
      <div class="card ad-card">
        <h2>激励视频</h2>
        <p class="sub">试投占位 · 不会请求真实广告</p>
        <p class="reward">看完即可获得：${rewardLabel}</p>
        <div class="ad-bar"><span></span></div>
        <button type="button" class="btn yellow" disabled>播放中…</button>
        <button type="button" class="btn grey">放弃奖励</button>
      </div>
    `
    parent.appendChild(root)
    const bar = root.querySelector('.ad-bar span') as HTMLElement
    const claim = root.querySelectorAll('button')[0]
    const skip = root.querySelectorAll('button')[1]
    let elapsed = 0
    let ready = false
    const timer = window.setInterval(() => {
      if (ready) return
      elapsed += 0.05
      const p = Math.min(1, elapsed / 3.2)
      bar.style.width = `${Math.max(4, p * 100)}%`
      if (p >= 1) {
        ready = true
        claim.disabled = false
        claim.textContent = '领取奖励'
      }
    }, 50)
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      window.clearInterval(timer)
      root.remove()
      resolve(ok)
    }
    claim.addEventListener('click', () => {
      if (!ready) return
      finish(true)
    })
    skip.addEventListener('click', () => finish(false))
  })
}
