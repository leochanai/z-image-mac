import argparse

from .generate import generate_image


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Z-Image-Turbo local CLI (M1 / MPS friendly)",
    )
    parser.add_argument(
        "--prompt",
        required=True,
        help="Text prompt for image generation (supports English & Chinese).",
    )
    parser.add_argument(
        "--negative",
        default=None,
        help="Negative prompt to avoid unwanted content.",
    )
    parser.add_argument("--height", type=int, default=None, help="Image height in pixels.")
    parser.add_argument("--width", type=int, default=None, help="Image width in pixels.")
    parser.add_argument(
        "--steps",
        type=int,
        default=None,
        help="Number of inference steps (default 9).",
    )
    parser.add_argument(
        "--guidance",
        type=float,
        default=None,
        help="CFG guidance scale (Turbo models recommend 0.0).",
    )
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducibility.")
    parser.add_argument(
        "--output",
        default=None,
        help=(
            "Where to save the generated image ("
            "default: assets/output_YYYY-MM-DD_HH-mm-ss.png)."
        ),
    )

    args = parser.parse_args()

    path = generate_image(
        prompt=args.prompt,
        negative_prompt=args.negative,
        height=args.height,
        width=args.width,
        num_inference_steps=args.steps,
        guidance_scale=args.guidance,
        seed=args.seed,
        output_path=args.output,
    )

    print(f"Image saved to {path.resolve()}")


if __name__ == "__main__":
    main()
