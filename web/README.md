# Z-Image Web 前端

Z-Image 项目的 Web 前端，基于 **Next.js 16** + **React 19** + **Tailwind CSS 4** 构建，提供现代化的赛博朋克风格图像生成界面。

---

## 功能特性

- **图像生成器**：输入提示词，调用后端 API 生成 AI 图像
- **参数控制**：支持负面提示词、分辨率、采样步数、CFG 引导强度、随机种子等高级配置
- **图片画廊**：浏览已生成的所有图片，支持下载和预览
- **多语言支持**：中文 / English 双语切换
- **主题切换**：亮色 / 暗色模式
- **响应式设计**：适配桌面和移动设备

---

## 技术栈

- **框架**：Next.js 16 (App Router)
- **UI**：React 19 + Tailwind CSS 4
- **动画**：Framer Motion
- **图标**：Lucide React
- **类型安全**：TypeScript 5
- **编译优化**：React Compiler (babel-plugin-react-compiler)

---

## 目录结构

```text
web/
├── src/
│   ├── app/                   # Next.js App Router 页面
│   │   ├── page.tsx           # 首页（Hero + Generator）
│   │   ├── gallery/page.tsx   # 画廊页面
│   │   └── layout.tsx         # 根布局
│   ├── components/            # React 组件
│   │   ├── Navbar.tsx         # 导航栏
│   │   ├── Hero.tsx           # 首页 Hero 区域
│   │   ├── Generator.tsx      # 图像生成器主组件
│   │   └── Gallery.tsx        # 画廊组件
│   ├── contexts/              # React Context
│   │   ├── LocaleContext.tsx  # 多语言上下文
│   │   ├── ThemeContext.tsx   # 主题上下文
│   │   └── Providers.tsx      # Context 统一包装
│   └── lib/
│       ├── utils.ts           # 工具函数（cn 等）
│       └── i18n/locales.ts    # 多语言翻译文本
├── public/                    # 静态资源
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
└── README.md                  # 本文件
```

---

## 快速开始

### 方式一：使用项目根目录的启动脚本（推荐）

在项目根目录执行：

```bash
./start.sh
```

该脚本会同时启动后端（Python API）和前端（Next.js），前端默认运行在 `http://localhost:3000`。

### 方式二：单独启动前端

若后端已在运行，可在本目录单独启动前端：

```bash
# 安装依赖（首次）
npm install

# 开发模式
npm run dev

# 或生产构建
npm run build
npm start
```

---

## API 依赖

前端依赖后端提供的以下 API（默认运行在 `http://127.0.0.1:8000`）：

- `POST /api/generate` — 生成图像
  - 参数：`prompt`, `negative_prompt`, `width`, `height`, `steps`, `guidance`, `seed`
  - 返回：`{ status, url, prompt }`

- `GET /api/assets` — 获取已生成图片列表
  - 返回：`[{ name, url, path }, ...]`

- `GET /assets/{filename}` — 静态资源访问

---

## 开发说明

### 添加新翻译

编辑 `src/lib/i18n/locales.ts`，在 `zh` 和 `en` 对象中添加对应的翻译键值。

### 修改 API 地址

若后端部署在其他地址，修改 `src/components/Generator.tsx` 和 `src/components/Gallery.tsx` 中的 fetch URL。

### 样式定制

项目使用 CSS 变量定义主题颜色，可在 `src/app/globals.css` 中调整。
