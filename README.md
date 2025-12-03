# Z-Image macOS 本地文生图应用

一个面向 **macOS** 环境的 **Z-Image-Turbo 文生图应用**，基于 [🤗 diffusers](https://github.com/huggingface/diffusers) 提供的 `ZImagePipeline`，封装了：

- 现代化的 **Web UI**（Next.js 16 + React 19 + Tailwind CSS 4）
- 高性能的 **REST API**（FastAPI）
- 简单好用的 **命令行接口（CLI）**
- 仅适配 **macOS**，对 Apple Silicon (M1/M2/M3, MPS) 做了默认优化

> 本项目只包含推理代码和工程骨架，不包含原始 Z-Image 训练代码或论文内容。

---

## ✨ 亮点：开箱即用

- **零配置模型下载**：自动从 Hugging Face Hub 下载 `Tongyi-MAI/Z-Image-Turbo` 权重，无需手动下载或配置
- **自动设备检测**：自动识别 Apple Silicon GPU (MPS)，无需手动指定设备
- **一键启动**：`./start.sh` 即可同时启动前端 + 后端，打开浏览器就能用

---

## 功能特性

### 核心能力
- 使用 `Tongyi-MAI/Z-Image-Turbo` 模型进行本地图片生成
- 在 macOS 上自动检测设备：优先使用 Apple Silicon 的 `mps`，否则回退到 CPU
- 统一采用 `torch.float32` 以保证数值稳定（避免 float16 下的黑图 / NaN）
- 支持中英文 prompt，支持负面提示词

### Web UI
- **图像生成器**：输入提示词生成 AI 图像，支持高级参数配置
- **图片画廊**：浏览、预览、下载已生成的所有图片
- **多语言支持**：中文 / English 双语切换
- **主题切换**：亮色 / 暗色模式
- **响应式设计**：适配桌面和移动设备
- **赛博朋克风格**：现代化的视觉设计

### 默认配置（可调整）
- 分辨率：默认 `1024 × 1024`
- 采样步数：默认 `num_inference_steps = 9`
- 引导强度：默认 `guidance_scale = 0.0`（Turbo 模型推荐）

---

## 目录结构

```text
.
├── app/                  # Python 后端
│   ├── __init__.py       # Python 包入口
│   ├── config.py         # 推理配置（设备、精度、默认分辨率等）
│   ├── pipeline.py       # ZImagePipeline 的初始化与缓存
│   ├── generate.py       # 核心生成函数
│   ├── server.py         # FastAPI 服务端
│   └── cli.py            # 命令行入口：python -m app.cli
├── web/                  # Next.js 前端
│   ├── src/
│   │   ├── app/          # Next.js App Router 页面
│   │   ├── components/   # React 组件
│   │   ├── contexts/     # React Context（主题、语言）
│   │   └── lib/          # 工具函数与多语言配置
│   ├── package.json
│   └── README.md         # 前端详细文档
├── assets/               # 生成图片输出目录
├── start.sh              # 一键启动脚本（前端 + 后端）
├── stop.sh               # 强制停止脚本
├── .venv/                # Python 虚拟环境
└── README.md             # 本文件
```

---

## 环境要求

- Python **3.10+**（推荐使用自带的 venv 创建虚拟环境）
- 操作系统：
  - **仅支持 macOS（Darwin）**
  - 强烈推荐：**macOS 12.3+ 且为 Apple Silicon（M1/M2/M3）**，支持 MPS
  - Intel Mac 只能使用 CPU 推理（可以跑，但会明显偏慢）
- 能访问 Hugging Face Hub（模型权重会在首次运行时自动下载并缓存）

> 非 macOS 平台在导入本项目时会直接抛出异常，本项目不提供官方支持。

---

## 安装与配置

### 1. 创建并激活虚拟环境

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. 安装 PyTorch

```bash
pip install --upgrade pip
pip install torch torchvision torchaudio
```

（可选）验证 MPS 是否可用

```bash
python - << 'PY'
import torch
print("torch version:", torch.__version__)
if hasattr(torch.backends, "mps"):
    print("mps available:", torch.backends.mps.is_available())
else:
    print("mps backend not present")
PY
```

若输出 `mps available: True`，说明可以使用 Apple GPU 加速推理。

### 3. 安装 diffusers 及依赖

```bash
pip install git+https://github.com/huggingface/diffusers
pip install transformers accelerate huggingface_hub
```

> 使用源码安装 diffusers 是为了确保包含 Z-Image 相关的最新支持。

### 4. 验证安装（命令行生成图片）

```bash
python -m app.cli \
  --prompt "一位身着红色汉服的年轻女子，精致妆容，高髻凤冠，霓虹灯闪电图案，夜晚街景"
```

> **首次运行说明**：程序会自动从 Hugging Face Hub 下载 `Tongyi-MAI/Z-Image-Turbo` 权重（约 12GB），下载完成后自动缓存无需手动配置，后续运行无需重复下载。

---

## 快速开始

### 方式一：一键启动 Web 应用（推荐）

在项目根目录执行：

```bash
./start.sh
```

该脚本会自动启动：
- **后端 API**：`http://localhost:8000`
- **前端 Web UI**：`http://localhost:3000`

打开浏览器访问 `http://localhost:3000` 即可开始使用。

停止服务：按 `Ctrl+C` 或执行 `./stop.sh`

### 方式二：CLI 命令行

CLI 参数说明：

- `--prompt` (必选)：生成图片的文本提示词，支持中英文
- `--negative`：负面提示词，用于排除不希望出现的元素
- `--height` / `--width`：图片分辨率，默认 `1024 × 1024`
- `--steps`：采样步数，默认 `9`
- `--guidance`：CFG 引导强度，默认 `0.0`，Turbo 模型建议保持为 0
- `--seed`：随机种子，默认 `42`
- `--output`：输出图片文件路径，默认 `assets/output_{yyyy-MM-dd_HH-mm-ss}.png`

示例：快速预览模式（更快，略降质量）：

```bash
python -m app.cli \
  --prompt "赛博朋克风格的未来城市夜景，霓虹灯与飞行汽车" \
  --height 768 --width 768 \
  --steps 7
```

---

## 技术架构

### 后端 (`app/`)

| 模块 | 说明 |
|------|------|
| `config.py` | 推理配置：设备检测、精度、默认参数 |
| `pipeline.py` | ZImagePipeline 初始化与全局缓存 |
| `generate.py` | 核心生成函数，支持完整参数配置 |
| `server.py` | FastAPI 服务，提供 REST API |
| `cli.py` | 命令行接口 |

### 前端 (`web/`)

| 技术 | 版本 |
|------|------|
| Next.js | 16 (App Router) |
| React | 19 |
| Tailwind CSS | 4 |
| Framer Motion | 动画效果 |
| TypeScript | 5 |

### API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/generate` | 生成图像 |
| GET | `/api/assets` | 获取已生成图片列表 |
| GET | `/assets/{filename}` | 访问静态图片资源 |

---

## 常见问题（FAQ）

### 1. 看到类似 CUDA 的 warning：`User provided device_type of 'cuda', but CUDA is not available`

这是 PyTorch 在尝试使用 CUDA 自动混合精度（autocast）时发现没有 CUDA 环境，转而回退到普通分支的提示。

- 对 **结果质量和是否成功生成图片没有影响**
- 只说明当前没有使用 CUDA 加速（在 Apple Silicon 上本来也用的是 MPS，而不是 CUDA）

### 2. 生成很慢 / CPU 占用很高

- 先用上面的自检代码确认 MPS 是否可用（`mps available: True`）
- 若为 `False`，检查：
  - 是否通过 Rosetta 以 x86_64 模式运行
  - 是否误装了 CPU-only 的 torch 版本
  - macOS 版本是否低于 12.3

### 3. 内存 / 显存是否够用？

- 对于 16G 以上内存 / 统一内存：
  - 1024 × 1024、9 步推理通常没有问题
- 若出现 OOM，可尝试：
  - 降到 768 × 768
  - 或将步数从 9 降到 6–7

---

## 后续扩展方向

- 支持批量生成与任务队列调度
- Docker 容器化部署
- 等 Z-Image-Base / Z-Image-Edit 权重开放后，扩展图像编辑等能力
- 添加用户认证与图片管理功能

欢迎在此基础上根据自己的需求继续改造项目结构和推理逻辑。
