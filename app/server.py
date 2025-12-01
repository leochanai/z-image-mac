from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
import os
import sys

# Add project root to sys.path to ensure app package is resolvable
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.generate import generate_image

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount assets directory to serve generated images
# Ensure assets directory exists
os.makedirs("assets", exist_ok=True)
app.mount("/assets", StaticFiles(directory="assets"), name="assets")

class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    height: Optional[int] = 1024
    width: Optional[int] = 1024
    steps: Optional[int] = 9
    guidance: Optional[float] = 0.0
    seed: Optional[int] = 42

@app.post("/api/generate")
async def generate(req: GenerateRequest):
    try:
        # Generate image
        # We don't specify output_path so it generates a timestamped one in assets/
        output_path = generate_image(
            prompt=req.prompt,
            negative_prompt=req.negative_prompt,
            height=req.height,
            width=req.width,
            num_inference_steps=req.steps,
            guidance_scale=req.guidance,
            seed=req.seed
        )
        
        # Convert absolute path to relative URL
        # output_path is a Path object, e.g., assets/output_2023...png
        # We need to return /assets/output_2023...png
        relative_path = f"/assets/{output_path.name}"
        
        return {
            "status": "success",
            "url": relative_path,
            "prompt": req.prompt
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
