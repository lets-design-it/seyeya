"""
Helper script to initialize standard application upload directories under /uploads
"""
import os

UPLOAD_SUBFOLDERS = ["rooms", "menu", "conference", "hotel", "users", "general"]

def init_upload_directories():
    base_dir = "uploads"
    os.makedirs(base_dir, exist_ok=True)
    for sub in UPLOAD_SUBFOLDERS:
        folder_path = os.path.join(base_dir, sub)
        os.makedirs(folder_path, exist_ok=True)
        # Create a .gitkeep so git tracks empty folder structures if needed
        gitkeep = os.path.join(folder_path, ".gitkeep")
        if not os.path.exists(gitkeep):
            with open(gitkeep, "w") as f:
                f.write("")
        print(f"Directory ready: {folder_path}")

if __name__ == "__main__":
    init_upload_directories()
