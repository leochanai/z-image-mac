from typing import Optional

import torch
from diffusers import ZImagePipeline

# -------- img2img (legacy / sometimes renamed) --------
try:
    # 旧命名（早期/部分分支）
    from diffusers import ZImageImg2ImgPipeline  # type: ignore
except Exception:  # pragma: no cover
    ZImageImg2ImgPipeline = None  # type: ignore[assignment]

try:
    # 新命名（当前 diffusers 版本中通常是 QwenImage*）
    from diffusers import QwenImageImg2ImgPipeline  # type: ignore
except Exception:  # pragma: no cover
    QwenImageImg2ImgPipeline = None  # type: ignore[assignment]

# -------- instruction edit (Qwen Image Edit family) --------
try:
    from diffusers import QwenImageEditPlusPipeline  # type: ignore
except Exception:  # pragma: no cover
    QwenImageEditPlusPipeline = None  # type: ignore[assignment]

try:
    from diffusers import QwenImageEditPipeline  # type: ignore
except Exception:  # pragma: no cover
    QwenImageEditPipeline = None  # type: ignore[assignment]

from .config import CONFIG


_PIPELINE: Optional[ZImagePipeline] = None
_PIPELINE_IMG2IMG: Optional[object] = None
_PIPELINE_EDIT: Optional[object] = None


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
        torch_dtype=CONFIG.torch_dtype,
    )

    pipe = pipe.to(CONFIG.device)

    # 如需在 CUDA 上进一步优化，可以只在 CUDA 场景下手动开启 compile：
    # if CONFIG.device == "cuda" and hasattr(torch, "compile"):
    #     pipe.transformer = torch.compile(pipe.transformer)  # type: ignore[attr-defined]

    _PIPELINE = pipe
    return _PIPELINE


def get_img2img_pipeline():
    """Lazily create and cache a global img2img pipeline instance.

    说明：diffusers 不同版本里，这个类名可能是：
    - ZImageImg2ImgPipeline（旧）
    - QwenImageImg2ImgPipeline（新）
    """

    cls = ZImageImg2ImgPipeline or QwenImageImg2ImgPipeline
    if cls is None:
        raise RuntimeError(
            "Img2Img pipeline is not available in your diffusers installation. "
            "Tried: ZImageImg2ImgPipeline, QwenImageImg2ImgPipeline. "
            "Please upgrade diffusers (installed from source per README)."
        )

    global _PIPELINE_IMG2IMG
    if _PIPELINE_IMG2IMG is not None:
        return _PIPELINE_IMG2IMG

    pipe = cls.from_pretrained(
        CONFIG.model_id,
        low_cpu_mem_usage=True,
        torch_dtype=CONFIG.torch_dtype,
    )

    pipe = pipe.to(CONFIG.device)

    _PIPELINE_IMG2IMG = pipe
    return _PIPELINE_IMG2IMG


def get_edit_pipeline():
    """Get the best available pipeline for "image editing".

    优先使用 Qwen Image Edit 系列（例如 Qwen/Qwen-Image-Edit-2511），
    若不可用则回退到 img2img。
    """

    cls = QwenImageEditPlusPipeline or QwenImageEditPipeline

    # If no edit pipeline is available in this diffusers build, fallback.
    if cls is None:
        return get_img2img_pipeline()

    # If user didn't configure a dedicated edit model id, fallback.
    model_id = getattr(CONFIG, "edit_model_id", None)
    if not model_id:
        return get_img2img_pipeline()

    global _PIPELINE_EDIT
    if _PIPELINE_EDIT is not None:
        return _PIPELINE_EDIT

    pipe = cls.from_pretrained(
        model_id,
        low_cpu_mem_usage=True,
        torch_dtype=CONFIG.torch_dtype,
    )

    pipe = pipe.to(CONFIG.device)

    _PIPELINE_EDIT = pipe
    return _PIPELINE_EDIT
