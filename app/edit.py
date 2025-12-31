from __future__ import annotations

from pathlib import Path
from typing import Optional
from datetime import datetime

from PIL import Image
from PIL import PngImagePlugin
import torch

from .config import CONFIG
from .pipeline import get_edit_pipeline


def _round_to_multiple_of_16(x: int) -> int:
    return max(16, (x // 16) * 16)


def edit_image(
    *,
    prompt: str,
    input_image_path: str | Path,
    negative_prompt: Optional[str] = None,
    strength: float = 0.6,
    height: Optional[int] = None,
    width: Optional[int] = None,
    num_inference_steps: Optional[int] = None,
    guidance_scale: Optional[float] = None,
    seed: Optional[int] = 42,
    output_path: Optional[str] = None,
) -> Path:
    """Edit an input image with an "edit" pipeline (Qwen Image Edit preferred).

    If an instruction-edit pipeline is available (e.g. QwenImageEditPlusPipeline),
    we use it; otherwise we fallback to img2img.
    """

    pipe = get_edit_pipeline()

    # Some pipelines (e.g. QwenImageEditPlusPipeline) do not support `strength`.
    strength_val = float(strength)
    if not (0.0 < strength_val <= 1.0):
        raise ValueError("strength must be in (0, 1].")

    input_path = Path(input_image_path)
    if not input_path.exists():
        raise FileNotFoundError(f"Input image not found: {input_path}")

    init_image = Image.open(input_path).convert("RGB")

    # If width/height not specified, keep original size.
    w = int(width) if width is not None else init_image.width
    h = int(height) if height is not None else init_image.height

    # Ensure divisible by 16 to prevent runtime errors.
    w = _round_to_multiple_of_16(w)
    h = _round_to_multiple_of_16(h)

    if (w, h) != (init_image.width, init_image.height):
        init_image = init_image.resize((w, h), Image.LANCZOS)

    # Introspect pipeline signature to decide defaults & supported params.
    sig = None
    is_instruction_edit = False
    try:
        import inspect

        sig = inspect.signature(pipe.__call__)
        is_instruction_edit = "true_cfg_scale" in sig.parameters and "strength" not in sig.parameters
    except Exception:
        pass

    # Defaults aligned with Qwen Image Edit example.
    steps = int(num_inference_steps) if num_inference_steps is not None else (40 if is_instruction_edit else CONFIG.num_inference_steps)
    scale = float(guidance_scale) if guidance_scale is not None else (1.0 if is_instruction_edit else CONFIG.guidance_scale)

    # In Qwen example, negative_prompt is a single space.
    neg = negative_prompt
    if is_instruction_edit and (neg is None or str(neg).strip() == ""):
        neg = " "

    generator = torch.Generator(device=CONFIG.device)
    if seed is not None:
        generator = generator.manual_seed(int(seed))

    print(
        "Editing with: "
        f"prompt='{prompt}', neg='{neg}', w={w}, h={h}, steps={steps}, "
        f"scale={scale}, strength={strength}, seed={seed}, input='{input_path}'",
        flush=True,
    )

    # Build kwargs dynamically for compatibility across pipelines.
    kwargs = {
        "image": init_image,
        "prompt": prompt,
        "negative_prompt": neg,
        "height": h,
        "width": w,
        "num_inference_steps": steps,
        "generator": generator,
    }

    # Only pass guidance_scale if pipeline supports it.
    if sig is None or "guidance_scale" in getattr(sig, "parameters", {}):
        kwargs["guidance_scale"] = scale

    # img2img pipelines accept strength; instruction-edit pipelines often don't.
    if sig is not None and "strength" in sig.parameters:
        kwargs["strength"] = strength_val

    # instruction-edit pipelines accept true_cfg_scale.
    if sig is not None and "true_cfg_scale" in sig.parameters:
        kwargs.setdefault("true_cfg_scale", 4.0)

    with torch.inference_mode():
        result = pipe(**kwargs)

    if output_path is None:
        ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_path = f"assets/edit_{ts}.png"

    metadata = PngImagePlugin.PngInfo()
    metadata.add_text("mode", "edit")
    metadata.add_text("prompt", str(prompt))
    if negative_prompt:
        metadata.add_text("negative_prompt", str(negative_prompt))
    metadata.add_text("height", str(h))
    metadata.add_text("width", str(w))
    metadata.add_text("steps", str(steps))
    metadata.add_text("scale", str(scale))
    metadata.add_text("strength", str(strength_val))
    if seed is not None:
        metadata.add_text("seed", str(seed))
    metadata.add_text("input_image", str(input_path.name))
    # Record which model is being used for edit (usually Qwen/Qwen-Image-Edit-2511)
    metadata.add_text("edit_model_id", str(getattr(CONFIG, "edit_model_id", "")))

    image = result.images[0]
    out = Path(output_path)
    if not out.is_absolute():
        out.parent.mkdir(parents=True, exist_ok=True)
    image.save(out, pnginfo=metadata)
    return out
