# 🧠 Astrova Memory Management Guide

## Quick Start

The Astrova project now has **persistent memory** using Mem0! This solves the context retention problem between conversations.

## Basic Commands

### 1. Search Project Memory
```bash
python3 astrova_memory.py --query "backend architecture"
python3 astrova_memory.py --query "Swiss Ephemeris"
python3 astrova_memory.py --query "frontend features"
```

### 2. Add New Information (Async by default)
```bash
python3 astrova_memory.py --store "We just implemented a new feature for..."
```

### 3. View All Stored Memories
```bash
python3 astrova_memory.py --all
```

### 4. Interactive Mode
```bash
python3 astrova_memory.py
```

## 🚀 Advanced Features

### Filtering by Category
```bash
# Get only technology-related memories
python3 astrova_memory.py --tech
python3 astrova_memory.py --category technology
```

### Keyword Search with Pagination
```bash
# Search for specific keywords
python3 astrova_memory.py --keywords "ephemeris calculations"
python3 astrova_memory.py --keywords "navamsa" --page 2
```

### Paginated Browsing
```bash
# Browse all memories with pagination
python3 astrova_memory.py --browse
python3 astrova_memory.py --all --page 2 --page-size 10
```

### Update Existing Memories
```bash
# Update a memory (need memory ID from --all command)
python3 astrova_memory.py --update "abc12345,Updated information about feature"
```

## What's Already Stored

✅ **Architecture**: React+Vite frontend, Node.js backend, Supabase database  
✅ **Backend Services**: Swiss Ephemeris, Kundli controller, Yoga/Dosha services  
✅ **Frontend Features**: Chart dashboard, AI predictions, planetary events  
✅ **Technical Specs**: Lahiri Ayanamsa, Navamsa charts, Vedic aspects  
✅ **Current Status**: All major astrology features implemented  

## Example Searches

- `"ephemeris settings"` → Returns Swiss Ephemeris configuration info
- `"interpretation modules"` → Returns AI and interpretation features  
- `"database schema"` → Returns Supabase table information
- `"frontend components"` → Returns React component details

## How to Use in Development

### Before Starting Work:
```bash
python3 astrova_memory.py --query "current status"
```

### After Making Changes:
```bash
python3 astrova_memory.py --store "Implemented new XYZ feature with ABC functionality"
```

### When You Need Context:
```bash
python3 astrova_memory.py --query "how does the backend work"
```

## Memory Features

- 🔍 **Semantic Search**: Finds relevant information even with different wording
- 📊 **Categorization**: Automatically categorizes memories by type  
- ⏰ **Timestamps**: Tracks when information was added
- 🎯 **Relevance Scoring**: Returns most relevant results first

## Tips

- Use natural language queries
- Be specific when storing new information
- Include context about what changed and why
- Reference file names and functionality when adding memories

---

**This system ensures we never lose project context again!** 🎉
