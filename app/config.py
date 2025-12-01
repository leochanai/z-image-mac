from dataclasses import dataclass
import platform

import torch


# 本项目仅适配 macOS：如果在其他系统上导入，将直接报错。
if platform.system() != "Darwin":
    raise RuntimeError("This project only supports macOS.")


def detect_device() -> str:
    """Detect the best available device on macOS.

    - 优先使用 Apple Silicon 上的 MPS
    - 若不可用，则回退到 CPU（性能会明显变差）
    """
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def select_dtype(device: str) -> torch.dtype:
    """Select a reasonable default dtype for the given device on macOS.

    实测在 MPS 上使用 float16 容易出现数值不稳定（NaN、黑图），
    因此在 Apple Silicon 上统一采用 float32 以保证稳定性。
    """
    if device == "mps":
        return torch.float32
    # 如未来接入 CUDA，可在此返回 bfloat16 / float16
    return torch.float32


_DEVICE = detect_device()
_DTYPE = select_dtype(_DEVICE)


@dataclass
class ZImageConfig:
    """Configuration for Z-Image-Turbo inference."""

    # Model id on Hugging Face Hub
    model_id: str = "Tongyi-MAI/Z-Image-Turbo"

    # Device / dtype
    device: str = _DEVICE
    torch_dtype: torch.dtype = _DTYPE

    # Default image size and sampling params（高质量模式）
    # 使用官方推荐配置：1024×1024, 9 步；如需加速可在 CLI 中自行下调。
    height: int = 1024
    width: int = 1024
    num_inference_steps: int = 9
    guidance_scale: float = 0.0   # Turbo models 建议保持 0.0


CONFIG = ZImageConfig()
