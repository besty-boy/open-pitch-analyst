import csv
import math
import random

# Configuration
DURATION = 120  # 2 minutes condensed match
FPS = 2 # 2 frames per second is enough with interpolation
PITCH_LENGTH = 105
PITCH_WIDTH = 68

# Teams
TEAM_A = "Team_OpenSource" # Blue, Left to Right
TEAM_B = "Team_Proprietary" # Red, Right to Left

players = []

# Helper to create player
def create_player(pid, name, number, team, role, base_x, base_y):
    return {
        "id": pid,
        "name": name,
        "number": number,
        "team": team,
        "role": role,
        "base_x": base_x,
        "base_y": base_y,
        "x": base_x,
        "y": base_y
    }

# --- Setup Team A (4-3-3) ---
# GK
players.append(create_player("A1", "Buffon", 1, TEAM_A, "GK", 5, 34))
# Def
players.append(create_player("A2", "Cafu", 2, TEAM_A, "RB", 25, 10))
players.append(create_player("A3", "Maldini", 3, TEAM_A, "CB", 20, 25))
players.append(create_player("A4", "Nesta", 4, TEAM_A, "CB", 20, 43))
players.append(create_player("A5", "Carlos", 5, TEAM_A, "LB", 25, 58))
# Mid
players.append(create_player("A6", "Xavi", 6, TEAM_A, "CM", 45, 34))
players.append(create_player("A7", "Iniesta", 8, TEAM_A, "LM", 45, 50))
players.append(create_player("A8", "Pirlo", 21, TEAM_A, "RM", 45, 18))
# Att
players.append(create_player("A9", "Messi", 10, TEAM_A, "RW", 70, 15))
players.append(create_player("A10", "Ronaldo", 9, TEAM_A, "ST", 75, 34))
players.append(create_player("A11", "Ronaldinho", 11, TEAM_A, "LW", 70, 53))

# --- Setup Team B (4-4-2) ---
# Mirror positions (105 - x)
def mirror(x): return PITCH_LENGTH - x

# GK
players.append(create_player("B1", "Casillas", 1, TEAM_B, "GK", mirror(5), 34))
# Def
players.append(create_player("B2", "Zanetti", 2, TEAM_B, "RB", mirror(25), 10))
players.append(create_player("B3", "Ferdinand", 5, TEAM_B, "CB", mirror(20), 25))
players.append(create_player("B4", "Vidic", 15, TEAM_B, "CB", mirror(20), 43))
players.append(create_player("B5", "Cole", 3, TEAM_B, "LB", mirror(25), 58))
# Mid
players.append(create_player("B6", "Gerrard", 8, TEAM_B, "CM", mirror(45), 25))
players.append(create_player("B7", "Lampard", 4, TEAM_B, "CM", mirror(45), 43))
players.append(create_player("B8", "Beckham", 7, TEAM_B, "RM", mirror(45), 10))
players.append(create_player("B9", "Giggs", 11, TEAM_B, "LM", mirror(45), 58))
# Att
players.append(create_player("B10", "Henry", 14, TEAM_B, "ST", mirror(70), 28))
players.append(create_player("B11", "Rooney", 10, TEAM_B, "ST", mirror(70), 40))

# Ball
ball = {"x": 52.5, "y": 34, "vx": 0, "vy": 0, "owner": None}

# Simulation State
records = []

def lerp(start, end, t):
    return start + (end - start) * t

def distance(x1, y1, x2, y2):
    return math.sqrt((x2 - x1)**2 + (y2 - y1)**2)

# Scenarios (Goals)
# Times: 15s (A), 40s (A), 60s (B), 85s (B), 105s (A)
goals = [
    {"time": 15, "team": TEAM_A, "scorer": "A10", "assist": "A6"},
    {"time": 40, "team": TEAM_A, "scorer": "A11", "assist": "A9"},
    {"time": 60, "team": TEAM_B, "scorer": "B10", "assist": "B8"},
    {"time": 85, "team": TEAM_B, "scorer": "B11", "assist": "B6"},
    {"time": 105, "team": TEAM_A, "scorer": "A9", "assist": "A10"},
]

current_goal_idx = 0
state = "normal" # normal, goal_buildup, celebration, reset
state_timer = 0
active_scorer = None
active_assist = None

for frame in range(DURATION * FPS):
    time = frame / FPS
    
    # Check for goal scenario start (5 seconds before goal time)
    if current_goal_idx < len(goals):
        g = goals[current_goal_idx]
        if time >= g["time"] - 5 and state == "normal":
            state = "goal_buildup"
            state_timer = 0
            active_scorer = next(p for p in players if p["id"] == g["scorer"])
            active_assist = next(p for p in players if p["id"] == g["assist"])
            
            # Teleport ball to assist player to start move
            ball["owner"] = active_assist
    
    # Logic based on state
    if state == "normal":
        # Ball moves slowly or stays in center
        ball["x"] = 52.5 + math.sin(time) * 10
        ball["y"] = 34 + math.cos(time * 0.7) * 10
        ball["owner"] = None
        
        # Players drift around base
        for p in players:
            p["x"] = p["base_x"] + math.sin(time + int(p["number"])) * 2
            p["y"] = p["base_y"] + math.cos(time * 0.8 + int(p["number"])) * 2

    elif state == "goal_buildup":
        state_timer += 1/FPS
        # 1. Assist runs with ball
        # 2. Passes to Scorer
        # 3. Scorer shoots
        
        target_goal_x = 105 if active_scorer["team"] == TEAM_A else 0
        
        if state_timer < 2.0:
            # Assist moves towards goal
            ball["owner"] = active_assist
            active_assist["x"] = lerp(active_assist["x"], target_goal_x * 0.7 + 52.5*0.3, 0.05)
            active_assist["y"] = lerp(active_assist["y"], 34, 0.05)
            
            # Scorer makes run
            active_scorer["x"] = lerp(active_scorer["x"], target_goal_x * 0.85 + 52.5*0.15, 0.05)
            active_scorer["y"] = lerp(active_scorer["y"], 34, 0.05)
            
        elif state_timer < 3.0:
            # Pass
            ball["owner"] = None
            ball["x"] = lerp(ball["x"], active_scorer["x"], 0.2)
            ball["y"] = lerp(ball["y"], active_scorer["y"], 0.2)
            
        elif state_timer < 4.0:
            # Scorer has ball, runs closer
            ball["owner"] = active_scorer
            active_scorer["x"] = lerp(active_scorer["x"], target_goal_x * 0.92, 0.1) # Inside box
            active_scorer["y"] = lerp(active_scorer["y"], 34, 0.1)
            
        else: # Shoot!
            ball["owner"] = None
            ball["x"] = lerp(ball["x"], target_goal_x, 0.3)
            ball["y"] = lerp(ball["y"], 34 + (random.random()-0.5)*5, 0.3)
            
            if distance(ball["x"], ball["y"], target_goal_x, ball["y"]) < 1:
                state = "celebration"
                state_timer = 0
                current_goal_idx += 1

    elif state == "celebration":
        state_timer += 1/FPS
        # Ball in net
        ball["owner"] = None
        
        # Scorer runs to corner
        corner_y = 0 if active_scorer["y"] < 34 else 68
        active_scorer["x"] = lerp(active_scorer["x"], active_scorer["base_x"], 0.05) 
        
        if state_timer > 3:
            state = "reset"
            state_timer = 0
            
    elif state == "reset":
        state_timer += 1/FPS
        # Reset everyone
        ball["x"] = lerp(ball["x"], 52.5, 0.1)
        ball["y"] = lerp(ball["y"], 34, 0.1)
        
        for p in players:
            p["x"] = lerp(p["x"], p["base_x"], 0.05)
            p["y"] = lerp(p["y"], p["base_y"], 0.05)
            
        if state_timer > 2:
            state = "normal"

    # Resolve Ball Position if owned
    if ball["owner"]:
        ball["x"] = ball["owner"]["x"] + 1 # Slight offset
        ball["y"] = ball["owner"]["y"]
    
    # Write Records
    # Players
    for p in players:
        records.append({
            "timestamp": round(time, 2),
            "player_id": p["id"],
            "player_name": p["name"],
            "jersey_number": p["number"],
            "team_id": p["team"],
            "half": 1 if time < DURATION/2 else 2,
            "x": round(p["x"], 2),
            "y": round(p["y"], 2),
            "speed": 0, # Calculated later or ignored
            "heart_rate": 120 + random.randint(0, 20),
            "event": "goal" if state == "celebration" and state_timer < 0.1 else ""
        })
        
    # Ball
    records.append({
        "timestamp": round(time, 2),
        "player_id": "ball",
        "player_name": "Ball",
        "jersey_number": "",
        "team_id": "BALL",
        "half": 1 if time < DURATION/2 else 2,
        "x": round(ball["x"], 2),
        "y": round(ball["y"], 2),
        "speed": 0,
        "heart_rate": "",
        "event": ""
    })

# Write CSV
fieldnames = ["timestamp", "player_id", "player_name", "jersey_number", "team_id", "half", "x", "y", "speed", "heart_rate", "event"]

with open("tst.csv", "w", newline="") as csvfile:
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
    writer.writeheader()
    for r in records:
        writer.writerow(r)

print("Generated match data successfully.")
