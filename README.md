# 黑洞一口吞

竖屏超休闲小游戏。拖动桌上的黑洞，先吞小物长大，再吞掉清单里的目标。炸弹、辣椒和仙人掌会失败。广告创意可以直接拍实机：洞怎么吃，游戏里就怎么玩。

英文项目名：`influendos-hole-gulp`

## 怎么玩

1. 标题页点 **开始游戏**。第一次会看到三步说明。
2. 按住桌面拖动黑洞。桌面端也可以用 WASD 或方向键，`Esc` 暂停。
3. 只有比洞口小的东西才吞得下。先吃小的，洞会变大。
4. 吃完清单上的目标即过关。吞到炸弹、辣椒或仙人掌会失败，时间耗尽也会失败。
5. 结算给 1–3 星。三星条件：剩余时间不少于一半，并且没有使用加时、磁铁或复活。
6. 失败后可以看一段占位激励视频复活（加 12 秒、短暂无敌，每局一次），或直接重开。
7. 局内 **加时**、**磁铁** 有免费次数。用完后按钮变成广告位，看完占位视频立即生效。
8. 标题页可以签到、换黑洞皮肤、开关音效。进度写在本机 `localStorage`，键名 `influendos-hole-gulp-v1`。

一共 22 关，难度从教学桌递进到限时、木块、炸弹和错误目标。

## 本地运行

需要 Node.js 20 或更高。

```bash
npm i
npm run dev
```

开发服务器默认在 [http://127.0.0.1:4317](http://127.0.0.1:4317)。画布是 9:16，桌面浏览器两侧会留深色边。

## 构建与静态托管

```bash
npm run build
npm run preview
```

`npm run build` 会先做类型检查，再把静态文件输出到 `dist/`。资源使用相对路径，可以放到任意静态目录，包括 GitHub Pages 的项目站点。把 `dist/` 的内容作为站点根目录即可。

## 素材与许可

| 内容 | 来源 | 许可 |
| --- | --- | --- |
| 按钮、星星、箭头、勾选 | [Kenney UI Pack](https://kenney.nl/assets/ui-pack) | CC0 1.0 |
| 粒子（圆点、星星、火花） | [Kenney Particle Pack](https://kenney.nl/assets/particle-pack) | CC0 1.0 |
| 界面音效 | [Kenney Interface Sounds](https://kenney.nl/assets/interface-sounds) | CC0 1.0 |
| 撞击 / 吞咽音效 | [Kenney Impact Sounds](https://kenney.nl/assets/impact-sounds) | CC0 1.0 |
| 界面中文 | Noto Sans CJK SC（按本作用字子集） | SIL Open Font License 1.1 |
| 黑洞、食物、炸弹、桌面 | 本项目原创扁平绘制 | 项目代码的一部分 |
| 吞噬 whoosh、失败嗡声、过关旋律、背景音乐 | 本项目原创合成 | 项目代码的一部分 |

许可原文：

- `public/assets/kenney/licenses/`
- `public/assets/fonts/OFL.txt`

如果这些静态文件没有被检出，开局会改用程序绘制的按钮、星星和粒子，吞咽和失败仍然有合成音效。中文会回退到系统黑体。

CC0 不强制署名。游戏内「致谢」页和这里仍然写出来源。没有使用第三方角色、商店截图或来源不清的素材站。

重新生成字体子集（需要已下载的 Noto Sans CJK SC Bold，以及 `fonttools`、`brotli`）：

```bash
pyftsubset NotoSansCJKsc-Bold.otf \
  --text-file=chars.txt \
  --output-file=public/assets/fonts/NotoSansSC-Bold.woff2 \
  --flavor=woff2
```

`chars.txt` 应覆盖 `src/` 与本说明里会出现在画面上的字符。仓库里提交的是子集，不是完整 CJK 字体。

## 买量试投说明

- 竖屏 9:16，录制时裁切画面中间的游戏画布即可，两侧黑边不要拍进去。
- 前几秒可以直接录标题页黑洞吞食物，或第 1 关实机。机制和画面一致，不需要假失败素材。
- 真失败在第 4 关附近就会出现（炸弹）。失败页的「看视频复活」、局内「加时 / 磁铁」都是激励视频位。
- 当前广告是 3 秒占位倒计时，文案写明「试投占位 · 不会请求真实广告」。接入正式 SDK 时，只替换 `src/game/ads.ts` 里的 `openRewardedSlot`，让它在观看完成后 resolve `true`。
- 没有登录、没有后端、没有需要密钥的服务。星级、金币、皮肤、签到和道具次数都在本地。
- 清掉站点数据会重置存档。试投机之间的进度不会同步。

## 脚本

| 命令 | 作用 |
| --- | --- |
| `npm run dev` | 本地游玩 |
| `npm run build` | 类型检查并输出 `dist/` |
| `npm run preview` | 预览构建结果 |
