# Driftbox · 推移

一个**推箱子变体**谜题游戏。经典推箱子只是基调，真正的乐趣来自叠加机制：**冰面滑行、深坑填平、压力板与闸门、颜色匹配、折跃门传送、单向格、脆地、钥匙与锁**。**五十一关、十个章节**，不规则地形与障碍，难度层层递增，多数关卡不给提示——自己读懂棋盘。

> 极简几何美学（受 Monument Valley / Mini Metro 启发），纯 Web，可部署于小型服务器。

---

## 玩法

- **目标**：把所有箱子推到目标点（彩色箱需推到同色目标点）。
- **只能推，不能拉**；玩家一次走一格。
- **冰面 `~`**：箱子被推上冰会一直滑到撞墙/障碍才停；**玩家不受冰影响**。
- **深坑 `^`**：玩家不能踏入；把箱子推进坑里会**填平**它（箱子消耗、坑变地面）→ 箱子要省着用。
- **压力板 + 闸门**：重物（玩家或箱子）压住压力板时，关联闸门开启；松开即关。
- **颜色匹配**：彩色箱子各归其位。
- **折跃门 `o/p/q`**：踩上去把**玩家**瞬移到同色的另一扇门；箱子过不去——它只送你。常用来抵达原本够不到的推箱方位。
- **单向格 `> < A V`**：只能顺着箭头方向进入，逆向进不去。
- **脆地 `%`**：你一旦离开就塌成深坑，只能走一次；箱子压着它不会塌。
- **钥匙 / 锁 `k j` / `K J`**：走到钥匙上即拾取，同色的锁随之打开。
- **撤销 / 重开**：无限撤销、随时重开，无死亡惩罚。记录步数与推动数，并给出最优参考。
- 菜单里的「玩法 / 图例」随时可查规则；关内右上角 `?` 同样可查。

### 关卡（51 关 / 10 章）

| 章 | 关 | 主题 |
|---|---|---|
| Ⅰ 基础 | 1–4 | 经典推箱，不规则地形与立柱障碍 |
| Ⅱ 薄冰 | 5–7 | 冰面滑行 |
| Ⅲ 深坑 | 8–10 | 填坑取舍 |
| Ⅳ 机关 | 11–13 | 压力板 / 闸门（含双板顶门） |
| Ⅴ 色彩 | 14–16 | 颜色匹配（含冰彩） |
| Ⅵ 折跃 | 17–20 | 折跃门，综合 |
| Ⅶ 诡径 | 21–23 | 单向格 / 脆地 / 钥匙锁（新机制引入） |
| Ⅷ 回环 · Ⅸ 迷宫 · Ⅹ 险峰 | 24–51 | 5–6 箱硬核古典关，由生成器逆向拉箱产出 |

> 难度由求解器把关：每关「参考最优步数（par）」由内置 A\* 求解器算出（4～45 步不等），并保证可解、非平凡。第 24–51 关由 `scripts/gen.ts`（逆向拉箱）大量产出再用求解器择优，故天然可解且都带已验证解法。

---

## 技术栈

- **前端**：Vite + TypeScript（无 UI 框架），DOM + CSS Grid 渲染，CSS 动画。极简几何，全部 CSS/SVG 绘制，无外部美术资源。
- **规则引擎**：纯 TypeScript（`src/engine`），**前后端共享**。
- **后端**：Node.js + Fastify，托管静态产物 + API，服务端用同一引擎**复算校验**解法，**SQLite** 存最佳成绩。
- **求解器**：内置 **A\*** 求解器（目标↔同色箱子最小指派启发）用于关卡 QA（可解性 / par / 死锁剪枝）与自测。

---

## 开发

要求 Node ≥ 22.5（内置 `node:sqlite`；推荐 24.x）。

```bash
npm install
npm run dev          # 前端开发服务器（Vite，:5173，/api 代理到 :8787）
npm run dev:server   # 后端开发服务器（Fastify，:8787）
```

## 自测（三层 + 真实端口）

```bash
npm run verify    # A* 求解器跑全部关卡：可解性 / par / 死锁；并回放交叉校验引擎
npm run smoke:api # 后端逻辑（fastify.inject）：合法解入库、伪造/非法解被拒、排行榜
npm run smoke:ui  # 真实 UI（jsdom）：模拟按键把每关打到过关浮层
npm run typecheck # 全工程 TS 类型检查
npm run gen       # （作者工具）逆向拉箱生成器，重算 src/engine/generated.ts
```

## 构建与部署（目标：2 核 8G）

```bash
npm run build               # vite build → dist/；esbuild 打包服务端 → dist-server/index.js
node dist-server/index.js   # 单进程：托管 dist/ + 提供 /api
```

环境变量：`PORT`（默认 8787）、`BIND_HOST`（默认 `0.0.0.0`）、`DB_FILE`（默认 `data/driftbox.sqlite`）。

服务器上线（示例）：

```bash
# 1. 取代码到 /opt/driftbox，构建
git clone https://github.com/Udkam/Game-1.git /opt/driftbox && cd /opt/driftbox
npm ci && npm run build && npm prune --omit=dev   # 构建后只保留运行期依赖

# 2. systemd 托管（绑定 127.0.0.1，由 nginx 反代）
sudo cp deploy/driftbox.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now driftbox

# 3. nginx：静态直出 + /api 反代（含长缓存与 SPA 回退）
sudo cp deploy/nginx.conf /etc/nginx/sites-available/driftbox
sudo ln -s /etc/nginx/sites-available/driftbox /etc/nginx/sites-enabled/ && sudo nginx -s reload
```

单元文件见 [`deploy/driftbox.service`](./deploy/driftbox.service)，反代见 [`deploy/nginx.conf`](./deploy/nginx.conf)。

---

详细设计与开发日志见 [`claude.md`](./claude.md)。
