📊 ClassTrack - Smart Schedule Analyzer & Productivity Dashboard

Tagline: "Turn your class schedule into actionable insights"

🎯 Overview

ClassTrack helps students understand and manage their class schedules. Instead of just listing events, it analyzes your schedule to:

Show time spent on each subject

Identify free study blocks

Detect schedule conflicts

Provide a weekly workload balance score

All features run entirely in the browser—no backend required.

🛠️ Tech Stack

Frontend: React (hooks: useState, useEffect, useMemo)

Styling: Tailwind CSS

Data Visualization: Recharts

Icons: Lucide React

✨ Features

Smart Schedule Parser

Extracts course codes, names, days, times, and locations using regex

Visual Time Breakdown

Pie chart: Hours per subject per week

Bar chart: Daily workload

Heatmap-style week view

Free Time Block Finder

Detects gaps ≥1 hour

Categorizes as short break, study block, or long gap

Schedule Health Score

Evaluates workload balance, back-to-back classes, early/late classes, total weekly hours

Conflict Detector

Flags overlapping classes

🚀 How It Works

Parses schedule text → converts times → expands recurring days

Detects free blocks and categorizes them

Calculates a health score based on workload, gaps, and class timings

Checks for conflicts and highlights them

🎨 UI/UX Highlights

Paste or drag-and-drop schedule input

Animated transitions between views

Color-coded schedule grid

Responsive and dark-mode friendly

📋 Sample Schedule
CS101 - Data Structures
Mon/Wed/Fri 9:00 AM - 10:30 AM

MATH215 - Linear Algebra
Tue/Thu 11:00 AM - 12:30 PM

ENGL102 - Technical Writing
Mon/Wed 2:00 PM - 3:30 PM

PHYS201 - Physics Lab
Thu 3:00 PM - 6:00 PM

⚡ Notes

Fully client-side: your data stays private

Works with common schedule formats
