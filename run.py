import subprocess
import sys
import os
import time
import threading

def stream_output(process, prefix):
    """Streams output from a subprocess to stdout with a prefix."""
    for line in iter(process.stdout.readline, ''):
        if line:
            print(f"[{prefix}] {line.strip()}")
    process.stdout.close()

def run_servers():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root_dir, "frontend")
    
    print("=" * 60)
    print("   CareWise - Pharmacy Intelligence Platform Launcher   ")
    print("=" * 60)
    
    # 1. Start backend process
    print("[Launcher] Starting Flask Backend on http://localhost:5000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "backend.app"],
        cwd=root_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # 2. Start frontend process (using npm run dev)
    print("[Launcher] Starting Vite React Frontend on http://localhost:5173 ...")
    frontend_proc = subprocess.Popen(
        "npm run dev",
        shell=True,
        cwd=frontend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        bufsize=1
    )
    
    # Start threads to stream console outputs from both processes
    backend_thread = threading.Thread(target=stream_output, args=(backend_proc, "Backend"), daemon=True)
    frontend_thread = threading.Thread(target=stream_output, args=(frontend_proc, "Frontend"), daemon=True)
    
    backend_thread.start()
    frontend_thread.start()
    
    print("[Launcher] Both servers started successfully.")
    print("[Launcher] Press Ctrl+C to terminate both servers.")
    print("=" * 60)
    
    try:
        # Keep launcher alive and monitor processes
        while True:
            if backend_proc.poll() is not None:
                print("[Launcher] Warning: Backend process terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("[Launcher] Warning: Frontend process terminated unexpectedly.")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[Launcher] Shutting down servers gracefully...")
    finally:
        # Terminate processes
        try:
            backend_proc.terminate()
            frontend_proc.terminate()
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            pass
        print("[Launcher] Servers stopped.")

if __name__ == "__main__":
    run_servers()
