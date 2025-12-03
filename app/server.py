from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, Dict, List
from PIL import Image
import os
import sys
import traceback
import queue
import threading
import uuid
import time
from datetime import datetime

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

class JobStatus(BaseModel):
    job_id: str
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
            job_id, req = job_queue.get()
            current_job_id = job_id
            
            # Update status to processing
            if job_id in job_results:
                job_results[job_id].status = "processing"
                job_results[job_id].position = 0
            
            print(f"Processing job {job_id}: {req.prompt}")
            
            try:
                # Generate image
                output_path = generate_image(
                    prompt=req.prompt,
                    negative_prompt=req.negative_prompt,
                    height=req.height,
                    width=req.width,
                    num_inference_steps=req.steps,
                    guidance_scale=req.guidance,
                    seed=req.seed
                )
                
                relative_path = f"/assets/{output_path.name}"
                
                # Update result
                if job_id in job_results:
                    job_results[job_id].status = "completed"
                    job_results[job_id].result = {
                        "url": relative_path,
                        "prompt": req.prompt
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
        
        # Create job status
        job_status = JobStatus(
            job_id=job_id,
            status="queued",
            position=job_queue.qsize() + 1,
            created_at=time.time(),
            prompt=req.prompt
        )
        job_results[job_id] = job_status
        
        # Add to queue
        job_queue.put((job_id, req))
        
        return job_status
    except Exception as e:
        print("Error queuing job:")
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
