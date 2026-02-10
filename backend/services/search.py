import requests
from typing import List, Dict, Any

def search_openalex(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Searches OpenAlex API for works matching the query.
    Filters: has_abstract=true, type=article
    """
    base_url = "https://api.openalex.org/works"
    params = {
        "search": query,
        "filter": "has_abstract:true,type:article",
        "per_page": limit,
        "sort": "relevance_score:desc"
    }
    
    # Identify our bot (polite pool)
    headers = {
        "User-Agent": "AcademicResearchAgent/1.0 (mailto:student@gcu.edu)"
    }

    try:
        response = requests.get(base_url, params=params, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        results = []
        for work in data.get("results", []):
            # Safe extraction
            authors = [a["author"]["display_name"] for a in work.get("authorships", [])]
            
            # Reconstruct abstract (OpenAlex stores it as an inverted index)
            abstract = None
            if work.get("abstract_inverted_index"):
                inv_index = work["abstract_inverted_index"]
                # Sort by position and join
                word_index = []
                for word, positions in inv_index.items():
                    for pos in positions:
                        word_index.append((pos, word))
                word_index.sort()
                abstract = " ".join([w[1] for w in word_index])

            result = {
                "id": work["id"],
                "title": work["display_name"],
                "authors": authors,
                "year": work["publication_year"],
                "abstract": abstract,
                "url": work.get("doi") or work.get("id"),
                "journal": work.get("primary_location", {}).get("source", {}).get("display_name", "Unknown Journal"),
                "volume": work.get("biblio", {}).get("volume", ""),
                "issue": work.get("biblio", {}).get("issue", ""),
                "pages": f"{work.get('biblio', {}).get('first_page', '')}-{work.get('biblio', {}).get('last_page', '')}"
            }
            results.append(result)
            
        return results

    except Exception as e:
        print(f"OpenAlex Error: {e}")
        return []
