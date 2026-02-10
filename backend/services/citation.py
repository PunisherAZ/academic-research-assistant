from typing import Dict, Any, Union

def generate_apa_citation(paper: Union[Dict[str, Any], Any]) -> str:
    """
    Formats a paper object into an APA 7th Edition citation string.
    Format: Author, A. A., & Author, B. B. (Year). Title of the article. Name of the Periodical, volume(issue), #-#. https://doi.org/xxx
    """
    # Handle both dict and Pydantic models
    if hasattr(paper, 'model_dump'):
        # Pydantic v2 model
        paper_dict = paper.model_dump()
    elif hasattr(paper, 'dict'):
        # Pydantic v1 model
        paper_dict = paper.dict()
    else:
        # Already a dict
        paper_dict = paper
    
    # 1. Authors
    authors_list = paper_dict.get("authors", [])
    if not authors_list:
        authors_str = "Unknown Author"
    elif len(authors_list) == 1:
        authors_str = format_author_name(authors_list[0])
    elif len(authors_list) == 2:
        authors_str = f"{format_author_name(authors_list[0])} & {format_author_name(authors_list[1])}"
    elif len(authors_list) <= 20:
        formatted = [format_author_name(a) for a in authors_list[:-1]]
        authors_str = ", ".join(formatted) + ", & " + format_author_name(authors_list[-1])
    else:
        # > 20 authors (APA 7th rule: list first 19 ... last author)
        formatted = [format_author_name(a) for a in authors_list[:19]]
        authors_str = ", ".join(formatted) + "... " + format_author_name(authors_list[-1])

    # 2. Year
    year = paper_dict.get("year", "n.d.")

    # 3. Title
    title = paper_dict.get("title", "Untitled")

    # 4. Source (Journal)
    journal = paper_dict.get("journal", "")
    volume = paper_dict.get("volume", "")
    issue = paper_dict.get("issue", "")
    pages = paper_dict.get("pages", "")
    
    source_str = ""
    if journal:
        source_str += f"{journal}" # Italics handled by frontend usually, but we return plain text here
        if volume:
            source_str += f", {volume}"
            if issue:
                source_str += f"({issue})"
        if pages:
            source_str += f", {pages}"

    # 5. DOI/URL
    url = paper_dict.get("url", "")
    
    citation = f"{authors_str} ({year}). {title}. {source_str}. {url}"
    return citation


def generate_mla_citation(paper: Union[Dict[str, Any], Any]) -> str:
    """
    Formats a paper object into an MLA 9th Edition citation string.
    Format: LastName, FirstName, and SecondAuthor. "Article Title." Journal Name, vol. #, no. #, Year, pp. #-#.
    """
    if hasattr(paper, 'model_dump'):
        paper_dict = paper.model_dump()
    elif hasattr(paper, 'dict'):
        paper_dict = paper.dict()
    else:
        paper_dict = paper
    
    # 1. Authors (MLA format)
    authors_list = paper_dict.get("authors", [])
    if not authors_list:
        authors_str = "Unknown Author"
    elif len(authors_list) == 1:
        authors_str = format_author_name_mla(authors_list[0])
    elif len(authors_list) == 2:
        authors_str = f"{format_author_name_mla(authors_list[0])}, and {format_author_first_last(authors_list[1])}"
    else:
        # 3+ authors: first author Last, First, et al.
        authors_str = f"{format_author_name_mla(authors_list[0])}, et al"

    # 2. Title (in quotes)
    title = paper_dict.get("title", "Untitled")
    
    # 3. Journal info
    journal = paper_dict.get("journal", "")
    volume = paper_dict.get("volume", "")
    issue = paper_dict.get("issue", "")
    year = paper_dict.get("year", "n.d.")
    pages = paper_dict.get("pages", "")
    
    source_str = ""
    if journal:
        source_str += f"{journal}"
        if volume:
            source_str += f", vol. {volume}"
        if issue:
            source_str += f", no. {issue}"
        source_str += f", {year}"
        if pages and pages != "-":
            source_str += f", pp. {pages}"
    
    citation = f'{authors_str}. "{title}." {source_str}.'
    return citation


def generate_chicago_citation(paper: Union[Dict[str, Any], Any]) -> str:
    """
    Formats a paper object into Chicago 17th Edition citation string (Notes & Bibliography).
    Format: FirstName LastName and SecondAuthor. "Article Title." Journal Name vol, no. # (Year): pages.
    """
    if hasattr(paper, 'model_dump'):
        paper_dict = paper.model_dump()
    elif hasattr(paper, 'dict'):
        paper_dict = paper.dict()
    else:
        paper_dict = paper
    
    # 1. Authors (Chicago format: First Last)
    authors_list = paper_dict.get("authors", [])
    if not authors_list:
        authors_str = "Unknown Author"
    elif len(authors_list) == 1:
        authors_str = format_author_first_last(authors_list[0])
    elif len(authors_list) == 2:
        authors_str = f"{format_author_first_last(authors_list[0])} and {format_author_first_last(authors_list[1])}"
    elif len(authors_list) <= 10:
        formatted = [format_author_first_last(a) for a in authors_list[:-1]]
        authors_str = ", ".join(formatted) + ", and " + format_author_first_last(authors_list[-1])
    else:
        # More than 10: list first 7 then et al.
        formatted = [format_author_first_last(a) for a in authors_list[:7]]
        authors_str = ", ".join(formatted) + ", et al"
    
    # 2. Title (in quotes)
    title = paper_dict.get("title", "Untitled")
    
    # 3. Journal info
    journal = paper_dict.get("journal", "")
    volume = paper_dict.get("volume", "")
    issue = paper_dict.get("issue", "")
    year = paper_dict.get("year", "n.d.")
    pages = paper_dict.get("pages", "")
    
    source_str = ""
    if journal:
        source_str += f"{journal}"
        if volume:
            source_str += f" {volume}"
            if issue:
                source_str += f", no. {issue}"
        if year:
            source_str += f" ({year})"
        if pages and pages != "-":
            source_str += f": {pages}"
    
    citation = f'{authors_str}. "{title}." {source_str}.'
    return citation


def format_author_name(name: str) -> str:
    """
    Converts 'John Doe' to 'Doe, J.' (APA format)
    """
    parts = name.split()
    if len(parts) < 2:
        return name
    surname = parts[-1]
    initials = "".join([f"{p[0]}." for p in parts[:-1]])
    return f"{surname}, {initials}"


def format_author_name_mla(name: str) -> str:
    """
    Converts 'John Doe' to 'Doe, John' (MLA format for first author)
    """
    parts = name.split()
    if len(parts) < 2:
        return name
    surname = parts[-1]
    first_names = " ".join(parts[:-1])
    return f"{surname}, {first_names}"


def format_author_first_last(name: str) -> str:
    """
    Returns name as 'John Doe' (Chicago/MLA subsequent authors)
    """
    return name
