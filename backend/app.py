from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from solver import solve_rubiks_cube

app = FastAPI()

# Allow frontend access (from localhost:3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
) 

@app.post("/api/solve")
async def solve_cube(request: Request):
    data = await request.json()
    cube_state = data.get("state")
    print(solve_rubiks_cube("UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB"))
    solution = solve_rubiks_cube(cube_state)
    return {"solution": solution}
