from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional
from PIL import Image
import os
import sys
import traceback

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
def generate(req: GenerateRequest):
    try:
        print(f"Received request: {req}")
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
        print("Error generating image:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/assets")
def get_assets():
    try:
        files = []
        if os.path.exists("assets"):
            # List all files in assets directory, sorted by modification time (newest first)
            # Filter for image files only to be safe
            all_files = [f for f in os.listdir("assets") if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
            all_files.sort(key=lambda x: os.path.getmtime(os.path.join("assets", x)), reverse=True)
            
            for filename in all_files:
                file_path = os.path.join("assets", filename)
                metadata = {}
                try:
                    with Image.open(file_path) as img:
                        # Copy info to avoid keeping file open
                        metadata = img.info.copy()
                except Exception as e:
                    print(f"Error reading metadata for {filename}: {e}")

                files.append({
                    "name": filename,
                    "url": f"/assets/{filename}",
                    "path": f"assets/{filename}",
                    "metadata": metadata
                })
        return files
    except Exception as e:
        print("Error listing assets:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/assets/{filename}")
def delete_asset(filename: str):
    try:
        # Validate filename to prevent directory traversal
        if ".." in filename or "/" in filename or "\\" in filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
            
        file_path = os.path.join("assets", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"status": "success", "message": f"Deleted {filename}"}
        else:
            raise HTTPException(status_code=404, detail="File not found")
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error deleting asset {filename}:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
