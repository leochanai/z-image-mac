from typing import Optional

import torch
from diffusers import ZImagePipeline

from .config import CONFIG


_PIPELINE: Optional[ZImagePipeline] = None


def get_pipeline() -> ZImagePipeline:
    """Lazily create and cache a global ZImagePipeline instance.

    The weights will be downloaded from the Hugging Face Hub on first use
    and then kept in memory for subsequent calls.
    """
    global _PIPELINE
    if _PIPELINE is not None:
        return _PIPELINE

    # Note: diffusers >=0.33 推荐使用 `dtype` 参数，而不是 `torch_dtype`。
    # 同时，为了兼容 MPS / CPU，默认关闭 torch.compile，避免出现数值不稳定
    #（NaN 导致导出图片为黑图）的情况。
    pipe = ZImagePipeline.from_pretrained(
        CONFIG.model_id,
        low_cpu_mem_usage=True,
    )

    pipe = pipe.to(CONFIG.device)

    # 如需在 CUDA 上进一步优化，可以只在 CUDA 场景下手动开启 compile：
    # if CONFIG.device == "cuda" and hasattr(torch, "compile"):
    #     pipe.transformer = torch.compile(pipe.transformer)  # type: ignore[attr-defined]

    _PIPELINE = pipe
    return _PIPELINE
