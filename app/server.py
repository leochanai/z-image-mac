from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict
from pathlib import Path
from PIL import Image
import os
import sys
import traceback
import queue
import threading
import uuid
import time

os.environ["OLLAMA_HOST"] = "127.0.0.1:11434"
import ollama

from dotenv import load_dotenv

load_dotenv()

# Add project root to sys.path to ensure app package is resolvable
PROJECT_ROOT = Path(__file__).resolve().parents[1]
os.chdir(PROJECT_ROOT)
sys.path.append(str(PROJECT_ROOT))

from app.generate import generate_image
from app.edit import edit_image

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
ASSETS_DIR = PROJECT_ROOT / "assets"
ASSETS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/assets", StaticFiles(directory=str(ASSETS_DIR)), name="assets")

# Temporary input images for edit jobs (not mounted)
INPUT_DIR = PROJECT_ROOT / ".zimage_inputs"
INPUT_DIR.mkdir(parents=True, exist_ok=True)

class GenerateRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    height: Optional[int] = 1024
    width: Optional[int] = 1024
    steps: Optional[int] = 9
    guidance: Optional[float] = 0.0
    seed: Optional[int] = 42

class OptimizeRequest(BaseModel):
    prompt: str
    model: Optional[str] = os.getenv("OLLAMA_MODEL", "kimi-k2-thinking:cloud")

class EditJobRequest(BaseModel):
    prompt: str
    negative_prompt: Optional[str] = None
    strength: Optional[float] = 0.6
    height: Optional[int] = None
    width: Optional[int] = None
    # Qwen Image Edit 示例常用 40 steps
    steps: Optional[int] = 40
    # Qwen Image Edit 示例 guidance_scale=1.0
    guidance: Optional[float] = 1.0
    seed: Optional[int] = 42
    input_path: str


class JobStatus(BaseModel):
    job_id: str
    job_type: str  # "generate" | "edit"
    status: str  # "queued", "processing", "completed", "failed"
    position: Optional[int] = None
    result: Optional[Dict] = None
    error: Optional[str] = None
    created_at: float
    prompt: str

# Global Queue and Results
job_queue = queue.Queue()
job_results: Dict[str, JobStatus] = {}
current_job_id: Optional[str] = None

def worker():
    global current_job_id
    print("Worker thread started")
    while True:
        try:
            job_id, job_type, req = job_queue.get()
            current_job_id = job_id

            # Update status to processing
            if job_id in job_results:
                job_results[job_id].status = "processing"
                job_results[job_id].position = 0
                job_results[job_id].job_type = job_type

            print(f"Processing job {job_id} ({job_type}): {req.prompt}")

            try:
                if job_type == "generate":
                    output_path = generate_image(
                        prompt=req.prompt,
                        negative_prompt=req.negative_prompt,
                        height=req.height,
                        width=req.width,
                        num_inference_steps=req.steps,
                        guidance_scale=req.guidance,
                        seed=req.seed,
                    )
                elif job_type == "edit":
                    output_path = edit_image(
                        prompt=req.prompt,
                        input_image_path=req.input_path,
                        negative_prompt=req.negative_prompt,
                        strength=req.strength or 0.6,
                        height=req.height,
                        width=req.width,
                        num_inference_steps=req.steps,
                        guidance_scale=req.guidance,
                        seed=req.seed,
                    )

                    # Cleanup temporary input image (best-effort)
                    try:
                        p = Path(req.input_path).resolve()
                        if INPUT_DIR in p.parents and p.exists():
                            p.unlink()
                    except Exception:
                        pass
                else:
                    raise ValueError(f"Unknown job_type: {job_type}")

                relative_path = f"/assets/{Path(output_path).name}"

                if job_id in job_results:
                    job_results[job_id].status = "completed"
                    job_results[job_id].result = {
                        "url": relative_path,
                        "prompt": req.prompt,
                        "job_type": job_type,
                    }
            except Exception as e:
                print(f"Error processing job {job_id}: {e}")
                traceback.print_exc()
                if job_id in job_results:
                    job_results[job_id].status = "failed"
                    job_results[job_id].error = str(e)

            current_job_id = None
            job_queue.task_done()

        except Exception as e:
            print(f"Worker error: {e}")
            time.sleep(1)

# Start worker thread
threading.Thread(target=worker, daemon=True).start()

@app.post("/api/generate")
def generate(req: GenerateRequest):
    try:
        job_id = str(uuid.uuid4())

        job_status = JobStatus(
            job_id=job_id,
            job_type="generate",
            status="queued",
            position=job_queue.qsize() + 1,
            created_at=time.time(),
            prompt=req.prompt,
        )
        job_results[job_id] = job_status

        job_queue.put((job_id, "generate", req))

        return job_status
    except Exception as e:
        print("Error queuing job:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/edit")
async def edit(
    image: UploadFile = File(...),
    prompt: str = Form(...),
    negative_prompt: Optional[str] = Form(None),
    strength: float = Form(0.6),
    height: Optional[int] = Form(None),
    width: Optional[int] = Form(None),
    steps: int = Form(40),
    guidance: float = Form(1.0),
    seed: int = Form(42),
):
    """Queue an img2img edit job.

    The client should send multipart/form-data.
    """
    try:
        job_id = str(uuid.uuid4())

        # Save uploaded image to a temp folder (best-effort cleanup happens in worker)
        suffix = Path(image.filename or "input").suffix or ".png"
        input_path = INPUT_DIR / f"{job_id}{suffix}"
        contents = await image.read()
        input_path.write_bytes(contents)

        req = EditJobRequest(
            prompt=prompt,
            negative_prompt=negative_prompt,
            strength=strength,
            height=height,
            width=width,
            steps=steps,
            guidance=guidance,
            seed=seed,
            input_path=str(input_path),
        )

        job_status = JobStatus(
            job_id=job_id,
            job_type="edit",
            status="queued",
            position=job_queue.qsize() + 1,
            created_at=time.time(),
            prompt=prompt,
        )
        job_results[job_id] = job_status

        job_queue.put((job_id, "edit", req))

        return job_status
    except Exception as e:
        print("Error queuing edit job:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/optimize")
def optimize_prompt(req: OptimizeRequest):
    try:
        # Construct the prompt for optimization
        system_prompt = "You are an expert at writing AI text to image prompts. Your task is to take a simple prompt and expand it into a detailed, descriptive prompt that will generate a high-quality image. Focus on lighting, texture, composition, and style. Output ONLY the optimized prompt in the same language as the input, no other text."
        
        full_prompt = f"{system_prompt}\n\nInput: {req.prompt}\n\nOptimized Prompt:"
        
        # Call Ollama API
        try:
            response = ollama.generate(model=req.model, prompt=full_prompt)
            return {"optimized_prompt": response['response'].strip()}
                
        except Exception as e:
            print(f"Ollama error: {e}")
            raise HTTPException(status_code=503, detail=f"Ollama error: {str(e)}. Is it running?")
            
    except HTTPException as he:
        raise he
    except Exception as e:
        print("Error optimizing prompt:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
@app.get("/api/job/{job_id}")
def get_job(job_id: str):
    if job_id not in job_results:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job = job_results[job_id]
    
    # Update position if still queued
    if job.status == "queued":
        # This is a simple estimation. For a real system, we might want a more efficient way to track position.
        # But for a local single-user/few-users app, iterating the queue is fine or just relying on the initial position (though that's static).
        # Let's try to find its actual index in the queue.
        # queue.Queue doesn't support random access/search easily. 
        # So we'll just return the stored object. The client can infer position or we just don't update it dynamically for now.
        pass
        
    return job

@app.get("/api/queue")
def get_queue():
    """Get all jobs currently in queue or processing"""
    queued_jobs = []
    
    # Add currently processing job
    if current_job_id and current_job_id in job_results:
        queued_jobs.append(job_results[current_job_id])
        
    # Add queued jobs
    # We can't easily peek into queue.Queue, so we'll filter job_results
    # This might grow large over time, so we should clean up old jobs eventually.
    # For now, we filter by status.
    
    # Sort by creation time
    all_jobs = sorted(job_results.values(), key=lambda x: x.created_at)
    
    active_jobs = [j for j in all_jobs if j.status in ["queued", "processing"]]
    
    # Update positions
    for i, job in enumerate(active_jobs):
        if job.status == "processing":
            job.position = 0
        else:
            # If processing job exists, queued items start at 1. If not, start at 1 (waiting to be picked up).
            # Actually, if there is a processing job (pos 0), the first queued job is pos 1.
            # If no processing job (worker idle?), the first queued job will be picked up immediately.
            job.position = i
            
    return active_jobs

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
