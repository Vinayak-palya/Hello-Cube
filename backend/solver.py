# solver.py
from kociemba import solve as kc_solve

def solve_rubiks_cube(facelets: str) -> str:
    facelets = facelets.strip()

    if len(facelets) != 54:
        raise ValueError("Cube state must be exactly 54 characters.")

    color_counts = {c: facelets.count(c) for c in set(facelets)}
    if any(count != 9 for count in color_counts.values()) or len(color_counts) != 6:
        raise ValueError("Each of the 6 face colors must appear exactly 9 times.")

    try:
        return kc_solve(facelets)
    except Exception as e:
        raise ValueError(f"Invalid cube: {str(e)}")
