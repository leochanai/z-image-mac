from pathlib import Path
from typing import Optional
from datetime import datetime

import torch

from .config import CONFIG
from .pipeline import get_pipeline


def generate_image(
    prompt: str,
    negative_prompt: Optional[str] = None,
    height: Optional[int] = None,
    width: Optional[int] = None,
    num_inference_steps: Optional[int] = None,
    guidance_scale: Optional[float] = None,
    seed: Optional[int] = 42,
    output_path: Optional[str] = None,
) -> Path:
    """Generate a single image with Z-Image-Turbo and save it to disk."""
    pipe = get_pipeline()

    h = height or CONFIG.height
    w = width or CONFIG.width
    
    # Ensure divisible by 16 to prevent runtime errors (Z-Image requirement)
    h = (h // 16) * 16
    w = (w // 16) * 16

    steps = num_inference_steps or CONFIG.num_inference_steps
    scale = guidance_scale if guidance_scale is not None else CONFIG.guidance_scale

    generator = torch.Generator(device=CONFIG.device)
    if seed is not None:
        generator = generator.manual_seed(seed)

    print(f"Generating with: prompt='{prompt}', neg='{negative_prompt}', h={h}, w={w}, steps={steps}, scale={scale}, seed={seed}")

    result = pipe(
        prompt=prompt,
        negative_prompt=negative_prompt,
        height=h,
        width=w,
        num_inference_steps=steps,
        guidance_scale=scale,
        generator=generator,
    )

    # 若未显式指定输出路径，则按时间戳生成：
    # assets/output_YYYY-MM-DD_HH-mm-ss.png
    if output_path is None:
        ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        output_path = f"assets/output_{ts}.png"

    image = result.images[0]
    path = Path(output_path)
    # 默认将图片存放在项目根目录下的 assets/ 目录中；若目录不存在则自动创建。
    if not path.is_absolute():
        path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path)
    return path
