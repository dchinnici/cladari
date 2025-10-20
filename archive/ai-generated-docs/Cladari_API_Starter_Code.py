# Cladari API Integration Examples


# Sample NCBI GenBank Query (Entrez Utilities)
import requests

def fetch_genbank_sequence(accession_id):
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    params = {
        "db": "nucleotide",
        "id": accession_id,
        "rettype": "fasta",
        "retmode": "text"
    }
    response = requests.get(base_url, params=params)
    if response.status_code == 200:
        return response.text
    else:
        return f"Error: {response.status_code}"

# Example: fetch_genbank_sequence("AY234567")



# Sample GBIF Species Lookup
import requests

def search_gbif_species(name):
    url = f"https://api.gbif.org/v1/species/match?name={name}"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    else:
        return f"Error: {response.status_code}"

# Example: search_gbif_species("Anthurium papillilaminum")
