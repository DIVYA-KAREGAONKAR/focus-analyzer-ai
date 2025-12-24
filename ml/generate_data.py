import csv
import random

rows = []
rows.append(["duration", "switch_count", "switch_rate", "active_ratio", "label"])

# ---------- Focused users ----------
for _ in range(500):
    duration = random.uniform(30, 300)  # minutes
    switch_count = random.randint(0, 4)
    switch_rate = switch_count / duration
    active_ratio = random.uniform(0.90, 0.99)
    rows.append([
        round(duration, 2),
        switch_count,
        round(switch_rate, 3),
        round(active_ratio, 2),
        0
    ])

# ---------- Distracted users ----------
for _ in range(500):
    duration = random.uniform(5, 90)
    switch_count = random.randint(3, 20)
    switch_rate = switch_count / duration
    active_ratio = random.uniform(0.25, 0.70)
    rows.append([
        round(duration, 2),
        switch_count,
        round(switch_rate, 3),
        round(active_ratio, 2),
        1
    ])

# Save CSV
with open("session_data_1000.csv", "w", newline="") as f:
    writer = csv.writer(f)
    writer.writerows(rows)

print("✅ 1000-row dataset generated: session_data_1000.csv")
