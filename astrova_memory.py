#!/usr/bin/env python3
"""
Astrova Memory Management with Mem0
====================================

This script initializes and manages persistent memory for the Astrova astrology project
using Mem0 API. It stores and retrieves project context including architecture,
features, and ongoing development information.

Usage:
    python3 astrova_memory.py --store     # Store current project context
    python3 astrova_memory.py --query     # Query stored memories
    python3 astrova_memory.py --init      # Initialize with basic project info
"""

from mem0 import MemoryClient
import json
import argparse
from datetime import datetime

class AstrovaMemoryManager:
    def __init__(self):
        self.api_key = "m0-82UIkTkTWu23hzTCma3BGv838sHLKpu0Jim3bDPi"
        self.client = MemoryClient(api_key=self.api_key)
        self.project_id = "astrova_project"
        
    def initialize_project_memory(self):
        """Initialize Mem0 with comprehensive Astrova project information"""
        print("🌟 Initializing Astrova project memory...")
        
        # Core Architecture Information
        architecture_messages = [
            {
                "role": "user", 
                "content": "Astrova is a Vedic astrology platform with React frontend (Vite) and Node.js backend using Swiss Ephemeris for astronomical calculations. Uses Supabase Direct Connection (postgresql://postgres:***@db.ypscvzznlrxjeqkjasmb.supabase.co:5432/postgres) with comprehensive database containing 6 tables: world_events (1,500 rows), astrological_patterns (282 rows), event_pattern_matches (8,290 rows), ml_models (4 rows), ml_predictions (7 rows), and events_with_pattern_matches view."
            },
            {
                "role": "assistant", 
                "content": "I'll remember that Astrova uses React+Vite frontend, Node.js backend, Swiss Ephemeris calculations, and Supabase Direct Connection with rich database containing world events, astrological patterns, ML models, and pattern matching data."
            }
        ]
        
        # Backend Services
        backend_messages = [
            {
                "role": "user",
                "content": "Astrova backend has these key services: enhancedSwissEphemeris.js for planetary calculations, kundliController.js for birth chart generation, yogaService.js, doshaService.js, dashaService.js for Vimshottari calculations, aspectsService.js for planetary aspects, and predictionService.js for ML-based predictions."
            },
            {
                "role": "assistant",
                "content": "I'll remember the Astrova backend services: Swiss Ephemeris calculations, Kundli controller, Yoga/Dosha services, Dasha calculations, aspects service, and ML prediction service."
            }
        ]
        
        # Frontend Features
        frontend_messages = [
            {
                "role": "user",
                "content": "Astrova frontend includes chart results dashboard with birth chart visualization, monthly predictions using AI (Llama-3.3-70B via OpenRouter), planetary events analysis with load-more pagination, and comprehensive astrology interpretation modules."
            },
            {
                "role": "assistant",
                "content": "I'll remember the Astrova frontend has chart dashboard, AI-powered monthly predictions, planetary events with pagination, and interpretation modules."
            }
        ]
        
        # Technical Specifications
        technical_messages = [
            {
                "role": "user",
                "content": "Astrova uses Lahiri Ayanamsa for sidereal calculations, supports historical timezone handling, calculates Navamsa charts, implements Vedic aspects (Drishti), and includes ML pattern analysis for world events correlation with planetary positions."
            },
            {
                "role": "assistant",
                "content": "I'll remember Astrova's technical specs: Lahiri Ayanamsa, historical timezones, Navamsa charts, Vedic aspects, and ML pattern analysis for world events."
            }
        ]
        
        # Current Status
        status_messages = [
            {
                "role": "user",
                "content": f"As of {datetime.now().strftime('%Y-%m-%d')}, Astrova has implemented: complete birth chart generation, Vimshottari Dasha calculations, monthly AI predictions, planetary events analysis with pagination, Swiss Ephemeris integration, and ML training for astrological patterns."
            },
            {
                "role": "assistant",
                "content": "I'll remember the current Astrova implementation status with all major astrology features completed and operational."
            }
        ]
        
        # Store all memories
        message_sets = [
            ("Architecture", architecture_messages),
            ("Backend Services", backend_messages),
            ("Frontend Features", frontend_messages),
            ("Technical Specs", technical_messages),
            ("Current Status", status_messages)
        ]
        
        for category, messages in message_sets:
            try:
                result = self.client.add(messages, user_id=self.project_id)
                print(f"✅ Stored {category} information")
            except Exception as e:
                print(f"❌ Failed to store {category}: {e}")
        
        print("🎉 Astrova project memory initialization complete!")
    
    def add_memory(self, user_content, assistant_content=None, async_mode=True):
        """Add new memory to the project"""
        if not assistant_content:
            assistant_content = f"I'll remember this information about the Astrova project: {user_content[:100]}..."
        
        messages = [
            {"role": "user", "content": user_content},
            {"role": "assistant", "content": assistant_content}
        ]
        
        try:
            result = self.client.add(messages, user_id=self.project_id, async_mode=async_mode)
            mode_indicator = "🚀" if async_mode else "⏳"
            print(f"{mode_indicator} Added memory {'(async)' if async_mode else '(sync)'}: {user_content[:50]}...")
            return result
        except Exception as e:
            print(f"❌ Failed to add memory: {e}")
            return None
    
    def add_batch_memories(self, memory_list, async_mode=True):
        """Add multiple memories at once"""
        print(f"📦 Adding {len(memory_list)} memories in batch...")
        results = []
        
        for i, memory_content in enumerate(memory_list, 1):
            print(f"  {i}/{len(memory_list)}: {memory_content[:40]}...")
            result = self.add_memory(memory_content, async_mode=async_mode)
            results.append(result)
        
        print(f"✅ Batch complete: {len([r for r in results if r])} successful")
        return results
    
    def add_development_session(self, session_summary, changes_made, files_modified=None, async_mode=True):
        """Add comprehensive development session info"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M')
        
        session_content = f"Development session on {timestamp}: {session_summary}. Changes made: {changes_made}"
        if files_modified:
            session_content += f". Files modified: {', '.join(files_modified)}"
        
        return self.add_memory(session_content, async_mode=async_mode)
    
    def search_memories(self, query):
        """Search stored memories"""
        try:
            memories = self.client.search(query, user_id=self.project_id)
            print(f"\n🔍 Search results for: '{query}'")
            print("=" * 50)
            
            if memories:
                for i, memory in enumerate(memories, 1):
                    print(f"\n{i}. {memory}")
            else:
                print("No memories found for this query.")
            
            return memories
        except Exception as e:
            print(f"❌ Search failed: {e}")
            return []
    
    def get_all_memories(self, categories=None, keywords=None, page=1, page_size=50):
        """Get all stored memories for the project with filtering options"""
        try:
            params = {
                "user_id": self.project_id,
                "page": page,
                "page_size": page_size,
                "output_format": "v1.1"  # Use latest format for detailed info
            }
            
            if categories:
                params["categories"] = categories
            if keywords:
                params["keywords"] = keywords
                
            memories = self.client.get_all(**params)
            
            filter_info = ""
            if categories:
                filter_info += f" (categories: {', '.join(categories)})"
            if keywords:
                filter_info += f" (keywords: '{keywords}')"
                
            print(f"\n🧠 Astrova project memories{filter_info} - Page {page}:")
            print("=" * 60)
            
            if isinstance(memories, list) and memories:
                for i, memory in enumerate(memories, 1 + (page-1)*page_size):
                    # Handle both dict and string memory formats
                    if isinstance(memory, dict):
                        memory_text = memory.get('memory', 'No memory text')
                        categories_info = memory.get('categories', [])
                        created_at = memory.get('created_at', 'Unknown date')
                        memory_id = memory.get('id', 'No ID')
                        
                        print(f"\n{i}. {memory_text}")
                        if categories_info:
                            print(f"   📂 Categories: {', '.join(categories_info)}")
                        print(f"   🕒 Created: {created_at[:10] if created_at != 'Unknown date' else created_at}")
                        print(f"   🔑 ID: {memory_id[:8] if memory_id != 'No ID' else memory_id}...")
                    else:
                        # Fallback for simple string format
                        print(f"\n{i}. {str(memory)}")
            elif isinstance(memories, dict):
                # Handle paginated response format
                if 'results' in memories:
                    results = memories['results']
                    if results:
                        for i, memory in enumerate(results, 1 + (page-1)*page_size):
                            if isinstance(memory, dict):
                                memory_text = memory.get('memory', 'No memory text')
                                categories_info = memory.get('categories', [])
                                created_at = memory.get('created_at', 'Unknown date')
                                memory_id = memory.get('id', 'No ID')
                                
                                print(f"\n{i}. {memory_text}")
                                if categories_info:
                                    print(f"   📂 Categories: {', '.join(categories_info)}")
                                print(f"   🕒 Created: {created_at[:10] if created_at != 'Unknown date' else created_at}")
                                print(f"   🔑 ID: {memory_id[:8] if memory_id != 'No ID' else memory_id}...")
                            else:
                                print(f"\n{i}. {str(memory)}")
                    else:
                        print("No memories found in results.")
                else:
                    print("Unexpected dictionary response format.")
            else:
                print("No memories found.")
            
            return memories
        except Exception as e:
            print(f"❌ Failed to retrieve memories: {e}")
            return []
    
    def get_memories_by_category(self, category):
        """Get memories filtered by specific category"""
        return self.get_all_memories(categories=[category])
    
    def search_memories_with_keywords(self, keywords, page=1, page_size=20):
        """Search memories using keywords with pagination"""
        try:
            memories = self.client.get_all(
                user_id=self.project_id,
                keywords=keywords,
                page=page,
                page_size=page_size,
                output_format="v1.1"
            )
            
            print(f"\n🔍 Keyword search results for: '{keywords}' - Page {page}:")
            print("=" * 60)
            
            if memories:
                for i, memory in enumerate(memories, 1 + (page-1)*page_size):
                    memory_text = memory.get('memory', 'No memory text')
                    score = memory.get('score', 0)
                    print(f"\n{i}. {memory_text}")
                    print(f"   📊 Relevance: {score:.2f}")
            else:
                print("No memories found for these keywords.")
            
            return memories
        except Exception as e:
            print(f"❌ Keyword search failed: {e}")
            return []
    
    def update_memory(self, memory_id, new_text=None, metadata=None):
        """Update an existing memory"""
        try:
            update_params = {"memory_id": memory_id}
            if new_text:
                update_params["text"] = new_text
            if metadata:
                update_params["metadata"] = metadata
                
            result = self.client.update(**update_params)
            print(f"✅ Updated memory {memory_id[:8]}...")
            if new_text:
                print(f"   📝 New text: {new_text[:50]}...")
            if metadata:
                print(f"   🏷️  New metadata: {metadata}")
            return result
        except Exception as e:
            print(f"❌ Failed to update memory: {e}")
            return None
    
    def get_technology_memories(self):
        """Get all technology-related memories"""
        return self.get_memories_by_category("technology")
    
    def add_database_schema_info(self, async_mode=True):
        """Add current Supabase database schema information"""
        database_info = [
            "Supabase Direct Connection established at postgresql://postgres:***@db.ypscvzznlrxjeqkjasmb.supabase.co:5432/postgres",
            "Database contains 6 tables: world_events (1,500 historical events with planetary data), astrological_patterns (282 pattern definitions), event_pattern_matches (8,290 pattern correlations), ml_models (4 trained models for financial/political/disaster/pandemic predictions), ml_predictions (7 historical predictions), and events_with_pattern_matches view for analysis",
            "world_events table structure: id, title, description, event_date, category, event_type, impact_level, location_name, latitude, longitude, country_code, affected_population, source_url, planetary_snapshot (JSONB with full planetary positions), planetary_aspects (array of aspect descriptions)",
            "astrological_patterns table: pattern_name, pattern_type (planetary/aspect/nakshatra), pattern_conditions (JSONB), success_rate, total_occurrences, high_impact_occurrences",
            "ml_models table: model_name, model_type, category, model_data (JSONB with weights/features), accuracy, precision_score, recall_score, f1_score, hyperparameters",
            "Database includes rich astrological data: planetary positions in signs/degrees, Vedic aspects (Drishti), nakshatras, house positions, conjunctions, and ML pattern recognition for world event correlation"
        ]
        
        results = []
        for info in database_info:
            result = self.add_memory(info, async_mode=async_mode)
            results.append(result)
        
        print(f"✅ Added {len([r for r in results if r])} database schema memories")
        return results
    
    def browse_memories_paginated(self, page_size=10):
        """Interactive paginated browsing of memories"""
        page = 1
        while True:
            memories = self.get_all_memories(page=page, page_size=page_size)
            
            if not memories:
                print("No more memories to display.")
                break
                
            print(f"\n📄 Showing page {page} ({page_size} per page)")
            choice = input("\nOptions: [n]ext page, [p]revious page, [q]uit: ").lower()
            
            if choice == 'n':
                page += 1
            elif choice == 'p' and page > 1:
                page -= 1
            elif choice == 'q':
                break
            else:
                print("Invalid option. Use n/p/q.")

def main():
    parser = argparse.ArgumentParser(description="Astrova Memory Management")
    parser.add_argument("--init", action="store_true", help="Initialize project memory")
    parser.add_argument("--store", type=str, help="Store new information")
    parser.add_argument("--query", type=str, help="Query stored memories")
    parser.add_argument("--all", action="store_true", help="Show all memories")
    parser.add_argument("--category", type=str, help="Filter by category (e.g., technology)")
    parser.add_argument("--keywords", type=str, help="Search by keywords")
    parser.add_argument("--page", type=int, default=1, help="Page number for pagination")
    parser.add_argument("--page-size", type=int, default=20, help="Number of items per page")
    parser.add_argument("--update", type=str, help="Update memory by ID (format: 'memory_id,new_text')")
    parser.add_argument("--browse", action="store_true", help="Interactive paginated browsing")
    parser.add_argument("--tech", action="store_true", help="Show only technology memories")
    parser.add_argument("--database", action="store_true", help="Add current database schema information")
    parser.add_argument("--dev-session", type=str, help="Add development session (format: 'summary,changes,files')")
    
    args = parser.parse_args()
    
    memory_manager = AstrovaMemoryManager()
    
    if args.init:
        memory_manager.initialize_project_memory()
    elif args.store:
        memory_manager.add_memory(args.store)
    elif args.query:
        memory_manager.search_memories(args.query)
    elif args.keywords:
        memory_manager.search_memories_with_keywords(args.keywords, args.page, args.page_size)
    elif args.category:
        memory_manager.get_memories_by_category(args.category)
    elif args.tech:
        memory_manager.get_technology_memories()
    elif args.update:
        try:
            memory_id, new_text = args.update.split(',', 1)
            memory_manager.update_memory(memory_id.strip(), new_text.strip())
        except ValueError:
            print("❌ Update format should be: --update 'memory_id,new text'")
    elif args.browse:
        memory_manager.browse_memories_paginated(args.page_size)
    elif args.database:
        memory_manager.add_database_schema_info()
    elif args.dev_session:
        try:
            parts = args.dev_session.split(',', 2)
            if len(parts) >= 2:
                summary = parts[0].strip()
                changes = parts[1].strip()
                files = parts[2].strip().split(',') if len(parts) > 2 else None
                memory_manager.add_development_session(summary, changes, files)
            else:
                print("❌ Dev session format should be: --dev-session 'summary,changes,file1,file2'")
        except Exception as e:
            print(f"❌ Error parsing dev session: {e}")
    elif args.all:
        categories = [args.category] if args.category else None
        memory_manager.get_all_memories(categories=categories, keywords=args.keywords, 
                                       page=args.page, page_size=args.page_size)
    else:
        # Interactive mode
        print("🌟 Astrova Memory Manager - Advanced Features")
        print("1. Initialize project memory")
        print("2. Add new memory")
        print("3. Search memories")
        print("4. Show all memories")
        print("5. Browse by category")
        print("6. Search by keywords")
        print("7. Browse paginated")
        print("8. Show technology memories")
        
        choice = input("\nEnter your choice (1-8): ")
        
        if choice == "1":
            memory_manager.initialize_project_memory()
        elif choice == "2":
            content = input("Enter information to store: ")
            memory_manager.add_memory(content)
        elif choice == "3":
            query = input("Enter search query: ")
            memory_manager.search_memories(query)
        elif choice == "4":
            memory_manager.get_all_memories()
        elif choice == "5":
            category = input("Enter category (e.g., technology, misc): ")
            memory_manager.get_memories_by_category(category)
        elif choice == "6":
            keywords = input("Enter keywords to search: ")
            memory_manager.search_memories_with_keywords(keywords)
        elif choice == "7":
            memory_manager.browse_memories_paginated()
        elif choice == "8":
            memory_manager.get_technology_memories()
        else:
            print("Invalid choice!")

if __name__ == "__main__":
    main()
