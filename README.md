# Z-Image macOS 本地推理启动器

一个面向 **macOS** 环境的 **Z-Image-Turbo 推理脚手架项目**，基于 [🤗 diffusers](https://github.com/huggingface/diffusers) 提供的 `ZImagePipeline`，封装了：

- 简单好用的 **命令行接口（CLI）**
- 仅适配 **macOS**，对 Apple Silicon (M1/M2/M3, MPS) 做了默认优化
- 可配置的分辨率、步数、随机种子等参数

> 本项目只包含推理代码和工程骨架，不包含原始 Z-Image 训练代码或论文内容，可作为你后续搭建 Web UI / 服务端的基础。

---

## 功能特性

- 使用 `Tongyi-MAI/Z-Image-Turbo` 模型进行本地图片生成
- 在 macOS 上自动检测设备：优先使用 Apple Silicon 的 `mps`，否则回退到 CPU，统一采用 `torch.float32` 以保证数值稳定（避免 float16 下的黑图 / NaN）
- 支持中英文 prompt，支持负面提示词
- 默认采用 Z-Image-Turbo 推荐的高质量配置（可在代码中修改）：
  - 分辨率：默认 `1024 × 1024`
  - 采样步数：默认 `num_inference_steps = 9`
  - 引导强度：默认 & 官方推荐均为 `guidance_scale = 0.0`
- 默认将图片输出到项目根目录下的 `assets/` 目录，并自动按时间戳命名（避免覆盖旧图）
- 代码结构清晰，方便你二次封装为 Web API / 后台服务

---

## 目录结构

```text
.
├── app
│   ├── __init__.py      # Python 包入口
│   ├── config.py        # 推理配置（设备、精度、默认分辨率等）
│   ├── pipeline.py      # ZImagePipeline 的初始化与缓存
│   ├── generate.py      # 核心生成函数（一次调用生成一张图）
│   └── cli.py           # 命令行入口：python -m app.cli
├── assets/              # 生成图片默认输出目录（运行生成命令时自动创建）
├── .venv/               # 可选：Python 虚拟环境
├── .gitignore           # Git 忽略规则（如有）
└── README.md            # 本文件
```

---

## 环境要求

- Python **3.10+**（推荐使用自带的 venv 创建虚拟环境）
- 操作系统：
  - **仅支持 macOS（Darwin）**
  - 强烈推荐：**macOS 12.3+ 且为 Apple Silicon（M1/M2/M3）**，支持 MPS
  - Intel Mac 只能使用 CPU 推理（可以跑，但会明显偏慢）
- 能访问 Hugging Face Hub 下载模型权重（`Tongyi-MAI/Z-Image-Turbo`）

> 非 macOS 平台在导入本项目时会直接抛出异常，本项目不提供官方支持。

---

## 安装与配置

### 1. 创建并激活虚拟环境

在项目根目录执行（仅针对 macOS）：

```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. 安装 PyTorch（以 Apple Silicon 为例）

在已激活的虚拟环境中执行（**不要**再加 `cpu` 专用 index）：

```bash
pip install --upgrade pip
pip install torch torchvision torchaudio
```

安装完后可以简单自检一下：

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

若 `mps available: True`，说明已经可以使用 Apple GPU 进行推理。

### 3. 安装 diffusers 及其依赖

```bash
pip install git+https://github.com/huggingface/diffusers
pip install transformers accelerate huggingface_hub
```

> 说明：使用源码安装 diffusers 是为了确保包含 Z-Image 相关的最新支持。

---

## 快速开始

### 方式一：命令行生成一张图片

在虚拟环境激活状态下，执行：

```bash
python -m app.cli \
  --prompt "一位身着红色汉服的年轻女子，精致妆容，高髻凤冠，霓虹灯闪电图案，夜晚街景"
```

首次运行会从 Hugging Face Hub 下载 `Tongyi-MAI/Z-Image-Turbo` 权重，时间视网络而定；之后再次运行会快很多。

CLI 参数说明：

- `--prompt` (必选)：生成图片的文本提示词，支持中英文
- `--negative`：负面提示词，用于排除不希望出现的元素
- `--height` / `--width`：图片分辨率，默认 `1024 × 1024`
- `--steps`：采样步数，默认 `9`
- `--guidance`：CFG 引导强度，默认 `0.0`，Turbo 模型建议保持为 0
- `--seed`：随机种子，默认 `42`
- `--output`：输出图片文件路径，默认 `assets/output_{yyyy-MM-dd_HH-mm-ss}.png`
  （例如：`assets/output_2025-12-01_12-34-56.png`）

示例：快速预览模式（更快，略降质量）：

```bash
python -m app.cli \
  --prompt "赛博朋克风格的未来城市夜景，霓虹灯与飞行汽车" \
  --height 768 --width 768 \
  --steps 7
```

### 方式二：在你自己的 Python 代码中调用

你可以直接复用 `app.generate.generate_image`：

```python
from app.generate import generate_image

path = generate_image(
    prompt="一只在云端遨游的机械鲸鱼，科幻风格",
    output_path="assets/whale.png",
)
print("saved to", path)
```

> 注意：确保当前解释器已经在项目根目录，且虚拟环境已激活，使得 `app` 包可以被正确 import。

---

## 配置与实现说明

### `app/config.py`

- 仅适配 macOS：在非 macOS 平台导入时直接抛出异常
- 自动检测设备：优先使用 `mps`（Apple Silicon），若不可用则回退 `cpu`
- 在 MPS / CPU 上统一使用 `torch.float32`，避免 float16 下可能出现的数值不稳定（黑图 / NaN）
- 统一维护：
  - `model_id`：默认 `Tongyi-MAI/Z-Image-Turbo`
  - 默认分辨率、高度 / 宽度
  - 默认步数 `num_inference_steps`
  - 默认 `guidance_scale`

### `app/pipeline.py`

- 使用 `ZImagePipeline.from_pretrained(...)` 从 Hugging Face Hub 加载模型
- 将 pipeline 迁移到配置好的设备（`to(CONFIG.device)`）
- 全局缓存一个 pipeline 实例，避免每次调用都重新加载权重
- 为兼容 macOS + MPS，不默认启用 `torch.compile` 或 Flash-Attention 等高级优化，以稳定性优先

### `app/generate.py`

- 封装 `generate_image(...)`：
  - 接收 prompt / negative_prompt / 分辨率 / 步数 / 引导强度 / 随机种子
  - 调用 pipeline 完成推理
  - 若未显式指定 `output_path`，自动将图片保存为 `assets/output_YYYY-MM-DD_HH-mm-ss.png`
  - 若指定了 `output_path`，会自动创建父目录，并将图片保存到该路径

### `app/cli.py`

- 使用 `argparse` 提供命令行入口
- 将命令行参数转换为 `generate_image` 调用
- 适合本地批量测试、与 shell 脚本集成

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

- 封装为 HTTP 接口（如使用 FastAPI / Flask）
- 接入前端 Web UI（如 Gradio、Streamlit）
- 支持批量生成与任务队列调度
- 等 Z-Image-Base / Z-Image-Edit 权重开放后，扩展更多能力（如图像编辑）

欢迎在此基础上根据自己的需求继续改造项目结构和推理逻辑。